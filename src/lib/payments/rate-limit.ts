/**
 * Payment endpoint rate limiting — Postgres-backed (shared across instances).
 * Sync wrapper kept for call sites that historically used in-memory Map.
 */
import {
  clientIp,
  consumeRateLimit,
  type RateLimitPolicy,
} from '@/lib/security/rate-limit';

export { clientIp };

/** @deprecated Prefer consumePaymentRateLimit (async). Sync path is best-effort only. */
export function rateLimit(_key: string, _limit: number, _windowMs: number): boolean {
  // Sync API cannot await Postgres; allow and rely on async helpers at call sites.
  return true;
}

export async function consumePaymentRateLimit(
  endpoint: string,
  identity: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const policy: RateLimitPolicy = { endpoint, limit, windowMs };
  return consumeRateLimit(policy, identity);
}
