// start-dev.js - Unified development runner
import { spawn } from 'child_process';
import process from 'process';

console.log('====================================================');
console.log('   🚀 Launching Internship Engine Full Stack');
console.log('   1. Python Flask ML Service (Port 5000)');
console.log('   2. Express API Backend (Port 3001)');
console.log('   3. Vite React Frontend (Port 5173)');
console.log('====================================================\n');

function runProcess(name, cmd, args, cwd = process.cwd()) {
  const isWindows = process.platform === 'win32';
  const executable = isWindows && cmd === 'npm' ? 'npm.cmd' : cmd;

  const child = spawn(executable, args, {
    cwd,
    stdio: 'pipe',
    shell: isWindows
  });

  child.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text) console.log(`[${name}] ${text}`);
  });

  child.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (!text) return;
    // Werkzeug and tqdm log regular info to stderr by default
    const isInfo = text.includes('HTTP/1.1') ||
                   text.includes('Loading weights:') ||
                   text.includes('Running on') ||
                   text.includes('Press CTRL+C') ||
                   text.includes('InconsistentVersionWarning') ||
                   text.includes('baseline-browser-mapping');
    if (isInfo) {
      console.log(`[${name}] ${text}`);
    } else {
      console.error(`[${name} ERR] ${text}`);
    }
  });

  child.on('close', (code) => {
    console.log(`[${name}] Exited with code ${code}`);
  });

  return child;
}

const processes = [];

// 1. Python ML Service
console.log('Starting Python ML service (DistilBERT)...');
processes.push(runProcess('ML', 'python', ['ml/app.py']));

// 2. Node Backend Service
console.log('Starting Node.js Backend API...');
processes.push(runProcess('API', 'node', ['backend/server.js']));

// 3. Frontend Dev Server
console.log('Starting React Vite Frontend...');
processes.push(runProcess('VITE', 'npm', ['--prefix', 'frontend', 'run', 'dev']));

function cleanup() {
  console.log('\nShutting down all processes...');
  processes.forEach(p => p.kill());
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

