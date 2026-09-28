import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { getDb, isDbConfigured, schema } from '@/lib/db';
import {
  hashPayload,
  isRazorpayConfigured,
  verifyWebhookSignature,
} from '@/lib/payments/razorpay';
import { confirmFromWebhookPayment, markPaymentFailed } from '@/lib/payments/service';

export const runtime = 'nodejs';

const { paymentWebhookEvents, paymentTransactions } = schema;

/**
 * Razorpay webhooks — signature over RAW body. Do not parse JSON before verify.
 * Intentionally NOT aggressively rate-limited (Razorpay retries during spikes).
 */
export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured() || !process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn(JSON.stringify({ scope: 'payments', event: 'webhook_invalid_signature' }));
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: {
    event?: string;
    id?: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      order?: { entity?: Record<string, unknown> };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = String(payload.event || '');
  const eventId = String(payload.id || `${eventType}:${hashPayload(rawBody).slice(0, 24)}`);
  const db = getDb();
  if (!db) return dbUnavailableResponse();

  // Idempotency: insert event id; if conflict, already processed
  try {
    await db.insert(paymentWebhookEvents).values({
      eventId,
      eventType,
      payloadHash: hashPayload(rawBody),
      processed: false,
    });
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    if (eventType === 'payment.captured' || eventType === 'payment.failed') {
      const entity = payload.payload?.payment?.entity;
      if (!entity) throw new Error('Missing payment entity');

      const razorpayPaymentId = String(entity.id || '');
      const razorpayOrderId = String(entity.order_id || '');
      const amountPaise = Number(entity.amount || 0);
      const currency = String(entity.currency || 'INR');
      const method = entity.method ? String(entity.method) : null;
      const status = String(entity.status || (eventType === 'payment.captured' ? 'captured' : 'failed'));

      if (eventType === 'payment.failed') {
        const [tx] = await db
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.razorpayOrderId, razorpayOrderId))
          .limit(1);
        if (tx) {
          await markPaymentFailed({
            bookingId: tx.bookingId,
            razorpayOrderId,
            reason: String(entity.error_description || 'payment_failed'),
          });
        }
      } else {
        await confirmFromWebhookPayment({
          razorpayOrderId,
          razorpayPaymentId,
          amountPaise,
          currency,
          method,
          status,
        });
      }
    } else if (eventType === 'order.paid') {
      const entity = payload.payload?.order?.entity;
      if (entity) {
        const razorpayOrderId = String(entity.id || '');
        const amountPaise = Number(entity.amount_paid || entity.amount || 0);
        const currency = String(entity.currency || 'INR');
        // order.paid may not include payment id — rely on existing payment.captured when possible
        const [tx] = await db
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.razorpayOrderId, razorpayOrderId))
          .limit(1);
        if (tx?.razorpayPaymentId) {
          await confirmFromWebhookPayment({
            razorpayOrderId,
            razorpayPaymentId: tx.razorpayPaymentId,
            amountPaise,
            currency,
            method: tx.method,
            status: 'captured',
          });
        }
      }
    }

    await db
      .update(paymentWebhookEvents)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(paymentWebhookEvents.eventId, eventId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'processing_error';
    await db
      .update(paymentWebhookEvents)
      .set({ processingError: message, processedAt: new Date() })
      .where(eq(paymentWebhookEvents.eventId, eventId));
    console.error(JSON.stringify({ scope: 'payments', event: 'webhook_process_error', message }));
    // Return 200 after signature OK so Razorpay doesn't storm retries for app bugs;
    // unprocessed rows can be retried by ops. For transient DB errors, prefer 500.
    if (/DATABASE|timeout|ECONN/i.test(message)) {
      return NextResponse.json({ error: 'temporary failure' }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'processing_error' });
  }
}
