import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { getRazorpayClient } from '@/lib/payments/razorpay';
import type { BookingPaymentStatus, BookingStatus, PaymentTxStatus } from '@/lib/operations/types';
import {
  assertBookingStatusTransition,
  assertPaymentStatusTransition,
  assertPaymentTxTransition,
} from '@/lib/bookings/state-machine';

const { bookings, paymentTransactions, paymentRefunds, bookingStatusHistory } = schema;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

type RefundResult = {
  refundId: string;
  razorpayRefundId: string | null;
  amountPaise: number;
  full: boolean;
  duplicate?: boolean;
};

/**
 * Initiate a Razorpay refund from the backend only.
 * Idempotent: concurrent/retry calls reuse an in-flight or completed refund
 * for the same booking+amount instead of creating duplicate Razorpay refunds.
 */
export async function initiateRefund(input: {
  bookingId: string;
  amountPaise?: number;
  reason?: string;
}): Promise<RefundResult> {
  const db = requireDb();

  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .for('update')
      .limit(1);

    if (!booking) throw new Error('Booking not found');

    if (
      booking.paymentStatus !== 'paid' &&
      booking.paymentStatus !== 'partially_refunded' &&
      booking.paymentStatus !== 'refund_pending' &&
      booking.status !== 'confirmed'
    ) {
      throw new Error('Booking is not in a refundable paid state');
    }

    const [paymentTx] = await tx
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.bookingId, booking.id))
      .orderBy(desc(paymentTransactions.createdAt))
      .for('update')
      .limit(1);

    if (
      !paymentTx?.razorpayPaymentId ||
      !['captured', 'refund_pending', 'partially_refunded', 'refunded'].includes(paymentTx.status)
    ) {
      throw new Error('No captured payment found for refund');
    }

    const amountPaise = input.amountPaise ?? paymentTx.amountPaise;
    if (amountPaise <= 0 || amountPaise > paymentTx.amountPaise) {
      throw new Error('Invalid refund amount');
    }

    const [prior] = await tx
      .select()
      .from(paymentRefunds)
      .where(
        and(
          eq(paymentRefunds.bookingId, booking.id),
          eq(paymentRefunds.amountPaise, amountPaise),
          inArray(paymentRefunds.status, ['initiated', 'requested', 'processed', 'completed']),
        ),
      )
      .orderBy(desc(paymentRefunds.createdAt))
      .limit(1);

    if (prior?.razorpayRefundId) {
      return {
        refundId: prior.id,
        razorpayRefundId: prior.razorpayRefundId,
        amountPaise,
        full: amountPaise === paymentTx.amountPaise,
        duplicate: true as const,
        bookingId: booking.id,
      };
    }

    const [refundRow] =
      prior && !prior.razorpayRefundId
        ? [prior]
        : await tx
            .insert(paymentRefunds)
            .values({
              paymentTransactionId: paymentTx.id,
              bookingId: booking.id,
              amountPaise,
              status: 'initiated',
              reason: input.reason || '',
              updatedAt: new Date(),
            })
            .returning();

    assertPaymentStatusTransition(
      booking.paymentStatus as BookingPaymentStatus,
      'refund_pending',
    );
    assertPaymentTxTransition(paymentTx.status as PaymentTxStatus, 'refund_pending');

    await tx
      .update(bookings)
      .set({ paymentStatus: 'refund_pending', updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));

    await tx
      .update(paymentTransactions)
      .set({ status: 'refund_pending', updatedAt: new Date() })
      .where(eq(paymentTransactions.id, paymentTx.id));

    await tx.insert(bookingStatusHistory).values({
      bookingId: booking.id,
      fromStatus: booking.status,
      toStatus: booking.status,
      fromPaymentStatus: booking.paymentStatus,
      toPaymentStatus: 'refund_pending',
      reason: input.reason || 'refund_initiated',
      actor: 'admin',
    });

    const razorpay = getRazorpayClient();
    let refund: { id?: string };
    try {
      refund = await razorpay.payments.refund(paymentTx.razorpayPaymentId, {
        amount: amountPaise,
        notes: {
          bookingId: booking.id,
          referenceCode: booking.referenceCode || '',
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'razorpay_refund_failed';
      await tx
        .update(paymentRefunds)
        .set({ status: 'failed', reason: message, updatedAt: new Date() })
        .where(eq(paymentRefunds.id, refundRow!.id));
      throw err;
    }

    const full = amountPaise === paymentTx.amountPaise;
    const razorpayRefundId = String(refund.id || '');
    const nextPaymentStatus = full ? 'refunded' : 'partially_refunded';
    const nextBookingStatus = full ? 'cancelled' : (booking.status as BookingStatus);
    const nextTxStatus = full ? 'refunded' : 'partially_refunded';

    assertPaymentStatusTransition('refund_pending', nextPaymentStatus);
    assertPaymentTxTransition('refund_pending', nextTxStatus);
    if (full) {
      assertBookingStatusTransition(booking.status as BookingStatus, 'cancelled');
    }

    await tx
      .update(paymentRefunds)
      .set({
        razorpayRefundId: razorpayRefundId || null,
        status: 'processed',
        updatedAt: new Date(),
      })
      .where(eq(paymentRefunds.id, refundRow!.id));

    await tx
      .update(bookings)
      .set({
        paymentStatus: nextPaymentStatus,
        status: nextBookingStatus,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    await tx
      .update(paymentTransactions)
      .set({ status: nextTxStatus, updatedAt: new Date() })
      .where(eq(paymentTransactions.id, paymentTx.id));

    await tx.insert(bookingStatusHistory).values({
      bookingId: booking.id,
      fromStatus: booking.status,
      toStatus: nextBookingStatus,
      fromPaymentStatus: 'refund_pending',
      toPaymentStatus: nextPaymentStatus,
      reason: input.reason || 'refund_processed',
      actor: 'admin',
    });

    return {
      refundId: refundRow!.id,
      razorpayRefundId: razorpayRefundId || null,
      amountPaise,
      full,
      bookingId: booking.id,
    };
  }).then(async (result) => {
    if (result.full) {
      try {
        const { releaseConfirmedSeatsForBooking } = await import('@/lib/inventory/service');
        await releaseConfirmedSeatsForBooking(result.bookingId);
      } catch {
        /* ops can reconcile; payment already refunded */
      }
    }
    return {
      refundId: result.refundId,
      razorpayRefundId: result.razorpayRefundId,
      amountPaise: result.amountPaise,
      full: result.full,
    };
  });
}
