import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { clientIp, consumePaymentRateLimit } from '@/lib/payments/rate-limit';
import { verifyAndConfirmPayment } from '@/lib/payments/service';
import { rateLimitedResponse } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 503 });
  }

  const ip = clientIp(req);
  const limited = await consumePaymentRateLimit('payment.verify', ip, 30, 60_000);
  if (!limited.allowed) {
    return rateLimitedResponse(limited.retryAfterSec);
  }

  try {
    const body = await req.json();
    const result = await verifyAndConfirmPayment({
      bookingId: String(body.bookingId || ''),
      checkoutToken: String(body.checkoutToken || ''),
      razorpayOrderId: String(body.razorpay_order_id || body.razorpayOrderId || ''),
      razorpayPaymentId: String(body.razorpay_payment_id || body.razorpayPaymentId || ''),
      razorpaySignature: String(body.razorpay_signature || body.razorpaySignature || ''),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    const status =
      typeof err === 'object' && err && 'status' in err
        ? Number((err as { status: number }).status)
        : 400;
    return NextResponse.json({ error: message }, { status: Number.isFinite(status) ? status : 400 });
  }
}
