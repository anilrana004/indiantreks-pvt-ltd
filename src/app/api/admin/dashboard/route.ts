import { NextResponse } from 'next/server';
import { dbUnavailableResponse, requireAdmin, unauthorizedResponse } from '@/lib/admin/auth';
import { isDbConfigured } from '@/lib/db';
import { getOperationsDashboardCounts, listBookingsPage } from '@/lib/operations/service';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorizedResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  const [counts, recent] = await Promise.all([
    getOperationsDashboardCounts(),
    listBookingsPage({ page: 1, pageSize: 5 }),
  ]);

  return NextResponse.json({
    bookings: counts.bookings,
    contacts: counts.contacts,
    subscribers: counts.subscribers,
    giftCards: counts.giftCards,
    users: counts.users,
    recentBookings: recent.bookings,
  });
}
