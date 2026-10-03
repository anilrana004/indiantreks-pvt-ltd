import { ensureCldAuto } from '@/lib/cloudinary';

/**
 * Dayara Bugyal trek photos — Cloudinary uploads (jum1mpl0).
 * Order: winter ridge / trail → peaks → meadow flock → summit group.
 */
const DAYARA_BUGYAL_IMAGE_URLS = [
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019288/569560805_18532220644014692_6630410473873304238_n.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019296/570528493_18532220662014692_5194001047080098035_n.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019303/571701426_18532220626014692_6372883959866500451_n.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019307/571963409_18532220683014692_5866388228350094627_n.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019311/572126311_18532220653014692_3526013383201624424_n.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019315/573107677_18532220674014692_7126258436546609785_n.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019364/573113931_18532220692014692_7874713597392721752_n.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019369/ashish-kumar-senapati-6eH51qNqyO8-unsplash_1.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019375/himalayan-dream-treks-S_AeIeG3px8-unsplash.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791019379/vipra-rawat-JbXMOCVP-0o-unsplash.jpg',
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
export const DAYARA_BUGYAL_GALLERY: readonly string[] = uniqueGalleryUrls(DAYARA_BUGYAL_IMAGE_URLS);

/** Primary hero — winter ridge ascent. */
export const DAYARA_BUGYAL_HERO = DAYARA_BUGYAL_GALLERY[0]!;

/** Listing / home card — snowshoe / meadow scene. */
export const DAYARA_BUGYAL_CARD = DAYARA_BUGYAL_GALLERY[1] ?? DAYARA_BUGYAL_HERO;

/** Homepage / media hero alias. */
export const DAYARA_HERO = DAYARA_BUGYAL_HERO;
