-- Razorpay payments: extend bookings + payment_transactions + webhook/refund tables

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "site_users"("id") ON DELETE SET NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reference_code" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "city" text DEFAULT '' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "participants_json" text DEFAULT '[]' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "pricing_snapshot" text DEFAULT '{}' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payable_paise" integer DEFAULT 0 NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "total_paise" integer DEFAULT 0 NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'INR' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "checkout_token_hash" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'unpaid' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "hold_expires_at" timestamptz;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "confirmed_at" timestamptz;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "email_status" text DEFAULT 'not_configured' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_reference_code_uidx" ON "bookings" ("reference_code") WHERE "reference_code" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "bookings_user_id_idx" ON "bookings" ("user_id");
CREATE INDEX IF NOT EXISTS "bookings_payment_status_idx" ON "bookings" ("payment_status");
CREATE INDEX IF NOT EXISTS "bookings_email_idx" ON "bookings" ("email");

-- Align legacy pending rows with payment-aware vocabulary (idempotent)
UPDATE "bookings" SET "status" = 'pending_payment' WHERE "status" = 'pending';

CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "razorpay_order_id" text NOT NULL UNIQUE,
  "razorpay_payment_id" text UNIQUE,
  "amount_paise" integer NOT NULL,
  "currency" text DEFAULT 'INR' NOT NULL,
  "status" text DEFAULT 'created' NOT NULL,
  "method" text,
  "signature_verified" boolean DEFAULT false NOT NULL,
  "idempotency_key" text UNIQUE,
  "failure_reason" text,
  "raw_status" text,
  "captured_at" timestamptz,
  "failed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_transactions_booking_id_idx" ON "payment_transactions" ("booking_id");
CREATE INDEX IF NOT EXISTS "payment_transactions_status_idx" ON "payment_transactions" ("status");

CREATE TABLE IF NOT EXISTS "payment_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" text NOT NULL UNIQUE,
  "event_type" text NOT NULL,
  "payload_hash" text NOT NULL,
  "processed" boolean DEFAULT false NOT NULL,
  "processing_error" text,
  "processed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_webhook_events_type_idx" ON "payment_webhook_events" ("event_type");

CREATE TABLE IF NOT EXISTS "payment_refunds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "payment_transaction_id" uuid NOT NULL REFERENCES "payment_transactions"("id") ON DELETE CASCADE,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "razorpay_refund_id" text UNIQUE,
  "amount_paise" integer NOT NULL,
  "status" text DEFAULT 'requested' NOT NULL,
  "reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "payment_refunds_booking_id_idx" ON "payment_refunds" ("booking_id");
