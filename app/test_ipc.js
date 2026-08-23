const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

console.log('Spawning python sidecar...');
const sidecarDir = path.join(__dirname, '../sidecar');
const pythonExecutable = path.join(sidecarDir, 'venv', 'bin', 'python');

const sidecarProcess = spawn(pythonExecutable, ['main.py'], {
  cwd: sidecarDir,
});

sidecarProcess.stdout.on('data', (data) => {
  console.log(`Sidecar: ${data}`);
});

sidecarProcess.stderr.on('data', (data) => {
  console.error(`Sidecar Error: ${data}`);
});

const checkHealth = () => {
  http.get('http://127.0.0.1:8000/health', (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      console.log(`\n=== SUCCESS ===`);
      console.log(`[IPC Spike Validation] Sidecar Health Check Response: ${data}`);
      console.log(`=== SPIKE COMPLETED ===\n`);
      sidecarProcess.kill();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.log('Sidecar not ready yet, retrying in 1s...');
    setTimeout(checkHealth, 1000);
  });
};

setTimeout(checkHealth, 1000);
