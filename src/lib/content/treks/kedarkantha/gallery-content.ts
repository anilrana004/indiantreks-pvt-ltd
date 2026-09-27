import { cloudinaryAssetUrl, ensureCldAuto } from '@/lib/cloudinary';

/**
 * Kedarkantha trek photos — jum1mpl0 Cloudinary collection.
 * @see https://collection.cloudinary.com/jum1mpl0/9a377cf707ed2f097052f8a0d4bf9b8b
 */
export function kedarkanthaImage(path: string, w = 1200): string {
  return cloudinaryAssetUrl(path, { w, crop: 'fill', gravity: 'auto' });
}

/** Curated hero-first order; duplicates removed at build time. */
const KEDARKANTHA_IMAGE_PATHS = [
  'v1788246754/IMG_5641.heic',
  'v1788246748/IMG-20230309-WA0019.jpg',
  'v1788246738/IMG-20241118-WA0007.jpg',
  'v1788246739/IMG-20241210-WA0035.jpg',
  'v1788246747/IMG-20230330-WA0006.jpg',
  'v1788246744/IMG-20230401-WA0034.jpg',
  'v1788246742/IMG-20231130-WA0039_2.jpg',
  'v1788246753/IMG_6024.heic',
  'v1788246750/IMG-20221221-WA0006.jpg',
  'v1788246746/IMG-20230401-WA0033.jpg',
  'v1788246743/IMG-20230401-WA0035.jpg',
  'v1788246740/IMG-20231218-WA0012.jpg',
  'v1788246739/IMG-20231227-WA0040_1.jpg',
  'v1788246739/IMG-20240110-WA0004.jpg',
  'v1788246759/palak-pitroda-t63q3FkRt-E-unsplash.jpg',
  'v1788246760/ram-kumar-By7tQlz_ymc-unsplash.jpg',
] as const;

function uniqueGalleryUrls(paths: readonly string[]): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const path of paths) {
    const url = kedarkanthaImage(path);
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

/** Full gallery for trek detail hero, lightbox, and mobile slider. */
export const KEDARKANTHA_GALLERY: readonly string[] = uniqueGalleryUrls(KEDARKANTHA_IMAGE_PATHS);

/** Primary hero — summit celebration at 12,500 ft. */
export const KEDARKANTHA_HERO = KEDARKANTHA_GALLERY[0];

/**
 * Homepage desktop hero background.
 * Exact delivery URL (no auto-gravity crop) so object-cover matches the source frame.
 */
export const KEDARKANTHA_HOME_HERO = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1790522425/shubham-dhage-9RJA4B3hDAM-unsplash.jpg',
);

/** Secondary hero panel — Juda Ka Talab winter scene. */
export const KEDARKANTHA_FEATURE = KEDARKANTHA_GALLERY[2];

/** Listing / home card cover only — not used on the trek detail page. */
export const KEDARKANTHA_CARD = kedarkanthaImage(
  'v1788514322/ChatGPT_Image_Sep_4_2026_03_00_26_PM.png',
  800,
);
