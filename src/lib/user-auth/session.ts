import { isProductionRuntime } from '@/lib/env/is-production';
import { USER_COOKIE, USER_SESSION_TTL_MS } from '@/lib/user-auth/constants';

const encoder = new TextEncoder();
const DEV_USER_SESSION_SECRET = 'indiantreks-dev-user-session-secret';

function sessionSecret(): string {
  const userSecret = process.env.USER_SESSION_SECRET?.trim();

  if (isProductionRuntime()) {
    if (!userSecret || userSecret.length < 32) {
      throw new Error('USER_SESSION_SECRET must be set (32+ chars) in production');
    }
    return userSecret;
  }

  return userSecret || DEV_USER_SESSION_SECRET;
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
  const key = await importHmacKey(sessionSecret());
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

export type UserSessionPayload = {
  userId: string;
  email: string;
  sessionVersion: number;
};

/**
 * Create a signed customer session token.
 * Format: userId|email|exp|sessionVersion|hmac
 */
export async function createUserSessionToken(
  userId: string,
  email: string,
  sessionVersion = 0,
): Promise<string> {
  const exp = String(Date.now() + USER_SESSION_TTL_MS);
  const sv = String(Math.max(0, Math.floor(sessionVersion) || 0));
  const payload = `${userId}|${email}|${exp}|${sv}`;
  const signature = await signPayload(payload);
  return bufferToBase64Url(encoder.encode(`${payload}|${signature}`));
}

/** Verify signed customer session; returns userId + email + sessionVersion when valid. */
export async function verifyUserSessionToken(
  token: string | undefined | null,
): Promise<UserSessionPayload | null> {
  if (!token) return null;

  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(token));
    const parts = decoded.split('|');
    // New format: 5 parts. Reject legacy 4-part tokens (forces re-login after hardening).
    if (parts.length !== 5) return null;

    const [userId, email, expStr, svStr, signature] = parts;
    if (!userId || !email || !expStr || !svStr || !signature) return null;

    const payload = `${userId}|${email}|${expStr}|${svStr}`;
    const expected = await signPayload(payload);
    const sigBuf = base64UrlToBytes(signature);
    const expBuf = base64UrlToBytes(expected);
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;

    const sessionVersion = Number(svStr);
    if (!Number.isFinite(sessionVersion) || sessionVersion < 0) return null;

    return { userId, email, sessionVersion };
  } catch {
    return null;
  }
}

export function userSessionCookieOptions() {
  const secure = isProductionRuntime() || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: USER_SESSION_TTL_MS / 1000,
  };
}

export { USER_COOKIE };
