import type { PricingTier } from '@/lib/data';

export type BookingSharingLabel = 'Triple Sharing' | 'Double Sharing' | 'Single Sharing';

export type BookingSharingOption = {
  /** Underlying pricing tier key (Economic / Standard / Premium) */
  key: PricingTier['name'];
  label: BookingSharingLabel;
  price: number;
  originalPrice?: number;
  deposit: number;
  badge: string;
};

const LABELS_BY_COUNT: Record<number, BookingSharingLabel[]> = {
  1: ['Triple Sharing'],
  2: ['Triple Sharing', 'Single Sharing'],
  3: ['Triple Sharing', 'Double Sharing', 'Single Sharing'],
};

const BADGES: Record<BookingSharingLabel, string> = {
  'Triple Sharing': 'Best Value',
  'Double Sharing': 'Most Popular',
  'Single Sharing': 'Premium',
};

/**
 * Booking-form occupancy options from price rank:
 * lowest → Triple Sharing, mid → Double Sharing, highest → Single Sharing.
 */
export function bookingSharingOptions(pricing: PricingTier[]): BookingSharingOption[] {
  const sorted = [...pricing].sort((a, b) => a.price - b.price);
  if (sorted.length === 0) return [];

  const tiers =
    sorted.length >= 3
      ? [sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]]
      : sorted;

  const labels = LABELS_BY_COUNT[Math.min(tiers.length, 3)] ?? LABELS_BY_COUNT[3];

  return tiers.map((t, i) => {
    const label = labels[i]!;
    return {
      key: t.name,
      label,
      price: t.price,
      originalPrice: t.originalPrice,
      deposit: t.deposit,
      badge: BADGES[label],
    };
  });
}

export function bookingSharingLabel(pricing: PricingTier[], pkgKey: string): string {
  return bookingSharingOptions(pricing).find((o) => o.key === pkgKey)?.label ?? pkgKey;
}

export function defaultBookingPkg(pricing: PricingTier[]): PricingTier['name'] {
  return bookingSharingOptions(pricing)[0]?.key ?? pricing[0]?.name ?? 'Economic';
}
