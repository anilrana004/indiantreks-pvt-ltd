import { ensureCldAuto } from '@/lib/cloudinary';

/**
 * Brahmatal trek photos — Cloudinary uploads (jum1mpl0).
 * Order: summit / lake → camp → trail vistas.
 */
const BRAHMATAL_IMAGE_URLS = [
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018782/1qntsyv1suyi0sm5imcyhbk0x3rc_IMG-20230111-WA0017.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018789/5pvr3j61095554tjumoc375mz4x7_IMG-20230101-WA0020.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018797/BlogspotImageUrl53777.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018802/BlogspotImageUrl53784.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018806/dpjy033gigcamjhodnygofblhh7j_IMG_20230117_115812.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018812/pexels-beardedpsyche-36780825.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018818/pexels-beardedpsyche-36812898.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018823/pexels-beardedpsyche-37372430_1.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018827/summit-1536x864.jpg',
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
export const BRAHMATAL_GALLERY: readonly string[] = uniqueGalleryUrls(BRAHMATAL_IMAGE_URLS);

/** Primary hero. */
export const BRAHMATAL_HERO = BRAHMATAL_GALLERY[0]!;

/** Listing / home card. */
export const BRAHMATAL_CARD = BRAHMATAL_GALLERY[1] ?? BRAHMATAL_HERO;

/** Homepage seasonal hero. */
export const BRAHMATAL_HOME_HERO = BRAHMATAL_HERO;
