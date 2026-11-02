// backend/server.js
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';

import { profiles } from './data/profiles.js';
import { matchOpportunities, indexProfilesToPinecone, getVectorStatus } from './services/vectorService.js';
import { checkMlHealth, classifyResumeText, classifyResumeFile, extractKeywords } from './services/mlClient.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Upload storage
const upload = multer({
  dest: path.join(os.tmpdir(), 'internship_engine_uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----------------- Routes -----------------

// 1. System Health
app.get('/api/health', async (req, res) => {
  try {
    const mlHealth = await checkMlHealth();
    const vectorStatus = await getVectorStatus();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mlClassifier: mlHealth,
        vectorSearch: vectorStatus
      },
      profilesCount: profiles.length
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 2. Classify Resume (File or Text)
app.post('/api/classify', upload.single('file'), async (req, res) => {
  try {
    const topK = parseInt(req.query.top_k || req.body.top_k || '3', 10);
    let result;
    let extractedSkills = [];

    if (req.file) {
      result = await classifyResumeFile(req.file.path, req.file.originalname, topK);
      // Clean up temp file
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      if (result.extracted_text_preview) {
        extractedSkills = extractKeywords(result.extracted_text_preview);
      }
    } else if (req.body.text) {
      result = await classifyResumeText(req.body.text, topK);
      extractedSkills = extractKeywords(req.body.text);
    } else {
      return res.status(400).json({ error: 'Please provide either a resume file or text.' });
    }

    res.json({
      ...result,
      detected_skills: extractedSkills
    });
  } catch (err) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    console.error('[Classify Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Search & Match Opportunities / Profiles
app.post('/api/match', async (req, res) => {
  try {
    const { query, topK = 6, sector, location, education } = req.body;
    let fullQuery = query || '';

    if (sector) fullQuery += ` sector: ${sector}`;
    if (location) fullQuery += ` location: ${location}`;
    if (education) fullQuery += ` education: ${education}`;

    if (!fullQuery.trim()) {
      return res.status(400).json({ error: 'Please provide search keywords or filters.' });
    }

    const matchResults = await matchOpportunities(fullQuery.trim(), parseInt(topK, 10));
    res.json(matchResults);
  } catch (err) {
    console.error('[Match Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Combined: Upload Resume -> Classify Domain -> Instant Opportunity Match
app.post('/api/match-from-resume', upload.single('file'), async (req, res) => {
  try {
    const topK = parseInt(req.query.top_k || '3', 10);
    let classification;
    let rawText = req.body.text || '';
    let extractedSkills = [];

    if (req.file) {
      classification = await classifyResumeFile(req.file.path, req.file.originalname, topK);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      rawText = classification.extracted_text_preview || '';
    } else if (rawText) {
      classification = await classifyResumeText(rawText, topK);
    } else {
      return res.status(400).json({ error: 'Please provide either a resume file or text.' });
    }

    extractedSkills = extractKeywords(rawText);
    const topRole = classification.predictions?.[0]?.label || '';
    const matchQuery = `${topRole} ${extractedSkills.join(' ')} ${rawText.slice(0, 200)}`.trim();

    const matches = await matchOpportunities(matchQuery, 6);

    res.json({
      classification,
      detectedSkills: extractedSkills,
      matchQuery,
      matches
    });
  } catch (err) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    console.error('[MatchFromResume Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Browse Profiles Directory
app.get('/api/profiles', (req, res) => {
  const { search, sector, location, education, page = 1, limit = 12 } = req.query;
  let filtered = [...profiles];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.jobSector.toLowerCase().includes(s) ||
      p.skills.some(sk => sk.toLowerCase().includes(s)) ||
      p.location.toLowerCase().includes(s)
    );
  }

  if (sector) {
    filtered = filtered.filter(p => p.jobSector.toLowerCase() === sector.toLowerCase());
  }

  if (location) {
    filtered = filtered.filter(p => p.location.toLowerCase() === location.toLowerCase());
  }

  if (education) {
    filtered = filtered.filter(p => p.education.toLowerCase() === education.toLowerCase());
  }

  const pNum = parseInt(page, 10);
  const lNum = parseInt(limit, 10);
  const start = (pNum - 1) * lNum;
  const paginated = filtered.slice(start, start + lNum);

  // Extract unique filter facets
  const allSectors = [...new Set(profiles.map(p => p.jobSector))].sort();
  const allLocations = [...new Set(profiles.map(p => p.location))].sort();
  const allEducations = [...new Set(profiles.map(p => p.education))].sort();

  res.json({
    total: filtered.length,
    page: pNum,
    totalPages: Math.ceil(filtered.length / lNum),
    profiles: paginated,
    facets: {
      sectors: allSectors,
      locations: allLocations,
      educations: allEducations
    }
  });
});

// 6. Index Profiles to Pinecone
app.post('/api/profiles/index', async (req, res) => {
  try {
    const result = await indexProfilesToPinecone();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Internship Engine Backend] Running at http://localhost:${PORT}`);
});

