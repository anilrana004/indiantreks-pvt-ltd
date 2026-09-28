import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { clientIp, rateLimit } from '@/lib/payments/rate-limit';
import { createCheckoutBooking } from '@/lib/payments/service';
import type { BookingPayment } from '@/lib/operations/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: 'Online payments are not configured yet. Set Razorpay env vars.' },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  if (!rateLimit(`checkout:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const paymentMode = (body.paymentMode || body.payment || 'deposit') as BookingPayment;
    if (!['deposit', 'half', 'full'].includes(paymentMode)) {
      return NextResponse.json({ error: 'Invalid payment mode' }, { status: 400 });
    }

    const result = await createCheckoutBooking({
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
      notes: String(body.notes || ''),
      pickup: String(body.pickup || ''),
      participants: Array.isArray(body.participants) ? body.participants : [],
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
