import { cloudinaryAssetUrl, ensureCldAuto } from '@/lib/cloudinary';

/**
 * Pangarchulla Peak trek photos — Cloudinary uploads (jum1mpl0).
 * Order: hero panorama → trail/action → camp → summit moments.
 */
const PANGARCHULLA_IMAGE_URLS = [
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017112/pexels-ex-route-adventures-656223369-39361242.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017111/pexels-ex-route-adventures-656223369-39361246.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017101/pexels-ex-route-adventures-656223369-39361238.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017099/pexels-ex-route-adventures-656223369-39361237.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017098/pexels-ex-route-adventures-656223369-39361233.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017089/669990455_18437128243137671_6059383180424476361_n.heic.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017086/669670221_18437128174137671_4523546905263963214_n.heic.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017082/669038841_18437128204137671_6450403407631536287_n.heic.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017073/661565900_18437128234137671_8706150185456161233_n.heic.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017070/643001880_18437128216137671_1862602440674948317_n.heic.jpg',
] as const;

function uniqueGalleryUrls(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const url = ensureCldAuto(raw);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Full gallery for trek detail hero, lightbox, and mobile slider. */
export const PANGARCHULLA_GALLERY: readonly string[] = uniqueGalleryUrls(PANGARCHULLA_IMAGE_URLS);

/** Primary hero — Garhwal peak panorama. */
export const PANGARCHULLA_HERO = PANGARCHULLA_GALLERY[0]!;

/**
 * Listing / home trek-card cover only — not used on the trek detail gallery.
 * Portrait creative with “PANGARCHULLA Trek” title baked into the photo.
 * Width-only transform (no gravity crop) so the designed frame stays intact.
 */
export const PANGARCHULLA_CARD = cloudinaryAssetUrl(
  'v1791143724/Pangarchulla_Trek_Mountain_Poster.png',
  { w: 800, crop: 'scale' },
);
