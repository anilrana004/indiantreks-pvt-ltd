import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { getBookingPublicSummary } from '@/lib/payments/service';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const { id } = await ctx.params;
  const checkoutToken = req.nextUrl.searchParams.get('token') || '';
  if (!id || !checkoutToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await getBookingPublicSummary(id, checkoutToken);
  if (!summary) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(summary);
}
