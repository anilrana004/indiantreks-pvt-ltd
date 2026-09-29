-- Phase A inventory: authoritative trek batches + booking holds

CREATE TABLE IF NOT EXISTS "trek_batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trek_id" text NOT NULL,
  "start_date" text NOT NULL,
  "end_date" text NOT NULL DEFAULT '',
  "capacity" integer NOT NULL,
  "confirmed_seats" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'active',
  "cutoff_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "trek_batches_capacity_positive" CHECK ("capacity" > 0),
  CONSTRAINT "trek_batches_confirmed_nonneg" CHECK ("confirmed_seats" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "trek_batches_trek_start_uidx"
  ON "trek_batches" ("trek_id", "start_date");

CREATE INDEX IF NOT EXISTS "trek_batches_trek_id_idx"
  ON "trek_batches" ("trek_id");

CREATE INDEX IF NOT EXISTS "trek_batches_status_idx"
  ON "trek_batches" ("status");

CREATE TABLE IF NOT EXISTS "booking_holds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "batch_id" uuid NOT NULL REFERENCES "trek_batches"("id") ON DELETE CASCADE,
  "booking_id" uuid REFERENCES "bookings"("id") ON DELETE SET NULL,
  "user_id" uuid REFERENCES "site_users"("id") ON DELETE SET NULL,
  "quantity" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "expires_at" timestamptz NOT NULL,
  "converted_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "booking_holds_quantity_positive" CHECK ("quantity" > 0)
);

CREATE INDEX IF NOT EXISTS "booking_holds_batch_active_idx"
  ON "booking_holds" ("batch_id")
  WHERE "status" = 'active';

CREATE INDEX IF NOT EXISTS "booking_holds_expires_idx"
  ON "booking_holds" ("expires_at")
  WHERE "status" = 'active';

CREATE INDEX IF NOT EXISTS "booking_holds_booking_id_idx"
  ON "booking_holds" ("booking_id");

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "batch_id" uuid REFERENCES "trek_batches"("id") ON DELETE SET NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "hold_id" uuid REFERENCES "booking_holds"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "bookings_batch_id_idx" ON "bookings" ("batch_id");
CREATE INDEX IF NOT EXISTS "bookings_hold_id_idx" ON "bookings" ("hold_id");
