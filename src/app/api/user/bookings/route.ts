import { NextResponse } from 'next/server';
import { getCurrentUser, unauthorizedUserResponse } from '@/lib/user-auth/auth';
import { listBookingsForEmail } from '@/lib/user-auth/service';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorizedUserResponse();

  const bookings = await listBookingsForEmail(user.email);
    const upcoming = bookings.filter((b) =>
      ['pending', 'pending_payment', 'payment_processing', 'confirmed', 'payment_failed'].includes(b.status),
    );
    const past = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'expired');

  return NextResponse.json({
    bookings,
    upcoming,
    past,
    counts: {
      all: bookings.length,
      upcoming: upcoming.length,
      past: past.length,
    },
  });
}
