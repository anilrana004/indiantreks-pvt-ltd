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

/**
 * Atomic fixed-window limiter via Postgres upsert.
 * Returns false when over limit. Fail-closed when DB is unavailable (sensitive ops).
 */
export async function consumeRateLimit(
  policy: RateLimitPolicy,
  identity: string,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const db = getDb();
  const windowSec = Math.max(1, Math.ceil(policy.windowMs / 1000));
  if (!db) {
    return { allowed: false, retryAfterSec: windowSec };
  }

  const key = bucketKey(policy, identity);
  const resetAt = new Date(Date.now() + policy.windowMs);

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
          resetAt: sql`CASE WHEN ${schema.rateLimitBuckets.resetAt} <= NOW() THEN ${resetAt} ELSE ${schema.rateLimitBuckets.resetAt} END`,
        },
      })
      .returning({
        count: schema.rateLimitBuckets.count,
        resetAt: schema.rateLimitBuckets.resetAt,
      });

    const row = rows[0];
    if (!row) {
      return { allowed: false, retryAfterSec: windowSec };
    }

    const retryAfterSec = Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
    return {
      allowed: row.count <= policy.limit,
      retryAfterSec,
    };
  } catch (err) {
    console.error(
      JSON.stringify({
        scope: 'rate_limit',
        event: 'consume_failed',
        endpoint: policy.endpoint,
        error: err instanceof Error ? err.message : 'unknown',
      }),
    );
    return { allowed: false, retryAfterSec: windowSec };
  }
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

export const PAYMENT_ORDER_LIMIT: RateLimitPolicy = {
  endpoint: 'payments.create_order',
  limit: 5,
  windowMs: 60 * 1000,
};

export const CHECKOUT_LIMIT: RateLimitPolicy = {
  endpoint: 'bookings.checkout',
  limit: 10,
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
