import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: true, ...opts });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || `exit ${r.status}`);
    process.exit(r.status || 1);
  }
  return r.stdout;
}

run('railway', ['service', 'link', 'api']);

run('railway', [
  'variable',
  'set',
  'NODE_ENV=production',
  '--service',
  'api',
  '--skip-deploys',
  '--json',
]);

run('railway', [
  'variable',
  'set',
  'CORS_ORIGINS=https://indiantreks.in,https://www.indiantreks.in,http://localhost:3000',
  '--service',
  'api',
  '--skip-deploys',
  '--json',
]);

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error('DATABASE_URL missing from .env.local');
  process.exit(1);
}
const databaseUrl = match[1].trim().replace(/^['"]|['"]$/g, '');

const setDb = spawnSync(
  'railway',
  ['variable', 'set', 'DATABASE_URL', '--stdin', '--service', 'api', '--skip-deploys', '--json'],
  { input: databaseUrl, encoding: 'utf8', shell: true },
);
if (setDb.status !== 0) {
  console.error(setDb.stderr || setDb.stdout || 'failed setting DATABASE_URL');
  process.exit(setDb.status || 1);
}

const list = JSON.parse(run('railway', ['variable', 'list', '--service', 'api', '--json']));
const keys = Object.keys(list).sort();
console.log('Railway variables set:', keys.join(', '));
for (const key of keys) {
  console.log(`  ${key}: present (${String(list[key]).length} chars)`);
}
