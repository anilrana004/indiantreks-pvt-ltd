import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let db: Db | null = null;

/**
 * Resolve Postgres URL for blog + customer auth (same DB).
 * Accepts common Vercel/Neon names so auth works when only POSTGRES_URL is linked.
 */
function rawDatabaseUrl(): string | null {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.NEON_DATABASE_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim().replace(/^['"]|['"]$/g, '');
    if (!value) continue;

    // Ignore local Postgres URLs on Vercel — they cannot connect and break builds.
    if (process.env.VERCEL && /(?:localhost|127\.0\.0\.1)/i.test(value)) {
      continue;
    }

    return value;
  }

  return null;
}

/** Normalize Neon/Vercel URLs for serverless (postgres.js). */
function normalizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // channel_binding=require often breaks serverless drivers behind Neon pooler.
    parsed.searchParams.delete('channel_binding');
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function databaseUrl(): string | null {
  const raw = rawDatabaseUrl();
  if (!raw) return null;
  return normalizeDatabaseUrl(raw);
}

export function isDbConfigured(): boolean {
  return Boolean(databaseUrl());
}

/** Which env key provided the URL (for diagnostics — never returns the secret). */
export function databaseUrlSource(): string | null {
  const keys = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_URL_UNPOOLED',
    'NEON_DATABASE_URL',
  ] as const;

  for (const key of keys) {
    const value = process.env[key]?.trim().replace(/^['"]|['"]$/g, '');
    if (!value) continue;
    if (process.env.VERCEL && /(?:localhost|127\.0\.0\.1)/i.test(value)) continue;
    return key;
  }
  return null;
}

/** Lazy singleton — safe when DATABASE_URL is unset (build / static fallback). */
export function getDb(): Db | null {
  const url = databaseUrl();
  if (!url) return null;

  if (!db) {
    const needsSsl =
      Boolean(process.env.VERCEL) || /neon\.tech|sslmode=require/i.test(url);
    client = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ...(needsSsl ? { ssl: true as const } : {}),
      prepare: false,
    });
    db = drizzle(client, { schema });
  }

  return db;
}

/**
 * Drop the cached client after fatal connection/quota errors so the next
 * request opens a fresh socket instead of reusing a dead pooler connection.
 */
export function invalidateDb(): void {
  const previous = client;
  client = null;
  db = null;
  if (previous) {
    void previous.end({ timeout: 1 }).catch(() => undefined);
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}

export { schema };
