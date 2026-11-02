// backend/services/vectorService.js
import * as dotenv from 'dotenv';
dotenv.config();

import { profiles, getProfileDocumentText } from '../data/profiles.js';

let pineconeClient = null;
let geminiEmbedder = null;
let geminiKeyValidated = false;
let geminiKeyValid = true;

async function getPineconeClient() {
  if (pineconeClient) return pineconeClient;
  if (!process.env.PINECONE_API_KEY) return null;
  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    return pineconeClient;
  } catch (err) {
    console.warn('[VectorService] Pinecone init failed:', err.message);
    return null;
  }
}

async function getGeminiEmbedder() {
  if (!geminiKeyValid) return null;
  if (geminiEmbedder) return geminiEmbedder;
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const { GoogleGenerativeAIEmbeddings } = await import('@langchain/google-genai');
    geminiEmbedder = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });
    return geminiEmbedder;
  } catch (err) {
    console.warn('[VectorService] Gemini embeddings init failed:', err.message);
    return null;
  }
}

/**
 * Perform local semantic / token similarity match against profiles
 */
export function searchLocalProfiles(query, topK = 10) {
  const qClean = query.toLowerCase();
  const qTokens = qClean
    .replace(/[^a-z0-9+#.-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  const scored = profiles.map(profile => {
    let score = 0;
    const matchedSkills = [];

    // 1. Skill matches (heavily weighted)
    for (const skill of profile.skills) {
      const sLower = skill.toLowerCase();
      if (qClean.includes(sLower)) {
        score += 3.0;
        matchedSkills.push(skill);
      } else {
        const parts = sLower.split(/[\s/]+/);
        if (parts.some(p => p.length > 2 && qClean.includes(p))) {
          score += 1.5;
          matchedSkills.push(skill);
        }
      }
    }

    // 2. Job sector / title matches
    const sectorLower = profile.jobSector.toLowerCase();
    const titleLower = profile.title.toLowerCase();
    if (qClean.includes(sectorLower)) {
      score += 2.5;
    } else {
      for (const token of qTokens) {
        if (sectorLower.includes(token) || titleLower.includes(token)) {
          score += 1.0;
        }
      }
    }

    // 3. Location match
    if (qClean.includes(profile.location.toLowerCase())) {
      score += 1.5;
    }

    // 4. Education match
    if (qClean.includes(profile.education.toLowerCase())) {
      score += 1.0;
    }

    // Baseline relevance
    const rawScore = score / (profile.skills.length + 3);
    const normalizedScore = Math.min(0.98, Math.max(0.40, rawScore + 0.35));

    return {
      profile,
      score: Number(normalizedScore.toFixed(3)),
      matchedSkills: [...new Set(matchedSkills)],
      source: 'local_semantic_engine'
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Query Pinecone if online, otherwise fallback cleanly to local matching engine
 */
export async function matchOpportunities(query, topK = 6) {
  const pc = await getPineconeClient();
  const embedder = await getGeminiEmbedder();
  const indexName = process.env.PINECONE_INDEX_NAME || 'internship';

  if (pc && embedder) {
    try {
      const pineconeIndex = pc.Index(indexName);
      const queryVector = await embedder.embedQuery(query);

      const searchResults = await pineconeIndex.query({
        topK,
        vector: queryVector,
        includeMetadata: true,
      });

      if (searchResults && searchResults.matches && searchResults.matches.length > 0) {
        const matches = searchResults.matches.map(m => {
          const profileId = m.metadata?.id ?? parseInt(m.id, 10);
          const found = profiles.find(p => p.id === profileId) || {
            id: profileId,
            title: m.metadata?.jobSector || 'Candidate Profile',
            skills: m.metadata?.skills ? m.metadata.skills.split(', ') : [],
            jobSector: m.metadata?.jobSector || '',
            education: m.metadata?.education || '',
            location: m.metadata?.location || '',
          };

          return {
            profile: found,
            score: Number((m.score || 0.85).toFixed(3)),
            matchedSkills: found.skills.filter(s => query.toLowerCase().includes(s.toLowerCase())),
            source: 'pinecone_gemini_vector_db'
          };
        });
        return {
          source: 'pinecone',
          indexName,
          matches
        };
      }
    } catch (err) {
      if (!geminiKeyValidated) {
        geminiKeyValidated = true;
        geminiKeyValid = false;
        console.log('[VectorService] Notice: Gemini/Pinecone API key offline or invalid. Seamlessly using local semantic matcher.');
      }
    }
  }

  // Graceful semantic fallback
  const matches = searchLocalProfiles(query, topK);
  return {
    source: 'local_engine',
    message: pc && embedder ? 'Pinecone index empty or offline; matched via local semantic search' : 'Running on local semantic matching engine',
    matches
  };
}

/**
 * Sync profiles to Pinecone
 */
export async function indexProfilesToPinecone() {
  const pc = await getPineconeClient();
  const embedder = await getGeminiEmbedder();
  const indexName = process.env.PINECONE_INDEX_NAME || 'internship';

  if (!pc || !embedder) {
    throw new Error('Pinecone or Gemini API keys missing in .env');
  }

  // Check if index exists, create if not
  const existingIndexes = await pc.listIndexes();
  const hasIndex = existingIndexes.indexes?.some(i => i.name === indexName);

  if (!hasIndex) {
    console.log(`[VectorService] Creating Pinecone index '${indexName}'...`);
    await pc.createIndex({
      name: indexName,
      dimension: 768,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    // Give it a few seconds to initialize
    await new Promise(r => setTimeout(r, 5000));
  }

  const { Document } = await import('@langchain/core/documents');
  const { PineconeStore } = await import('@langchain/pinecone');

  const chunkedDocs = profiles.map(p =>
    new Document({
      pageContent: getProfileDocumentText(p),
      metadata: {
        id: p.id,
        jobSector: p.jobSector,
        education: p.education,
        location: p.location,
        skills: p.skills.join(', '),
        source: 'userProfiles'
      }
    })
  );

  const pineconeIndex = pc.Index(indexName);
  await PineconeStore.fromDocuments(chunkedDocs, embedder, {
    pineconeIndex,
    maxConcurrency: 2,
  });

  return { success: true, count: chunkedDocs.length, indexName };
}

/**
 * Health & Vector DB diagnostics
 */
export async function getVectorStatus() {
  const pc = await getPineconeClient();
  const embedder = await getGeminiEmbedder();
  const indexName = process.env.PINECONE_INDEX_NAME || 'internship';

  let pineconeOnline = false;
  let indexStats = null;
  let errorMsg = null;

  if (pc) {
    try {
      const list = await pc.listIndexes();
      const hasIndex = list.indexes?.some(i => i.name === indexName);
      if (hasIndex) {
        const idx = pc.Index(indexName);
        indexStats = await idx.describeIndexStats();
        pineconeOnline = true;
      }
    } catch (e) {
      errorMsg = e.message;
    }
  }

  return {
    pineconeConfigured: !!process.env.PINECONE_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    pineconeOnline,
    indexName,
    indexStats,
    error: errorMsg,
    totalProfiles: profiles.length,
    activeEngine: pineconeOnline ? 'Pinecone Vector DB + Gemini Embeddings' : 'Local Semantic Matcher (Zero Downtime)'
  };
}

