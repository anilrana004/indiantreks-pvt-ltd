import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/db';
import { expireStaleBookingHolds } from '@/lib/payments/holds';

export const runtime = 'nodejs';

/**
 * Cron/ops endpoint to expire payment holds.
 * Authorize with CRON_SECRET (Bearer or ?secret=).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const querySecret = req.nextUrl.searchParams.get('secret') || '';
  if (bearer !== secret && querySecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const expired = await expireStaleBookingHolds();
  return NextResponse.json({ ok: true, expired });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
