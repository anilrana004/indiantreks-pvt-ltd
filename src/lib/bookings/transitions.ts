import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import type { BookingPaymentStatus, BookingStatus } from '@/lib/operations/types';
import {
  assertBookingStatusTransition,
  assertPaymentStatusTransition,
} from '@/lib/bookings/state-machine';

const { bookings, bookingStatusHistory } = schema;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

export type BookingTransitionInput = {
  bookingId: string;
  toStatus?: BookingStatus;
  toPaymentStatus?: BookingPaymentStatus;
  reason?: string;
  actor?: string;
  /** Extra booking column updates applied in the same write. */
  extra?: {
    confirmedAt?: Date | null;
    holdExpiresAt?: Date | null;
    emailStatus?: string;
    updatedAt?: Date;
  };
};

/**
 * Apply a legal booking/payment status change and append history.
 * Idempotent when target equals current.
 */
export async function applyBookingTransition(input: BookingTransitionInput) {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  if (!row) throw Object.assign(new Error('Booking not found'), { status: 404 });

  const fromStatus = row.status as BookingStatus;
  const fromPayment = (row.paymentStatus || 'unpaid') as BookingPaymentStatus;
  const toStatus = input.toStatus ?? fromStatus;
  const toPayment = input.toPaymentStatus ?? fromPayment;

  assertBookingStatusTransition(fromStatus, toStatus);
  assertPaymentStatusTransition(fromPayment, toPayment);

  if (fromStatus === toStatus && fromPayment === toPayment && !input.extra) {
    return row;
  }

  const [updated] = await db
    .update(bookings)
    .set({
      status: toStatus,
      paymentStatus: toPayment,
      confirmedAt:
        input.extra?.confirmedAt !== undefined
          ? input.extra.confirmedAt
          : toStatus === 'confirmed' && !row.confirmedAt
            ? new Date()
            : row.confirmedAt,
      holdExpiresAt:
        input.extra?.holdExpiresAt !== undefined ? input.extra.holdExpiresAt : row.holdExpiresAt,
      emailStatus: input.extra?.emailStatus ?? row.emailStatus,
      updatedAt: input.extra?.updatedAt ?? new Date(),
    })
    .where(eq(bookings.id, input.bookingId))
    .returning();

  if (fromStatus !== toStatus || fromPayment !== toPayment) {
    await db.insert(bookingStatusHistory).values({
      bookingId: input.bookingId,
      fromStatus,
      toStatus,
      fromPaymentStatus: fromPayment,
      toPaymentStatus: toPayment,
      reason: input.reason || '',
      actor: input.actor || 'system',
    });
  }

  return updated!;
}
