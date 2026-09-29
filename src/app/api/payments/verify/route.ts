import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { verifyAndConfirmPayment } from '@/lib/payments/service';
import {
  PAYMENT_VERIFY_USER_LIMIT,
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
        scope: 'payments.verify',
        event: 'auth_required',
        ip: clientIp(req),
      }),
    );
    return unauthorizedUserResponse();
  }

  const limited = await checkUserRateLimit(PAYMENT_VERIFY_USER_LIMIT, user.id);
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
    return NextResponse.json(
      {
        error: status === 401 ? 'Please sign in to continue.' : message,
        code: status === 401 ? 'AUTH_REQUIRED' : undefined,
      },
      { status: Number.isFinite(status) ? status : 400 },
    );
  }
}
