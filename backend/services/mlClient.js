// backend/services/mlClient.js
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const ML_BASE_URL = process.env.ML_BASE_URL || 'http://127.0.0.1:5000';

export async function checkMlHealth() {
  try {
    const res = await axios.get(`${ML_BASE_URL}/health`, { timeout: 3000 });
    return { online: true, data: res.data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function classifyResumeText(text, topK = 3) {
  try {
    const res = await axios.post(`${ML_BASE_URL}/predict?top_k=${topK}`, { text }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message);
  }
}

export async function classifyResumeFile(filePath, originalFilename, topK = 3) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), originalFilename);

    const res = await axios.post(`${ML_BASE_URL}/predict?top_k=${topK}`, form, {
      headers: form.getHeaders(),
      timeout: 15000
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message);
  }
}

/**
 * Helper to extract likely technical skills and keywords from resume text
 */
export function extractKeywords(text) {
  if (!text) return [];
  const knownKeywords = [
    'python', 'javascript', 'typescript', 'react', 'node.js', 'vue', 'angular',
    'django', 'flask', 'fastapi', 'spring', 'java', 'c++', 'c#', 'golang', 'rust',
    'sql', 'postgres', 'mongodb', 'redis', 'aws', 'docker', 'kubernetes', 'terraform',
    'pytorch', 'tensorflow', 'keras', 'nlp', 'transformers', 'machine learning',
    'deep learning', 'data science', 'tableau', 'power bi', 'excel', 'figma', 'ui/ux',
    'flutter', 'dart', 'swift', 'kotlin', 'android', 'ios', 'graphql', 'rest api',
    'solidity', 'blockchain', 'cybersecurity', 'devops', 'linux', 'git', 'ci/cd'
  ];

  const tLower = text.toLowerCase();
  return knownKeywords.filter(kw => tLower.includes(kw));
}

