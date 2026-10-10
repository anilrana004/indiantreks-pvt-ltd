import { isProductionRuntime } from '@/lib/env/is-production';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();
const DEV_SESSION_SECRET = 'indiantreks-dev-session-secret';
const DEV_ADMIN_PASSWORD = 'admin123';

/**
 * Resolve the HMAC secret used to sign admin session cookies.
 * Prefer ADMIN_SESSION_SECRET (32+). In production, if it is missing,
 * derive a stable secret from strong ADMIN_EMAIL + ADMIN_PASSWORD so a
 * misconfigured deploy still accepts valid admin logins.
 */
async function sessionSecret(): Promise<string> {
  const configured = process.env.ADMIN_SESSION_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;

  if (!isProductionRuntime()) {
    return configured || process.env.ADMIN_PASSWORD || DEV_SESSION_SECRET;
  }

  // Production: expand a short explicit secret, or derive from admin credentials.
  if (configured && configured.length > 0) {
    return sha256Hex(`indiantreks-admin-session|configured|${configured}`);
  }

  const email = process.env.ADMIN_EMAIL?.trim() ?? '';
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (email && password.length >= 8 && password !== DEV_ADMIN_PASSWORD) {
    return sha256Hex(`indiantreks-admin-session|${email}|${password}`);
  }

  throw new Error(
    'ADMIN_SESSION_SECRET must be set (32+ random chars) in production. Add it in the Vercel project environment variables.',
  );
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signPayload(payload: string): Promise<string> {
  const key = await importHmacKey(await sessionSecret());
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return bufferToBase64Url(new Uint8Array(signature));
}

function bufferToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/** Create a signed admin session token (email + expiry + HMAC). */
export async function createAdminSessionToken(email: string): Promise<string> {
  const exp = String(Date.now() + SESSION_TTL_MS);
  const payload = `${email}|${exp}`;
  const signature = await signPayload(payload);
  return bufferToBase64Url(encoder.encode(`${payload}|${signature}`));
}

/** Verify signed session; returns admin email when valid. */
export async function verifyAdminSessionToken(
  token: string | undefined | null,
): Promise<{ email: string } | null> {
  if (!token) return null;

  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(token));
    const parts = decoded.split('|');
    if (parts.length !== 3) return null;

    const [email, expStr, signature] = parts;
    if (!email || !expStr || !signature) return null;

    const payload = `${email}|${expStr}`;
    const expected = await signPayload(payload);
    const sigBuf = base64UrlToBytes(signature);
    const expBuf = base64UrlToBytes(expected);
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;

    return { email };
  } catch {
    return null;
  }
}

export function adminSessionCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}
