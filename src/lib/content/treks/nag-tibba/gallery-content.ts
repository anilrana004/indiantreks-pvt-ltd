import { ensureCldAuto } from '@/lib/cloudinary';

/**
 * Nag Tibba trek photos — Cloudinary uploads (jum1mpl0).
 * Order: winter ridge → trail/action → summit group → camp → vistas.
 */
const NAG_TIBBA_IMAGE_URLS = [
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017538/1zprgkhw51c1bjxdg26kc50jpxaw_1550555866_IMG_20190209_131333.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017542/6mfz4ixmk5yhfepdcpveukz7vxqq_1562206704_Snapchat-636987513.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017552/82b64b4d-3bb6-43d8-a876-36c300b7e178_nag_tibba_gallery_desk_5.webp',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017558/35835d19-d5d1-41ab-ad64-659bde869780_nag_tibba_gallery_desk_2.webp',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017562/ac7udzknirf59yecdmlmo8sfydak_1514979914_IMG_20180103_132943_854.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017566/b6d8b6fb-247b-4e0f-869e-0bd2bd5f9b12_nag_tibba_gallery_desk_3.webp',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017571/e7yfpfotvvqd1.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017576/eec8186a-7bee-45ec-b128-eb4da61462ee_nag_tibba_gallery_desk_1.webp',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017580/nthttrrq59bfnseu4h980ukc3p8p_1540907151_IMG20181028100042.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017585/scckbg7l60uh5jz2ntaj2cbw4zeg_1550555867_IMG_20190210_063118.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017590/tlt979xpp6nfjegnrqh9q1j8iljq_1562206704_IMG_20190223_173903.jpg',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017594/vzcdu0otb28ezfrncing.webp',
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791017599/y4a8j9zwvqqrg59185iakzx00psm_1514979915_20180101_103414.jpg',
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
export const NAG_TIBBA_GALLERY: readonly string[] = uniqueGalleryUrls(NAG_TIBBA_IMAGE_URLS);

/** Primary hero — winter ridge / meadow light. */
export const NAG_TIBBA_HERO = NAG_TIBBA_GALLERY[0]!;

/** Listing / home card — snow forest vista. */
export const NAG_TIBBA_CARD = NAG_TIBBA_GALLERY[1] ?? NAG_TIBBA_HERO;
