/**
 * Phase 11 — push Production env to linked Vercel project.
 * Values are passed via stdin to avoid shell metacharacter breakage (& in URLs).
 * Does NOT set NEXT_PUBLIC_API_URL, APP_ROLE, GOOGLE_REDIRECT_URI, or MongoDB vars.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function setEnv(name, value, { sensitive = true } = {}) {
  if (value === undefined || value === null || String(value).length === 0) {
    console.log(`SKIP ${name} (empty)`);
    return;
  }

  const args = ['env', 'add', name, 'production', '--yes', '--force'];
  if (sensitive) args.push('--sensitive');
  else args.push('--no-sensitive');

  const r = spawnSync('vercel', args, {
    input: String(value),
    encoding: 'utf8',
    shell: true,
  });

  if (r.status !== 0) {
    const msg = `${r.stderr || ''}\n${r.stdout || ''}`.trim();
    // Treat "already exists" style races as ok when --force used; still throw hard failures
    if (!/Added\s+|Updated\s+|Saving/i.test(msg) && r.status !== 0) {
      console.error(`FAIL ${name}: ${msg.slice(0, 300)}`);
      process.exitCode = 1;
      return;
    }
  }
  console.log(`SET  ${name} (${String(value).length} chars)`);
}

const local = parseEnvFile('.env.local');
const secretsFile = '.vercel-prod-secrets.local';
const existingSecrets = parseEnvFile(secretsFile);
const randomSecret = () => crypto.randomBytes(48).toString('base64url');

const adminPassword =
  existingSecrets.ADMIN_PASSWORD ||
  (local.ADMIN_PASSWORD && local.ADMIN_PASSWORD !== 'admin123' && local.ADMIN_PASSWORD.length >= 12
    ? local.ADMIN_PASSWORD
    : randomSecret().slice(0, 24));

const adminSession =
  existingSecrets.ADMIN_SESSION_SECRET ||
  (local.ADMIN_SESSION_SECRET && local.ADMIN_SESSION_SECRET.length >= 32
    ? local.ADMIN_SESSION_SECRET
    : randomSecret());

const userSession =
  existingSecrets.USER_SESSION_SECRET ||
  (local.USER_SESSION_SECRET &&
  local.USER_SESSION_SECRET.length >= 32 &&
  !local.USER_SESSION_SECRET.includes('change-me')
    ? local.USER_SESSION_SECRET
    : randomSecret());

const adminEmail = local.ADMIN_EMAIL || existingSecrets.ADMIN_EMAIL || 'admin@indiantreks.com';

fs.writeFileSync(
  secretsFile,
  [
    '# Generated/selected for Vercel Production (Phase 11). Keep private. Do not commit.',
    `ADMIN_EMAIL=${adminEmail}`,
    `ADMIN_PASSWORD=${adminPassword}`,
    `ADMIN_SESSION_SECRET=${adminSession}`,
    `USER_SESSION_SECRET=${userSession}`,
    'NEXT_PUBLIC_SITE_URL=https://indiantreks.in',
    '',
    '# Google: leave GOOGLE_REDIRECT_URI unset on Vercel.',
    '',
  ].join('\n'),
  'utf8',
);
console.log(`Wrote ${secretsFile} (gitignored)`);

const pairs = [
  ['NEXT_PUBLIC_SITE_URL', 'https://indiantreks.in', false],
  ['NEXT_PUBLIC_MAPBOX_TOKEN', local.NEXT_PUBLIC_MAPBOX_TOKEN, false],
  [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    local.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || local.CLOUDINARY_CLOUD_NAME,
    false,
  ],
  ['DATABASE_URL', local.DATABASE_URL, true],
  ['ADMIN_EMAIL', adminEmail, true],
  ['ADMIN_PASSWORD', adminPassword, true],
  ['ADMIN_SESSION_SECRET', adminSession, true],
  ['USER_SESSION_SECRET', userSession, true],
  ['CLOUDINARY_CLOUD_NAME', local.CLOUDINARY_CLOUD_NAME, false],
  ['CLOUDINARY_API_KEY', local.CLOUDINARY_API_KEY, true],
  ['CLOUDINARY_API_SECRET', local.CLOUDINARY_API_SECRET, true],
  ['CLOUDINARY_UPLOAD_PRESET', local.CLOUDINARY_UPLOAD_PRESET, false],
  ['GOOGLE_CLIENT_ID', local.GOOGLE_CLIENT_ID, false],
  ['GOOGLE_CLIENT_SECRET', local.GOOGLE_CLIENT_SECRET, true],
  ['RAZORPAY_MODE', local.RAZORPAY_MODE || 'test', false],
  ['RAZORPAY_KEY_ID', local.RAZORPAY_KEY_ID, false],
  ['RAZORPAY_KEY_SECRET', local.RAZORPAY_KEY_SECRET, true],
  ['RAZORPAY_WEBHOOK_SECRET', local.RAZORPAY_WEBHOOK_SECRET, true],
  ['RAZORPAY_MERCHANT_NAME', local.RAZORPAY_MERCHANT_NAME || 'Indian Treks', false],
  ['RAZORPAY_THEME_COLOR', local.RAZORPAY_THEME_COLOR || '#16a34a', false],
  ['BOOKING_PAYMENT_HOLD_MINUTES', local.BOOKING_PAYMENT_HOLD_MINUTES || '30', false],
];

for (const [name, value, sensitive] of pairs) {
  setEnv(name, value, { sensitive });
}

console.log('\nNOT set: NEXT_PUBLIC_API_URL, APP_ROLE, GOOGLE_REDIRECT_URI, MONGODB_*');
console.log('Done.');
