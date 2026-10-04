import { cloudinaryAssetUrl, ensureCldAuto } from '@/lib/cloudinary';

/**
 * Kuari Pass trek photos — Cloudinary uploads (jum1mpl0).
 * Order: ascent / ridge → group → camp → summit vistas.
 */
const KUARI_PASS_IMAGE_URLS = [
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018082/53624-Kuari-Pass-Indiahikes-Valay-Bhatt-Ascent-from-Khulara-to-K-extractpics.webp',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018090/image-extractpics_1.webp',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018097/image-extractpics.webp',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018099/IMG-20250101-WA0021_1.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018103/IMG-20250101-WA0028.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018112/IMG20260311074408.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018119/IMG20260311130426.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018121/IMG20260311095038.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018125/IMG20260311135042.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018127/IMG20260311130539.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018129/IMG20260311135045.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018136/IMG20260311155632.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018141/IMG20260312123616.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018143/IMG20260312154031.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018148/IMG20260313090504.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018156/pexels-ex-route-adventures-656223369-39361248.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018163/pexels-ex-route-adventures-656223369-39361249.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018177/pexels-k-s-aravinda-kashyap-86628820-31580154.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791018181/pexels-k-s-aravinda-kashyap-86628820-31580171.jpg',
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
export const KUARI_PASS_GALLERY: readonly string[] = uniqueGalleryUrls(KUARI_PASS_IMAGE_URLS);

/** Primary hero — ascent toward Kuari Pass. */
export const KUARI_PASS_HERO = KUARI_PASS_GALLERY[0]!;

/**
 * Listing / home trek-card cover only — not used on the trek detail gallery.
 * Portrait creative with “KUARI PASS Trek” title baked into the photo.
 * Width-only transform (no gravity crop) so the designed frame stays intact.
 */
export const KUARI_PASS_CARD = cloudinaryAssetUrl(
  'v1791136822/Kuari_Pass_Trek_Through_Snowy_Pines.png',
  { w: 800, crop: 'scale' },
);

/**
 * Homepage seasonal hero — exact delivery (no aggressive crop) for object-cover.
 */
export const KUARI_PASS_HOME_HERO = KUARI_PASS_HERO;
