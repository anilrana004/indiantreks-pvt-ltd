import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse, requireAdmin, unauthorizedResponse } from '@/lib/admin/auth';
import { isDbConfigured } from '@/lib/db';
import { listBookings, listBookingsPage } from '@/lib/operations/service';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  const page = Number(req.nextUrl.searchParams.get('page') || '1');
  const pageSize = Number(req.nextUrl.searchParams.get('pageSize') || '25');
  const q = req.nextUrl.searchParams.get('q') || '';
  const status = req.nextUrl.searchParams.get('status') || '';
  const all = req.nextUrl.searchParams.get('all') === '1';

  // Legacy full dump for dashboard widgets that still need everything.
  if (all) {
    const bookings = await listBookings();
    return NextResponse.json({ bookings, total: bookings.length });
  }

  const result = await listBookingsPage({ page, pageSize, q, status });
  return NextResponse.json(result);
}
