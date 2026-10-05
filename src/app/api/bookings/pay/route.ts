import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { createPayNowCheckout } from '@/lib/payments/service';
import type { BookingPayment } from '@/lib/operations/types';
import {
  CHECKOUT_LIMIT,
  PAYMENT_ORDER_LIMIT,
  PROTECTED_MUTATION_IP_ABUSE_LIMIT,
  checkIpAbuseLimit,
  checkUserRateLimit,
  clientIp,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';
import { getSessionIdentity, unauthorizedUserResponse } from '@/lib/user-auth/auth';
import type { PublicUser } from '@/lib/user-auth/types';

export const runtime = 'nodejs';

/**
 * Single-round-trip Pay Now: inventory hold + booking + Razorpay order (parallelized).
 * Used for Confirm-step warm and click fallback — same correctness guarantees.
 */
export async function HEAD() {
  // Connection warm from booking SPA — no body work.
  return new NextResponse(null, { status: 204 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'HEAD, OPTIONS, POST',
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: 'Online payments are not configured yet. Set Razorpay env vars.' },
      { status: 503 },
    );
  }

  // JWT peek (no DB) + IP abuse in parallel — hot path.
  const [abuse, session] = await Promise.all([
    checkIpAbuseLimit(PROTECTED_MUTATION_IP_ABUSE_LIMIT, clientIp(req)),
    getSessionIdentity(),
  ]);
  if (!abuse.allowed) {
    return rateLimitedResponse(abuse.retryAfterSec);
  }
  if (!session) {
    return unauthorizedUserResponse();
  }

  const user = { id: session.userId, email: session.email } as PublicUser;

  const [checkoutLimited, orderLimited] = await Promise.all([
    checkUserRateLimit(CHECKOUT_LIMIT, user.id),
    checkUserRateLimit(PAYMENT_ORDER_LIMIT, user.id),
  ]);
  if (!checkoutLimited.allowed) {
    return rateLimitedResponse(checkoutLimited.retryAfterSec);
  }
  if (!orderLimited.allowed) {
    return rateLimitedResponse(orderLimited.retryAfterSec);
  }

  try {
    const body = await req.json();
    const paymentMode = (body.paymentMode || body.payment || 'deposit') as BookingPayment;
    if (!['deposit', 'half', 'full'].includes(paymentMode)) {
      return NextResponse.json({ error: 'Invalid payment mode' }, { status: 400 });
    }

    const idempotencyKey =
      req.headers.get('idempotency-key')?.trim() ||
      `pay:${String(body.trekId || '')}:${String(body.date || '')}:${String(body.email || '')}`;

    const result = await createPayNowCheckout({
      trekId: String(body.trekId || ''),
      packageName: String(body.packageName || body.package || ''),
      persons: Number(body.persons || 1),
      paymentMode,
      addonIds: Array.isArray(body.addonIds) ? body.addonIds.map(String) : [],
      pickupFeePerPerson: Number(body.pickupFeePerPerson || 0),
      gearLines: Array.isArray(body.gearLines)
        ? body.gearLines.map((g: { gearId?: string; qty?: number }) => ({
            gearId: String(g.gearId || ''),
            qty: Number(g.qty || 0),
          }))
        : [],
      name: String(body.name || ''),
      email: String(body.email || ''),
      phone: String(body.phone || ''),
      city: String(body.city || ''),
      date: String(body.date || ''),
      batchId: body.batchId ? String(body.batchId) : undefined,
      notes: String(body.notes || ''),
      pickup: String(body.pickup || ''),
      participants: Array.isArray(body.participants) ? body.participants : [],
      user,
      idempotencyKey,
    });

    const { reused: _reused, checkoutToken, ...order } = result;

    return NextResponse.json(
      {
        checkoutToken,
        ...order,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    const code =
      typeof err === 'object' && err && 'code' in err
        ? String((err as { code: string }).code)
        : undefined;
    const status =
      typeof err === 'object' && err && 'status' in err
        ? Number((err as { status: number }).status)
        : message.includes('not found')
          ? 404
          : 400;
    return NextResponse.json(
      {
        error: status === 401 ? 'Please sign in to continue.' : message,
        code:
          code ||
          (status === 401 ? 'AUTH_REQUIRED' : status === 409 ? 'BOOKING_UNAVAILABLE' : undefined),
      },
      { status: Number.isFinite(status) ? status : 400 },
    );
  }
}
