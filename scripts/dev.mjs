import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const isWindows = process.platform === 'win32';

function runDocker(args) {
  return spawnSync('docker', ['compose', ...args], {
    stdio: 'inherit',
    shell: isWindows,
  });
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (isWindows) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

const db = runDocker(['up', '-d', '--wait']);
if (db.status !== 0) {
  console.error('No se pudo levantar la base de datos.');
  process.exit(db.status ?? 1);
}

const servers = spawn(
  isWindows ? 'npx.cmd' : 'npx',
  [
    '--no-install', 'concurrently',
    '--kill-others',
    '--names', 'api,web',
    '--prefix-colors', 'blue,green',
    'npm:dev:backend', 'npm:dev:frontend',
  ],
  { stdio: 'inherit', shell: isWindows, detached: !isWindows },
);

let cleaningUp = false;

function shutdown(code = 0) {
  if (cleaningUp) return;
  cleaningUp = true;
  killTree(servers);
  runDocker(['down']);
  process.exit(code);
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

servers.on('exit', (code) => shutdown(code ?? 0));
servers.on('error', (err) => {
  console.error(err);
  shutdown(1);
});
