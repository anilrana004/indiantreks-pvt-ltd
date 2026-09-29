-- Phase B: authoritative trek package pricing in Postgres

CREATE TABLE IF NOT EXISTS "trek_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trek_id" text NOT NULL,
  "package_key" text NOT NULL,
  "name" text NOT NULL,
  "price_inr" integer NOT NULL,
  "original_price_inr" integer,
  "deposit_inr" integer NOT NULL,
  "badge" text NOT NULL DEFAULT '',
  "inclusions_json" text NOT NULL DEFAULT '[]',
  "exclusions_json" text NOT NULL DEFAULT '[]',
  "status" text NOT NULL DEFAULT 'active',
  "sort_order" integer NOT NULL DEFAULT 0,
  "valid_from" timestamptz,
  "valid_until" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "trek_packages_price_nonneg" CHECK ("price_inr" >= 0),
  CONSTRAINT "trek_packages_deposit_nonneg" CHECK ("deposit_inr" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "trek_packages_trek_key_uidx"
  ON "trek_packages" ("trek_id", "package_key");

CREATE INDEX IF NOT EXISTS "trek_packages_trek_status_idx"
  ON "trek_packages" ("trek_id", "status");
