import { NextResponse } from 'next/server';

/**
 * Legacy public booking create trusted client `amount` and is unsafe for Razorpay.
 * All paid bookings must go through `/api/bookings/checkout` (server-priced).
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'This booking endpoint is disabled. Use the checkout flow.',
      code: 'LEGACY_BOOKING_DISABLED',
      checkout: '/api/bookings/checkout',
    },
    { status: 410 },
  );
}
