import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import {
  createCheckoutBooking,
  createRazorpayOrderForBooking,
} from '@/lib/payments/service';
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
import { getCurrentUser, unauthorizedUserResponse } from '@/lib/user-auth/auth';

export const runtime = 'nodejs';

/**
 * Single-round-trip Pay Now: create booking hold + Razorpay order.
 * Cuts one client↔server hop vs /checkout then /create-order.
 */
export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: 'Online payments are not configured yet. Set Razorpay env vars.' },
      { status: 503 },
    );
  }

  // IP abuse check + session user lookup are independent — run together.
  const [abuse, user] = await Promise.all([
    checkIpAbuseLimit(PROTECTED_MUTATION_IP_ABUSE_LIMIT, clientIp(req)),
    getCurrentUser(),
  ]);
  if (!abuse.allowed) {
    return rateLimitedResponse(abuse.retryAfterSec);
  }
  if (!user) {
    return unauthorizedUserResponse();
  }

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

    const checkout = await createCheckoutBooking({
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
    });

    const order = await createRazorpayOrderForBooking(
      checkout.bookingId,
      checkout.checkoutToken,
      {
        idempotencyKey:
          req.headers.get('idempotency-key')?.trim() || `order:${checkout.bookingId}`,
        user,
        freshCheckout: true,
      },
    );

    return NextResponse.json(
      {
        checkoutToken: checkout.checkoutToken,
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
