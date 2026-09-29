import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { createRazorpayOrderForBooking } from '@/lib/payments/service';
import {
  PAYMENT_ORDER_LIMIT,
  PROTECTED_MUTATION_IP_ABUSE_LIMIT,
  checkIpAbuseLimit,
  checkUserRateLimit,
  clientIp,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';
import { getCurrentUser, unauthorizedUserResponse } from '@/lib/user-auth/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 503 });
  }

  const abuse = await checkIpAbuseLimit(PROTECTED_MUTATION_IP_ABUSE_LIMIT, clientIp(req));
  if (!abuse.allowed) {
    return rateLimitedResponse(abuse.retryAfterSec);
  }

  const user = await getCurrentUser();
  if (!user) {
    console.info(
      JSON.stringify({
        scope: 'payments.create_order',
        event: 'auth_required',
        ip: clientIp(req),
      }),
    );
    return unauthorizedUserResponse();
  }

  const limited = await checkUserRateLimit(PAYMENT_ORDER_LIMIT, user.id);
  if (!limited.allowed) {
    return rateLimitedResponse(limited.retryAfterSec);
  }

  try {
    const body = await req.json();
    const bookingId = String(body.bookingId || '');
    const checkoutToken = String(body.checkoutToken || '');
    const idempotencyKey =
      req.headers.get('idempotency-key')?.trim() ||
      (typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '');
    if (!bookingId || !checkoutToken) {
      return NextResponse.json({ error: 'bookingId and checkoutToken are required' }, { status: 400 });
    }

    const order = await createRazorpayOrderForBooking(bookingId, checkoutToken, {
      idempotencyKey: idempotencyKey || undefined,
    });
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create order';
    const status =
      typeof err === 'object' && err && 'status' in err
        ? Number((err as { status: number }).status)
        : 400;
    return NextResponse.json(
      {
        error: status === 401 ? 'Please sign in to continue.' : message,
        code: status === 401 ? 'AUTH_REQUIRED' : undefined,
      },
      { status: Number.isFinite(status) ? status : 400 },
    );
  }
}
