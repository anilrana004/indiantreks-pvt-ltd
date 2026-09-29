-- Phase D: async transactional email outbox

CREATE TABLE IF NOT EXISTS "email_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" text NOT NULL,
  "to_email" text NOT NULL,
  "to_name" text NOT NULL DEFAULT '',
  "subject" text NOT NULL,
  "html" text NOT NULL,
  "text" text NOT NULL DEFAULT '',
  "booking_id" uuid REFERENCES "bookings"("id") ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 8,
  "last_error" text,
  "provider_message_id" text,
  "next_attempt_at" timestamptz NOT NULL DEFAULT now(),
  "sent_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "email_outbox_pending_idx"
  ON "email_outbox" ("next_attempt_at")
  WHERE "status" IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS "email_outbox_booking_id_idx"
  ON "email_outbox" ("booking_id");
