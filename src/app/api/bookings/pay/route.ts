import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured, warmRazorpayConnection } from '@/lib/payments/razorpay';
import { createPayNowCheckout } from '@/lib/payments/service';
import type { BookingPayment } from '@/lib/operations/types';
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

/**
 * Single-round-trip Pay Now: inventory hold + booking + Razorpay order (parallelized).
 * Used for Confirm-step warm and click fallback — same correctness guarantees.
 */
export async function HEAD() {
  // Connection warm from booking SPA — no body work.
  warmRazorpayConnection();
  return new NextResponse(null, { status: 204 });
}

export async function OPTIONS() {
  warmRazorpayConnection();
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'HEAD, OPTIONS, POST',
    },
  });
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: 'Online payments are not configured yet. Set Razorpay env vars.' },
      { status: 503 },
    );
  }

  // Full user load (DB) — rejects deleted users and revoked session versions.
  const [abuse, user, body] = await Promise.all([
    checkIpAbuseLimit(PROTECTED_MUTATION_IP_ABUSE_LIMIT, clientIp(req)),
    getCurrentUser(),
    req.json().catch(() => null),
  ]);
  if (!abuse.allowed) {
    return rateLimitedResponse(abuse.retryAfterSec);
  }
  if (!user) {
    return unauthorizedUserResponse();
  }

  // One bucket for combined pay-now (booking + order) — avoids double upsert latency.
  const orderLimited = await checkUserRateLimit(PAYMENT_ORDER_LIMIT, user.id);
  if (!orderLimited.allowed) {
    return rateLimitedResponse(orderLimited.retryAfterSec);
  }

  try {
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;
    const paymentMode = (payload.paymentMode || payload.payment || 'deposit') as BookingPayment;
    if (!['deposit', 'half', 'full'].includes(paymentMode)) {
      return NextResponse.json({ error: 'Invalid payment mode' }, { status: 400 });
    }

    const idempotencyKey =
      req.headers.get('idempotency-key')?.trim() ||
      `pay:${String(payload.trekId || '')}:${String(payload.date || '')}:${String(payload.email || '')}`;

    const result = await createPayNowCheckout({
      trekId: String(payload.trekId || ''),
      packageName: String(payload.packageName || payload.package || ''),
      persons: Number(payload.persons || 1),
      paymentMode,
      addonIds: Array.isArray(payload.addonIds) ? payload.addonIds.map(String) : [],
      pickupFeePerPerson: Number(payload.pickupFeePerPerson || 0),
      gearLines: Array.isArray(payload.gearLines)
        ? payload.gearLines.map((g: unknown) => {
            const row = (g || {}) as { gearId?: string; qty?: number };
            return {
              gearId: String(row.gearId || ''),
              qty: Number(row.qty || 0),
            };
          })
        : [],
      name: String(payload.name || ''),
      email: String(payload.email || ''),
      phone: String(payload.phone || ''),
      city: String(payload.city || ''),
      date: String(payload.date || ''),
      batchId: payload.batchId ? String(payload.batchId) : undefined,
      notes: String(payload.notes || ''),
      pickup: String(payload.pickup || ''),
      participants: Array.isArray(payload.participants) ? payload.participants : [],
      user,
      idempotencyKey,
    });


    const { checkoutToken, ...order } = result;
    // `reused` is server-only telemetry — strip before client response.
    delete (order as { reused?: boolean }).reused;

    const ms = Date.now() - started;
    return NextResponse.json(
      {
        checkoutToken,
        ...order,
      },
      {
        status: 201,
        headers: {
          'Server-Timing': `pay-now;dur=${ms}`,
          'Cache-Control': 'no-store',
        },
      },
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
