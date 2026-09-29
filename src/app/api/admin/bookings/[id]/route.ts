import { NextRequest, NextResponse } from 'next/server';
import {
  dbUnavailableResponse,
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { getDb, isDbConfigured, schema } from '@/lib/db';
import { updateBookingStatus } from '@/lib/operations/service';
import type { BookingStatus } from '@/lib/operations/types';
import { eq } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

const ALLOWED: BookingStatus[] = [
  'pending',
  'pending_payment',
  'payment_processing',
  'confirmed',
  'cancelled',
  'completed',
  'expired',
  'payment_failed',
];

export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdminPermission('bookings.write');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  const { id } = await params;
  const db = getDb();
  if (!db) return dbUnavailableResponse();

  try {
    const body = await req.json();
    const status = body.status as BookingStatus;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const [existing] = await db
      .select({
        id: schema.bookings.id,
        paymentStatus: schema.bookings.paymentStatus,
        status: schema.bookings.status,
      })
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id))
      .limit(1);

    if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // P1: never force-confirm unpaid bookings from admin UI alone.
    if (status === 'confirmed' && existing.paymentStatus !== 'paid') {
      return NextResponse.json(
        {
          error: 'Cannot confirm an unpaid booking. Capture payment first or mark cancelled.',
          code: 'PAYMENT_REQUIRED',
        },
        { status: 409 },
      );
    }

    const booking = await updateBookingStatus(id, status);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    if (status === 'cancelled') {
      try {
        if (existing.paymentStatus === 'paid' || existing.paymentStatus === 'refunded') {
          const { releaseConfirmedSeatsForBooking } = await import('@/lib/inventory/service');
          await releaseConfirmedSeatsForBooking(id);
        } else {
          const [row] = await db
            .select({ holdId: schema.bookings.holdId })
            .from(schema.bookings)
            .where(eq(schema.bookings.id, id))
            .limit(1);
          if (row?.holdId) {
            const { releaseHold } = await import('@/lib/inventory/service');
            await releaseHold(row.holdId, 'cancelled');
          }
        }
      } catch {
        /* status already updated */
      }
    }

    return NextResponse.json({ booking });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ILLEGAL_STATE_TRANSITION') {
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : 'Illegal status transition',
          code: 'ILLEGAL_STATE_TRANSITION',
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
