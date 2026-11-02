// frontend/src/services/api.js

const BASE_URL = '/api';

export async function getHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function classifyResume({ file, text, topK = 3 }) {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/classify?top_k=${topK}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Resume classification failed');
    }
    return res.json();
  } else if (text) {
    const res = await fetch(`${BASE_URL}/classify?top_k=${topK}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Text classification failed');
    }
    return res.json();
  }
  throw new Error('Please select a file or provide text');
}

export async function matchOpportunities({ query, topK = 6, sector, location, education }) {
  const res = await fetch(`${BASE_URL}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, topK, sector, location, education })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Search query failed');
  }
  return res.json();
}

export async function matchFromResume({ file, text, topK = 3 }) {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/match-from-resume?top_k=${topK}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Resume matching failed');
    }
    return res.json();
  } else if (text) {
    const res = await fetch(`${BASE_URL}/match-from-resume?top_k=${topK}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Resume matching failed');
    }
    return res.json();
  }
  throw new Error('Please select a file or enter text');
}

export async function getProfiles({ search, sector, location, education, page = 1, limit = 12 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (sector) params.append('sector', sector);
  if (location) params.append('location', location);
  if (education) params.append('education', education);
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${BASE_URL}/profiles?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load profiles');
  return res.json();
}

export async function indexProfiles() {
  const res = await fetch(`${BASE_URL}/profiles/index`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Indexing to Pinecone failed');
  }
  return res.json();
}

