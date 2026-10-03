import { ensureCldAuto } from '@/lib/cloudinary';

/**
 * Chopta Tungnath / Chandrashila trek photos — Cloudinary uploads (jum1mpl0).
 * Order: trail & peaks → temple → group moments.
 */
const CHOPTA_TUNGNATH_IMAGE_URLS = [
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020183/IMG20230817133309.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020178/IMG20230817133252.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020174/IMG20230817133233.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020169/IMG20230817083239.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020163/IMG_4274.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020160/IMG_4262.heic',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020153/f1765af7-43da-4dd0-ae25-e9aa275ffdea.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020149/dc0dee06-72a3-4343-a0de-619f55bf29fc.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020143/c9b9b2a8-1e0b-44c5-952f-e3d81135cafb.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020139/c6bc56d1-03f4-409e-90c8-49bb021ba4ca.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020134/83c97bfc-9cde-40bf-876a-71addeb74686.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020129/75cf9329-0946-4e31-9cc5-0b0cdc8bcb3e.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020125/9f247554-3bdd-43f5-982d-667a2699b600.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020120/9_20250901_193829_0008.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020116/8_20250901_193829_0007.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020111/7_20250901_193829_0006.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020107/6_20250901_193829_0005.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020103/5a86d204-d43c-4e2e-96dc-77ba84961198.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020098/5_20250901_193828_0004.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791020094/04b8838b-6686-4b3d-b885-1dd89221e17f.jpg',
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
export const CHOPTA_TUNGNATH_GALLERY: readonly string[] = uniqueGalleryUrls(
  CHOPTA_TUNGNATH_IMAGE_URLS,
);

/** Primary hero. */
export const CHOPTA_TUNGNATH_HERO = CHOPTA_TUNGNATH_GALLERY[0]!;

/** Listing / home card. */
export const CHOPTA_TUNGNATH_CARD = CHOPTA_TUNGNATH_GALLERY[1] ?? CHOPTA_TUNGNATH_HERO;

/** Media / homepage alias. */
export const CHOPTA_HERO = CHOPTA_TUNGNATH_HERO;
