import { NextRequest, NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { isMongoConfigured, updateGuestReviewStatus } from '@/lib/reviews/service';
import type { GuestReviewStatus } from '@/lib/reviews/types';

const STATUSES = new Set<GuestReviewStatus>(['pending', 'approved', 'rejected']);

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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
    const { id } = await context.params;
    const body = (await req.json()) as { status?: string };
    const status = body.status as GuestReviewStatus | undefined;
    if (!status || !STATUSES.has(status)) {
      return NextResponse.json(
        { error: 'status must be pending, approved, or rejected.' },
        { status: 400 },
      );
    }

    const review = await updateGuestReviewStatus(id, status, gate.admin.email);
    if (!review) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }
    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update review.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
