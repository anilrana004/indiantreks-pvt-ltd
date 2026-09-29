/** Shared security helpers for URLs and user-provided strings. */

const BLOCKED_URL_SCHEMES = /^(javascript|data|vbscript):/i;

/** Default post-auth landing when returnTo/from is missing or unsafe. */
export const DEFAULT_SAFE_RETURN_PATH = '/user-dashboard';

/**
 * Allowlisted internal path prefixes for login/signup/OAuth returnTo.
 * Rejects open redirects (absolute URLs, protocol-relative, backslash tricks).
 */
const SAFE_RETURN_PREFIXES = [
  '/user-dashboard',
  '/booking',
  '/profile',
  '/treks',
  '/trips',
  '/yatra',
  '/gear',
  '/about',
  '/contact',
  '/blog',
  '/winter-treks',
] as const;

/**
 * Sanitize user-controlled returnTo/from query values.
 * Only relative, same-origin application paths are allowed.
 */
export function safeReturnPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_SAFE_RETURN_PATH,
): string {
  if (!value) return fallback;

  let raw = value.trim();
  try {
    // Decode once; reject if still encoded tricks remain ambiguous.
    raw = decodeURIComponent(raw).trim();
  } catch {
    return fallback;
  }

  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback;
  if (raw.includes('\\')) return fallback;
  if (raw.includes('://')) return fallback;
  if (/[\0\r\n\t]/.test(raw)) return fallback;
  if (BLOCKED_URL_SCHEMES.test(raw)) return fallback;

  // Disallow path-relative escapes that browsers may resolve oddly.
  if (raw.includes('@')) return fallback;

  const pathOnly = raw.split('?')[0]!.split('#')[0]!;
  const allowed =
    pathOnly === '/' ||
    SAFE_RETURN_PREFIXES.some((prefix) => {
      if (prefix.endsWith('/')) return pathOnly.startsWith(prefix);
      return pathOnly === prefix || pathOnly.startsWith(`${prefix}/`);
    });

  return allowed ? raw : fallback;
}

export function isSafeHttpUrl(value: string | undefined | null): boolean {
  if (!value?.trim()) return true;
  const trimmed = value.trim();
  if (BLOCKED_URL_SCHEMES.test(trimmed)) return false;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return trimmed.startsWith('/') && !trimmed.startsWith('//');
  }
}

export function assertSafeHttpUrl(value: string | undefined | null, field: string): string | undefined {
  if (!value?.trim()) return undefined;
  if (!isSafeHttpUrl(value)) {
    throw new Error(`${field} must be a valid http(s) URL or site-relative path`);
  }
  return value.trim();
}

export function clampPaginationLimit(limit: number, max = 100): number {
  if (!Number.isFinite(limit) || limit < 1) return 20;
  return Math.min(max, Math.floor(limit));
}

export function clampPaginationOffset(offset: number): number {
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.floor(offset);
}
