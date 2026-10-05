import { NextRequest, NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import {
  guestReviewsToCsv,
  isMongoConfigured,
  listAdminGuestReviews,
} from '@/lib/reviews/service';
import type { GuestReviewStatus } from '@/lib/reviews/types';

export async function GET(req: NextRequest) {
  const gate = await requireAdminPermission('content.write');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();

  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: 'MongoDB is not configured. Set MONGODB_URI.' },
      { status: 503 },
    );
  }

  try {
    const statusParam = (req.nextUrl.searchParams.get('status') || 'all') as
      | GuestReviewStatus
      | 'all';
    const search = req.nextUrl.searchParams.get('q') || '';
    const format = (req.nextUrl.searchParams.get('format') || 'json').toLowerCase();

    const reviews = await listAdminGuestReviews({
      status: statusParam,
      search,
      limit: 1000,
    });

    if (format === 'csv') {
      const csv = guestReviewsToCsv(reviews);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="guest-reviews-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store, private',
        },
      });
    }

    if (format === 'json-download') {
      const body = JSON.stringify(
        { exportedAt: new Date().toISOString(), count: reviews.length, reviews },
        null,
        2,
      );
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="guest-reviews-${new Date().toISOString().slice(0, 10)}.json"`,
          'Cache-Control': 'no-store, private',
        },
      });
    }

    return NextResponse.json({ reviews, count: reviews.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load reviews.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
