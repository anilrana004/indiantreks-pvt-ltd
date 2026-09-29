import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

/**
 * Release expired payment holds. Availability-safe even if cleanup is delayed —
 * payable assertions also reject expired holds.
 */
export async function expireStaleBookingHolds(limit = 200): Promise<number> {
  const db = requireDb();
  const rows = await db.execute<{ id: string }>(sql`
    WITH expired AS (
      SELECT id
      FROM bookings
      WHERE hold_expires_at IS NOT NULL
        AND hold_expires_at < NOW()
        AND status IN ('pending_payment', 'payment_processing', 'pending')
        AND payment_status NOT IN ('paid', 'refunded', 'partially_refunded')
      ORDER BY hold_expires_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE bookings AS b
    SET
      status = 'expired',
      payment_status = 'failed',
      updated_at = NOW()
    FROM expired
    WHERE b.id = expired.id
    RETURNING b.id
  `);

  const list = Array.isArray(rows)
    ? rows
    : ((rows as { rows?: Array<{ id: string }> }).rows ?? []);
  return list.length;
}
