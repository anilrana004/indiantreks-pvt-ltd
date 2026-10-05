import { NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { getOperationsDashboardCounts, listBookingsPage } from '@/lib/operations/service';

export async function GET() {
  const gate = await requireAdminPermission('bookings.read');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
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
