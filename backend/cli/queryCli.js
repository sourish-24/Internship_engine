// backend/cli/queryCli.js
import readlineSync from 'readline-sync';
import { matchOpportunities } from '../services/vectorService.js';

async function run() {
  console.log('=== Internship Engine Vector Search CLI ===');
  console.log('Type your criteria (e.g. "React developer in Bangalore") or "exit" to quit.\n');

  while (true) {
    const input = readlineSync.question('Enter search parameters > ');
    if (!input || input.trim().toLowerCase() === 'exit') {
      console.log('Goodbye!');
      break;
    }

    console.log(`\nSearching matches for: "${input.trim()}"...`);
    const results = await matchOpportunities(input.trim(), 5);

    console.log(`Source: ${results.source}`);
    console.log('--------------------------------------------------');
    results.matches.forEach((m, idx) => {
      console.log(`[#${idx + 1}] Match Score: ${(m.score * 100).toFixed(1)}% | ${m.profile.title}`);
      console.log(`     Skills: ${m.profile.skills.join(', ')}`);
      console.log(`     Role: ${m.profile.jobSector} | Education: ${m.profile.education} | Location: ${m.profile.location}`);
      if (m.matchedSkills?.length) {
        console.log(`     Matched Skills: ${m.matchedSkills.join(', ')}`);
      }
      console.log('--------------------------------------------------');
    });
    console.log('\n');
  }
}

run();

