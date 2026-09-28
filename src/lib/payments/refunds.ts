import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { getRazorpayClient } from '@/lib/payments/razorpay';

const { bookings, paymentTransactions, paymentRefunds } = schema;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

/**
 * Initiate a Razorpay refund from the backend only.
 * Does NOT flip booking to refunded until Razorpay confirms.
 */
export async function initiateRefund(input: {
  bookingId: string;
  amountPaise?: number;
  reason?: string;
}) {
  const db = requireDb();
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
  if (!booking) throw new Error('Booking not found');
  if (booking.paymentStatus !== 'paid' && booking.status !== 'confirmed') {
    throw new Error('Booking is not in a refundable paid state');
  }

  const [tx] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.bookingId, booking.id))
    .limit(1);

  if (!tx?.razorpayPaymentId || tx.status !== 'captured') {
    throw new Error('No captured payment found for refund');
  }

  const amountPaise = input.amountPaise ?? tx.amountPaise;
  if (amountPaise <= 0 || amountPaise > tx.amountPaise) {
    throw new Error('Invalid refund amount');
  }

  const [refundRow] = await db
    .insert(paymentRefunds)
    .values({
      paymentTransactionId: tx.id,
      bookingId: booking.id,
      amountPaise,
      status: 'initiated',
      reason: input.reason || '',
      updatedAt: new Date(),
    })
    .returning();

  await db
    .update(bookings)
    .set({ paymentStatus: 'refund_pending', updatedAt: new Date() })
    .where(eq(bookings.id, booking.id));

  await db
    .update(paymentTransactions)
    .set({ status: 'refund_pending', updatedAt: new Date() })
    .where(eq(paymentTransactions.id, tx.id));

  const razorpay = getRazorpayClient();
  const refund = await razorpay.payments.refund(tx.razorpayPaymentId, {
    amount: amountPaise,
    notes: {
      bookingId: booking.id,
      referenceCode: booking.referenceCode || '',
    },
  });

  const full = amountPaise === tx.amountPaise;
  await db
    .update(paymentRefunds)
    .set({
      razorpayRefundId: String(refund.id),
      status: 'processed',
      updatedAt: new Date(),
    })
    .where(eq(paymentRefunds.id, refundRow!.id));

  await db
    .update(bookings)
    .set({
      paymentStatus: full ? 'refunded' : 'partially_refunded',
      status: full ? 'cancelled' : booking.status,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  await db
    .update(paymentTransactions)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(eq(paymentTransactions.id, tx.id));

  return {
    refundId: refundRow!.id,
    razorpayRefundId: String(refund.id),
    amountPaise,
    full,
  };
}
