import { NextRequest, NextResponse } from 'next/server';
import { forbiddenResponse, requireAdminPermission, unauthorizedResponse } from '@/lib/admin/auth';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { initiateRefund } from '@/lib/payments/refunds';

export const runtime = 'nodejs';

/** Admin+finance: create Razorpay refund (never from browser with secrets). */
export async function POST(req: NextRequest) {
  const gate = await requireAdminPermission('refunds.write');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const bookingId = String(body.bookingId || '');
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

    const result = await initiateRefund({
      bookingId,
      amountPaise: body.amountPaise != null ? Number(body.amountPaise) : undefined,
      reason: body.reason ? String(body.reason) : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refund failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
