import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import {
  getDepartureBatches,
  isUpcomingDepartureDate,
  parseISODate,
  type TrekBatch,
} from '@/lib/batches';
import { treks } from '@/lib/data';
import { paymentHoldMinutes } from '@/lib/payments/razorpay';

const { trekBatches, bookingHolds, bookings } = schema;

const DEFAULT_CAPACITY = 20;
const MAX_PERSONS = 20;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

export type InventoryConflictError = Error & {
  status: 409;
  code: 'BOOKING_UNAVAILABLE';
};

function unavailable(message = 'This departure is no longer available.'): InventoryConflictError {
  return Object.assign(new Error(message), {
    status: 409 as const,
    code: 'BOOKING_UNAVAILABLE' as const,
  });
}

function catalogMeta(trekId: string, startDate: string): { endDate: string; capacity: number } | null {
  const trek = treks.find((t) => t.id === trekId);
  if (!trek) return null;
  const batch = getDepartureBatches(trek).find((b) => b.startDate === startDate);
  if (!batch) return null;
  return { endDate: batch.endDate, capacity: batch.capacity || DEFAULT_CAPACITY };
}

/** Resolve YYYY-MM-DD from catalog batch id (`trekId-YYYY-MM-DD`) or raw date. */
export function resolveStartDate(input: { trekId: string; date?: string; batchId?: string }): string {
  const rawBatch = input.batchId?.trim() || '';
  if (rawBatch) {
    const prefix = `${input.trekId}-`;
    if (rawBatch.startsWith(prefix)) {
      return rawBatch.slice(prefix.length);
    }
    // UUID batch ids are resolved later from DB
    if (/^[0-9a-f-]{36}$/i.test(rawBatch)) {
      return '';
    }
  }
  return (input.date || '').trim();
}

/**
 * Ensure a DB batch row exists for this departure (idempotent upsert).
 * Catalog capacity is used when known; otherwise DEFAULT_CAPACITY.
 */
export async function ensureTrekBatch(input: {
  trekId: string;
  startDate: string;
  endDate?: string;
  capacity?: number;
}) {
  const db = requireDb();
  const startDate = input.startDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw Object.assign(new Error('Invalid departure date'), { status: 400 });
  }
  if (!isUpcomingDepartureDate(startDate)) {
    throw unavailable('This departure date has already passed.');
  }

  const meta = catalogMeta(input.trekId, startDate);
  const capacity = Math.max(
    1,
    Math.min(200, Math.floor(input.capacity || meta?.capacity || DEFAULT_CAPACITY)),
  );
  const endDate = (input.endDate || meta?.endDate || startDate).trim();
  // Cutoff: start of departure day UTC midnight of the calendar date (server uses timestamptz).
  const cutoffAt = parseISODate(startDate);

  const existing = await db
    .select()
    .from(trekBatches)
    .where(and(eq(trekBatches.trekId, input.trekId), eq(trekBatches.startDate, startDate)))
    .limit(1);

  if (existing[0]) return existing[0];

  try {
    const [row] = await db
      .insert(trekBatches)
      .values({
        trekId: input.trekId,
        startDate,
        endDate,
        capacity,
        confirmedSeats: 0,
        status: 'active',
        cutoffAt,
        updatedAt: new Date(),
      })
      .returning();
    return row!;
  } catch {
    const [again] = await db
      .select()
      .from(trekBatches)
      .where(and(eq(trekBatches.trekId, input.trekId), eq(trekBatches.startDate, startDate)))
      .limit(1);
    if (again) return again;
    throw new Error('Failed to create trek batch');
  }
}

async function expireActiveHoldsForBatch(
  tx: ReturnType<typeof requireDb>,
  batchId: string,
): Promise<void> {
  await tx
    .update(bookingHolds)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        eq(bookingHolds.batchId, batchId),
        eq(bookingHolds.status, 'active'),
        sql`${bookingHolds.expiresAt} < NOW()`,
      ),
    );
}

async function activeHeldSeats(
  tx: ReturnType<typeof requireDb>,
  batchId: string,
): Promise<number> {
  const rows = await tx.execute<{ held: string | number }>(sql`
    SELECT COALESCE(SUM(quantity), 0)::int AS held
    FROM booking_holds
    WHERE batch_id = ${batchId}
      AND status = 'active'
      AND expires_at > NOW()
  `);
  const list = Array.isArray(rows)
    ? rows
    : ((rows as { rows?: Array<{ held: string | number }> }).rows ?? []);
  return Number(list[0]?.held || 0);
}

export async function getBatchAvailability(batchId: string): Promise<{
  batchId: string;
  trekId: string;
  startDate: string;
  capacity: number;
  confirmedSeats: number;
  heldSeats: number;
  availableSeats: number;
  status: string;
}> {
  const db = requireDb();
  const [batch] = await db.select().from(trekBatches).where(eq(trekBatches.id, batchId)).limit(1);
  if (!batch) throw Object.assign(new Error('Batch not found'), { status: 404 });
  await expireActiveHoldsForBatch(db, batch.id);
  const held = await activeHeldSeats(db, batch.id);
  const available = Math.max(0, batch.capacity - batch.confirmedSeats - held);
  return {
    batchId: batch.id,
    trekId: batch.trekId,
    startDate: batch.startDate,
    capacity: batch.capacity,
    confirmedSeats: batch.confirmedSeats,
    heldSeats: held,
    availableSeats: available,
    status: batch.status,
  };
}

/**
 * Short inventory transaction: lock batch → expire stale holds → reserve seats → return hold.
 * Does NOT call Razorpay or email.
 */
export async function reserveInventory(input: {
  trekId: string;
  startDate?: string;
  batchId?: string;
  quantity: number;
  userId?: string | null;
  expiresAt?: Date;
}): Promise<{
  batchId: string;
  holdId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  expiresAt: Date;
  availableAfter: number;
}> {
  const db = requireDb();
  const quantity = Math.floor(Number(input.quantity) || 0);
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_PERSONS) {
    throw Object.assign(new Error(`Persons must be between 1 and ${MAX_PERSONS}`), { status: 400 });
  }

  const holdMinutes = paymentHoldMinutes();
  const expiresAt = input.expiresAt || new Date(Date.now() + holdMinutes * 60 * 1000);

  // Resolve / create batch BEFORE the lock transaction (no external work inside FOR UPDATE).
  let batchId = input.batchId?.trim() || '';
  if (!batchId || !/^[0-9a-f-]{36}$/i.test(batchId)) {
    const startDate =
      input.startDate?.trim() ||
      resolveStartDate({ trekId: input.trekId, batchId: input.batchId, date: input.startDate });
    if (!startDate) {
      throw Object.assign(new Error('Departure date is required'), { status: 400 });
    }
    const ensured = await ensureTrekBatch({ trekId: input.trekId, startDate });
    batchId = ensured.id;
  }

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .select()
      .from(trekBatches)
      .where(eq(trekBatches.id, batchId))
      .for('update')
      .limit(1);

    if (!batch || batch.trekId !== input.trekId) {
      throw unavailable('Selected departure does not match this trek.');
    }
    if (batch.status !== 'active') {
      throw unavailable('This departure is not open for booking.');
    }
    if (batch.cutoffAt && batch.cutoffAt.getTime() < Date.now()) {
      throw unavailable('The booking cutoff for this departure has passed.');
    }
    if (!isUpcomingDepartureDate(batch.startDate)) {
      throw unavailable('This departure date has already passed.');
    }

    await expireActiveHoldsForBatch(tx, batch.id);
    const held = await activeHeldSeats(tx, batch.id);
    const available = batch.capacity - batch.confirmedSeats - held;
    if (quantity > available) {
      throw unavailable(
        available <= 0
          ? 'This departure is fully booked.'
          : `Only ${available} seat${available === 1 ? '' : 's'} left on this departure.`,
      );
    }

    const [hold] = await tx
      .insert(bookingHolds)
      .values({
        batchId: batch.id,
        userId: input.userId || null,
        quantity,
        status: 'active',
        expiresAt,
        updatedAt: new Date(),
      })
      .returning();

    return {
      batchId: batch.id,
      holdId: hold!.id,
      startDate: batch.startDate,
      endDate: batch.endDate,
      quantity,
      expiresAt,
      availableAfter: available - quantity,
    };
  });
}

/** Attach booking id to an existing hold (after booking row insert). */
export async function attachHoldToBooking(holdId: string, bookingId: string, batchId: string) {
  const db = requireDb();
  await db
    .update(bookingHolds)
    .set({ bookingId, updatedAt: new Date() })
    .where(and(eq(bookingHolds.id, holdId), eq(bookingHolds.status, 'active')));
  await db
    .update(bookings)
    .set({ holdId, batchId, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
}

/**
 * Convert an active hold into confirmed seats after payment capture.
 * Idempotent if already converted.
 */
export async function convertHoldForBooking(bookingId: string): Promise<{ converted: boolean }> {
  const db = requireDb();
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .for('update')
      .limit(1);
    if (!booking?.holdId) return { converted: false };

    const [hold] = await tx
      .select()
      .from(bookingHolds)
      .where(eq(bookingHolds.id, booking.holdId))
      .for('update')
      .limit(1);

    if (!hold) return { converted: false };
    if (hold.status === 'converted') return { converted: true };
    if (hold.status !== 'active') {
      // Expired hold after payment — still confirm seats if payment captured
      // (webhook/verify is authoritative for money).
      if (hold.status === 'expired') {
        const [batch] = await tx
          .select()
          .from(trekBatches)
          .where(eq(trekBatches.id, hold.batchId))
          .for('update')
          .limit(1);
        if (!batch) return { converted: false };
        const nextConfirmed = batch.confirmedSeats + hold.quantity;
        if (nextConfirmed > batch.capacity) {
          // Over-capacity after expiry race — still record conversion; ops alert via logs.
          console.error(
            JSON.stringify({
              scope: 'inventory',
              event: 'convert_over_capacity',
              bookingId,
              batchId: batch.id,
              nextConfirmed,
              capacity: batch.capacity,
            }),
          );
        }
        await tx
          .update(trekBatches)
          .set({
            confirmedSeats: nextConfirmed,
            updatedAt: new Date(),
          })
          .where(eq(trekBatches.id, batch.id));
        await tx
          .update(bookingHolds)
          .set({ status: 'converted', convertedAt: new Date(), updatedAt: new Date() })
          .where(eq(bookingHolds.id, hold.id));
        return { converted: true };
      }
      return { converted: false };
    }

    const [batch] = await tx
      .select()
      .from(trekBatches)
      .where(eq(trekBatches.id, hold.batchId))
      .for('update')
      .limit(1);
    if (!batch) return { converted: false };

    await tx
      .update(trekBatches)
      .set({
        confirmedSeats: batch.confirmedSeats + hold.quantity,
        updatedAt: new Date(),
      })
      .where(eq(trekBatches.id, batch.id));

    await tx
      .update(bookingHolds)
      .set({ status: 'converted', convertedAt: new Date(), updatedAt: new Date() })
      .where(eq(bookingHolds.id, hold.id));

    return { converted: true };
  });
}

/** Release an active hold (expire / cancel unpaid). */
export async function releaseHold(holdId: string, reason: 'expired' | 'cancelled' = 'cancelled') {
  const db = requireDb();
  await db
    .update(bookingHolds)
    .set({ status: reason === 'expired' ? 'expired' : 'cancelled', updatedAt: new Date() })
    .where(and(eq(bookingHolds.id, holdId), eq(bookingHolds.status, 'active')));
}

/** Release confirmed seats when a paid booking is fully cancelled/refunded. */
export async function releaseConfirmedSeatsForBooking(bookingId: string) {
  const db = requireDb();
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .for('update')
      .limit(1);
    if (!booking?.batchId) return { released: 0 };

    const qty = Math.max(0, booking.persons || 0);
    if (qty <= 0) return { released: 0 };

    const [batch] = await tx
      .select()
      .from(trekBatches)
      .where(eq(trekBatches.id, booking.batchId))
      .for('update')
      .limit(1);
    if (!batch) return { released: 0 };

    await tx
      .update(trekBatches)
      .set({
        confirmedSeats: Math.max(0, batch.confirmedSeats - qty),
        updatedAt: new Date(),
      })
      .where(eq(trekBatches.id, batch.id));

    if (booking.holdId) {
      await tx
        .update(bookingHolds)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(bookingHolds.id, booking.holdId),
            inArray(bookingHolds.status, ['converted', 'active']),
          ),
        );
    }

    return { released: qty };
  });
}

/**
 * Expire payment holds + inventory holds.
 * Availability also ignores expired ACTIVE holds via expires_at > NOW() checks.
 */
export async function expireStaleInventoryHolds(limit = 200): Promise<{
  bookingHolds: number;
  bookings: number;
}> {
  const db = requireDb();

  const holdRows = await db.execute<{ id: string }>(sql`
    WITH expired AS (
      SELECT id
      FROM booking_holds
      WHERE status = 'active'
        AND expires_at < NOW()
      ORDER BY expires_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE booking_holds AS h
    SET status = 'expired', updated_at = NOW()
    FROM expired
    WHERE h.id = expired.id
    RETURNING h.id
  `);
  const holdsList = Array.isArray(holdRows)
    ? holdRows
    : ((holdRows as { rows?: Array<{ id: string }> }).rows ?? []);

  const bookingRows = await db.execute<{ id: string }>(sql`
    WITH expired AS (
      SELECT id, hold_id
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
  const bookingsList = Array.isArray(bookingRows)
    ? bookingRows
    : ((bookingRows as { rows?: Array<{ id: string }> }).rows ?? []);

  return { bookingHolds: holdsList.length, bookings: bookingsList.length };
}

/** Overlay catalog batches with live DB availability (ensures rows lazily). */
export async function getLiveDepartureBatches(trekId: string): Promise<TrekBatch[]> {
  const trek = treks.find((t) => t.id === trekId);
  if (!trek) return [];
  const catalog = getDepartureBatches(trek);
  const db = getDb();
  if (!db) return catalog;

  // Ensure all catalog departures exist (parallel, idempotent).
  const ensured = await Promise.all(
    catalog.map((batch) =>
      ensureTrekBatch({
        trekId,
        startDate: batch.startDate,
        endDate: batch.endDate,
        capacity: batch.capacity,
      }).catch(() => null),
    ),
  );

  const batchIds = ensured.filter(Boolean).map((b) => b!.id);
  if (batchIds.length === 0) return catalog;

  // Expire stale holds for these batches, then sum active holds in one query.
  await db.execute(sql`
    UPDATE booking_holds
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active'
      AND expires_at < NOW()
      AND batch_id IN (${sql.join(
        batchIds.map((id) => sql`${id}`),
        sql`, `,
      )})
  `);

  const heldRows = await db.execute<{ batch_id: string; held: string | number }>(sql`
    SELECT batch_id, COALESCE(SUM(quantity), 0)::int AS held
    FROM booking_holds
    WHERE status = 'active'
      AND expires_at > NOW()
      AND batch_id IN (${sql.join(
        batchIds.map((id) => sql`${id}`),
        sql`, `,
      )})
    GROUP BY batch_id
  `);
  const heldList = Array.isArray(heldRows)
    ? heldRows
    : ((heldRows as { rows?: Array<{ batch_id: string; held: string | number }> }).rows ?? []);
  const heldByBatch = new Map(heldList.map((r) => [r.batch_id, Number(r.held || 0)]));

  return catalog.map((batch, i) => {
    const row = ensured[i];
    if (!row) return batch;
    const held = heldByBatch.get(row.id) || 0;
    const seatsLeft = Math.max(0, row.capacity - row.confirmedSeats - held);
    const capacity = row.capacity;
    let status: TrekBatch['status'] = 'available';
    if (seatsLeft <= 0 || row.status !== 'active') status = 'sold-out';
    else if (seatsLeft / capacity <= 0.2) status = 'almost-full';
    else if (seatsLeft / capacity <= 0.45) status = 'filling-fast';
    return {
      ...batch,
      id: `${trekId}-${batch.startDate}`,
      seatsLeft,
      capacity,
      status,
    };
  });
}
