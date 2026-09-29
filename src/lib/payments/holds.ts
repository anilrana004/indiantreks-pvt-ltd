import { expireStaleInventoryHolds } from '@/lib/inventory/service';

/**
 * Release expired payment holds + inventory holds.
 * Availability-safe even if cleanup is delayed — reserve queries ignore expired holds.
 */
export async function expireStaleBookingHolds(limit = 200): Promise<number> {
  const result = await expireStaleInventoryHolds(limit);
  return result.bookings + result.bookingHolds;
}
