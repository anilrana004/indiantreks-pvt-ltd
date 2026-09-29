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

async function processWebhookEvent(
  db: NonNullable<ReturnType<typeof getDb>>,
  payload: {
    event?: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      order?: { entity?: Record<string, unknown> };
    };
  },
) {
  const eventType = String(payload.event || '');

  if (eventType === 'payment.captured' || eventType === 'payment.failed') {
    const entity = payload.payload?.payment?.entity;
    if (!entity) throw new Error('Missing payment entity');

    const razorpayPaymentId = String(entity.id || '');
    const razorpayOrderId = String(entity.order_id || '');
    const amountPaise = Number(entity.amount || 0);
    const currency = String(entity.currency || 'INR');
    const method = entity.method ? String(entity.method) : null;
    const status = String(
      entity.status || (eventType === 'payment.captured' ? 'captured' : 'failed'),
    );

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
      return;
    }

    await confirmFromWebhookPayment({
      razorpayOrderId,
      razorpayPaymentId,
      amountPaise,
      currency,
      method,
      status,
    });
    return;
  }

  if (eventType === 'order.paid') {
    const entity = payload.payload?.order?.entity;
    if (!entity) return;
    const razorpayOrderId = String(entity.id || '');
    const amountPaise = Number(entity.amount_paid || entity.amount || 0);
    const currency = String(entity.currency || 'INR');
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

/**
 * Razorpay webhooks — signature over RAW body. Do not parse JSON before verify.
 * Intentionally NOT aggressively rate-limited (Razorpay retries during spikes).
 *
 * Idempotency: event id is unique. Failed processing leaves processed=false so
 * Razorpay retries re-run the handler instead of being treated as duplicates.
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

  let isRetry = false;
  try {
    await db.insert(paymentWebhookEvents).values({
      eventId,
      eventType,
      payloadHash: hashPayload(rawBody),
      processed: false,
    });
  } catch {
    const [existing] = await db
      .select()
      .from(paymentWebhookEvents)
      .where(eq(paymentWebhookEvents.eventId, eventId))
      .limit(1);

    if (existing?.processed) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    // Prior attempt failed — reprocess instead of silently acknowledging.
    isRetry = true;
  }

  try {
    await processWebhookEvent(db, payload);

    await db
      .update(paymentWebhookEvents)
      .set({
        processed: true,
        processingError: null,
        processedAt: new Date(),
      })
      .where(eq(paymentWebhookEvents.eventId, eventId));

    return NextResponse.json({ ok: true, retry: isRetry || undefined });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'processing_error';
    await db
      .update(paymentWebhookEvents)
      .set({ processingError: message, processedAt: new Date(), processed: false })
      .where(eq(paymentWebhookEvents.eventId, eventId));
    console.error(JSON.stringify({ scope: 'payments', event: 'webhook_process_error', message }));
    // Ask Razorpay to retry; processed stays false so retries re-run.
    return NextResponse.json({ error: 'temporary failure' }, { status: 500 });
  }
}
