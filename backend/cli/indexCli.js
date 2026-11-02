// backend/cli/indexCli.js
import { indexProfilesToPinecone } from '../services/vectorService.js';

async function run() {
  console.log('--- Starting Profile Indexing to Pinecone ---');
  try {
    const res = await indexProfilesToPinecone();
    console.log(`Success! Indexed ${res.count} profiles into Pinecone index '${res.indexName}'`);
  } catch (err) {
    console.error('Indexing failed:', err.message);
  }
}

run();

