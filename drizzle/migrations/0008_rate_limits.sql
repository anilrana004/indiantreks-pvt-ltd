-- P0: multi-instance rate limiting (Postgres-authoritative; Redis can replace later)

CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key" text PRIMARY KEY NOT NULL,
  "count" integer DEFAULT 1 NOT NULL,
  "reset_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "rate_limit_buckets_reset_at_idx" ON "rate_limit_buckets" ("reset_at");
