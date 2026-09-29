/**
 * Authoritative pickup fee values the storefront may charge.
 * UI today only applies ₹2000 for the secondary gateway pickup option.
 * Never accept arbitrary client fees.
 */
export const ALLOWED_PICKUP_FEES_INR = [0, 2000] as const;

export const MAX_PICKUP_FEE_INR = 2000;

/** Clamp/reject untrusted client pickup fees to the allowed catalog. */
export function resolveTrustedPickupFeeInr(raw: unknown): number {
  const n = Math.floor(Number(raw) || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if ((ALLOWED_PICKUP_FEES_INR as readonly number[]).includes(n)) return n;
  // Unknown values are ignored (cannot inflate or invent fees).
  return 0;
}
