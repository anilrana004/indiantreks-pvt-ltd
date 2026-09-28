import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { clientIp, rateLimit } from '@/lib/payments/rate-limit';
import { createRazorpayOrderForBooking } from '@/lib/payments/service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 503 });
  }

  const ip = clientIp(req);
  if (!rateLimit(`create-order:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const bookingId = String(body.bookingId || '');
    const checkoutToken = String(body.checkoutToken || '');
    if (!bookingId || !checkoutToken) {
      return NextResponse.json({ error: 'bookingId and checkoutToken are required' }, { status: 400 });
    }

    const order = await createRazorpayOrderForBooking(bookingId, checkoutToken);
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create order';
    const status = typeof err === 'object' && err && 'status' in err ? Number((err as { status: number }).status) : 400;
    return NextResponse.json({ error: message }, { status: Number.isFinite(status) ? status : 400 });
  }
}
