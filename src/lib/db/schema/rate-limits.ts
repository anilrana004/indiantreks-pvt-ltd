import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** Distributed fixed-window rate limits — Postgres is authoritative until Redis is wired. */
export const rateLimitBuckets = pgTable('rate_limit_buckets', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(1),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
});
