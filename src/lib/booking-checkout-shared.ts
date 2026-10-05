/**
 * Client-safe booking checkout helpers.
 * Keep this module free of `@/lib/data` / trek catalog so the booking SPA stays slim.
 */

export type PricingTier = {
  name: 'Economic' | 'Standard' | 'Premium';
  price: number;
  originalPrice?: number;
  deposit: number;
  badge?: string;
  inclusions: string[];
  exclusions: string[];
};

/** Minimal trek shape the checkout UI needs (server still resolves full catalog). */
export type BookingTrek = {
  id: string;
  title: string;
  duration: string;
  location: string;
  difficulty: string;
  rating: string;
  reviewCount: string;
  groupSize: string;
  images: string[];
  pricing: PricingTier[];
  type?: 'trek' | 'yatra';
};

export function trekDetailPath(trek: BookingTrek, kind?: 'trek' | 'yatra' | 'trip') {
  if (kind === 'trip') return `/trips/${trek.id}`;
  if (kind === 'yatra' || (!kind && trek.type === 'yatra')) return `/yatra/${trek.id}`;
  return `/treks/${trek.id}`;
}

/** Inline add-ons — avoids importing `@/lib/trek-detail-content` (pulls full catalog). */
export const BOOKING_ADDONS: {
  id: 'offloading' | 'insurance' | 'jumbo';
  name: string;
  price: number;
}[] = [
  { id: 'offloading', name: 'Backpack Offloading', price: 1600 },
  { id: 'insurance', name: 'Insurance', price: 210 },
  { id: 'jumbo', name: 'Jumbo bag', price: 2500 },
];
