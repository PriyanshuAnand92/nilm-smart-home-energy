import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectDir = dirname(fileURLToPath(import.meta.url));
const viteCli = resolve(projectDir, 'node_modules/vite/bin/vite.js');
const children = [
  spawn(process.execPath, ['server.js'], { cwd: projectDir, stdio: 'inherit' }),
  spawn(process.execPath, [viteCli, '--host', '0.0.0.0', '--port', '3000', '--strictPort'], {
    cwd: projectDir,
    stdio: 'inherit',
    env: process.env,
  }),
];

let stopping = false;
function stop(signal = 'SIGTERM', exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }
  setTimeout(() => process.exit(exitCode), 1000).unref();
}

for (const child of children) {
  child.on('error', (error) => {
    console.error('Failed to start a web app process:', error);
    stop('SIGTERM', 1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      const exitCode = code ?? (signal ? 1 : 0);
      console.error(`A web app process exited (${signal ?? `code ${exitCode}`}); stopping the other process.`);
      stop('SIGTERM', exitCode);
    }
  });
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
