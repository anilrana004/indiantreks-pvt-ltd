-- Phase C: normalized participants + booking status history

CREATE TABLE IF NOT EXISTS "booking_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "full_name" text NOT NULL,
  "age" text NOT NULL DEFAULT '',
  "gender" text NOT NULL DEFAULT '',
  "phone" text NOT NULL DEFAULT '',
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "booking_participants_booking_id_idx"
  ON "booking_participants" ("booking_id");

CREATE TABLE IF NOT EXISTS "booking_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "from_status" text,
  "to_status" text NOT NULL,
  "from_payment_status" text,
  "to_payment_status" text,
  "reason" text NOT NULL DEFAULT '',
  "actor" text NOT NULL DEFAULT 'system',
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "booking_status_history_booking_id_idx"
  ON "booking_status_history" ("booking_id");
