import { NextRequest, NextResponse } from 'next/server';
import { apiError, dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { getBookingPublicSummary } from '@/lib/payments/service';

export const runtime = 'nodejs';

function resolveCheckoutToken(req: NextRequest): string {
  // Header only — query tokens leak via Referer, logs, and shared URLs.
  return (req.headers.get('x-checkout-token') || '').trim();
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const { id } = await ctx.params;
  const checkoutToken = resolveCheckoutToken(req);
  if (!id || !checkoutToken) {
    return apiError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const summary = await getBookingPublicSummary(id, checkoutToken);
  if (!summary) return apiError(404, 'Not found', 'NOT_FOUND');
  return NextResponse.json(summary);
}
