import { sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

export type RateLimitPolicy = {
  /** Logical endpoint name, e.g. auth.login */
  endpoint: string;
  /** Max allowed hits in the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
};

export function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function bucketKey(policy: RateLimitPolicy, identity: string): string {
  return `rate:${policy.endpoint}:${identity}`;
}

function logRateLimit(event: string, data: Record<string, unknown>) {
  console.info(JSON.stringify({ scope: 'rate_limit', event, ...data }));
}

/**
 * Atomic fixed-window limiter via Postgres upsert.
 * Returns false when over limit.
 * @param failClosed when true (default), DB errors deny the request.
 */
export async function consumeRateLimit(
  policy: RateLimitPolicy,
  identity: string,
  opts?: { failClosed?: boolean },
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const failClosed = opts?.failClosed !== false;
  const db = getDb();
  const windowSec = Math.max(1, Math.ceil(policy.windowMs / 1000));
  if (!db) {
    return { allowed: !failClosed, retryAfterSec: windowSec };
  }

  const key = bucketKey(policy, identity);
  const resetAt = new Date(Date.now() + policy.windowMs);
  // Bind as ISO text + cast — raw Date in sql`` becomes Date.toString() and breaks Postgres.
  const resetAtIso = resetAt.toISOString();

  try {
    const rows = await db
      .insert(schema.rateLimitBuckets)
      .values({
        key,
        count: 1,
        resetAt,
      })
      .onConflictDoUpdate({
        target: schema.rateLimitBuckets.key,
        set: {
          count: sql`CASE WHEN ${schema.rateLimitBuckets.resetAt} <= NOW() THEN 1 ELSE ${schema.rateLimitBuckets.count} + 1 END`,
          resetAt: sql`CASE WHEN ${schema.rateLimitBuckets.resetAt} <= NOW() THEN ${resetAtIso}::timestamptz ELSE ${schema.rateLimitBuckets.resetAt} END`,
        },
      })
      .returning({
        count: schema.rateLimitBuckets.count,
        resetAt: schema.rateLimitBuckets.resetAt,
      });

    const row = rows[0];
    if (!row) {
      return { allowed: !failClosed, retryAfterSec: windowSec };
    }

    const retryAfterSec = Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
    const allowed = row.count <= policy.limit;
    if (!allowed) {
      logRateLimit('blocked', {
        endpoint: policy.endpoint,
        identity,
        count: row.count,
        limit: policy.limit,
        retryAfterSec,
      });
    }
    return { allowed, retryAfterSec };
  } catch (err) {
    console.error(
      JSON.stringify({
        scope: 'rate_limit',
        event: 'consume_failed',
        endpoint: policy.endpoint,
        failClosed,
        error: err instanceof Error ? err.message : 'unknown',
      }),
    );
    return { allowed: !failClosed, retryAfterSec: windowSec };
  }
}

/** Lightweight IP flood shield applied before auth on protected mutations. */
export async function checkIpAbuseLimit(
  policy: RateLimitPolicy,
  ip: string,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  // Fail-open on infra errors so anonymous callers still reach authentication (401).
  return consumeRateLimit(policy, `ip:${ip}`, { failClosed: false });
}

/** Authenticated operation limiter (keyed by user id). */
export async function checkUserRateLimit(
  policy: RateLimitPolicy,
  userId: string,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  return consumeRateLimit(policy, `user:${userId}`, { failClosed: true });
}

export const AUTH_LOGIN_LIMIT: RateLimitPolicy = {
  endpoint: 'auth.login',
  limit: 5,
  windowMs: 15 * 60 * 1000,
};

export const AUTH_REGISTER_LIMIT: RateLimitPolicy = {
  endpoint: 'auth.register',
  limit: 5,
  windowMs: 15 * 60 * 1000,
};

export const AUTH_FORGOT_PASSWORD_LIMIT: RateLimitPolicy = {
  endpoint: 'auth.forgot_password',
  limit: 3,
  windowMs: 15 * 60 * 1000,
};

export const ADMIN_LOGIN_LIMIT: RateLimitPolicy = {
  endpoint: 'admin.login',
  limit: 5,
  windowMs: 15 * 60 * 1000,
};

export const CONTACT_LIMIT: RateLimitPolicy = {
  endpoint: 'contacts.create',
  limit: 8,
  windowMs: 15 * 60 * 1000,
};

export const NEWSLETTER_LIMIT: RateLimitPolicy = {
  endpoint: 'newsletter.subscribe',
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

/**
 * Pre-auth IP abuse shield for booking/payment mutations.
 * Separate bucket from authenticated operation limits so anonymous probes
 * receive 401 after a generous flood ceiling — not the authenticated op quota.
 */
export const PROTECTED_MUTATION_IP_ABUSE_LIMIT: RateLimitPolicy = {
  endpoint: 'protected.mutation.ip_abuse',
  limit: 120,
  windowMs: 60 * 1000,
};

/** Authenticated checkout creates per user. */
export const CHECKOUT_LIMIT: RateLimitPolicy = {
  endpoint: 'bookings.checkout.user',
  limit: 10,
  windowMs: 60 * 1000,
};

/** Authenticated Razorpay order creates per user. */
export const PAYMENT_ORDER_LIMIT: RateLimitPolicy = {
  endpoint: 'payments.create_order.user',
  limit: 5,
  windowMs: 60 * 1000,
};

/** Authenticated payment verifies per user. */
export const PAYMENT_VERIFY_USER_LIMIT: RateLimitPolicy = {
  endpoint: 'payments.verify.user',
  limit: 30,
  windowMs: 60 * 1000,
};

export function rateLimitedResponse(retryAfterSec: number) {
  return Response.json(
    {
      error: 'Too many attempts. Please try again later.',
      code: 'RATE_LIMITED',
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'Cache-Control': 'no-store',
      },
    },
  );
}
