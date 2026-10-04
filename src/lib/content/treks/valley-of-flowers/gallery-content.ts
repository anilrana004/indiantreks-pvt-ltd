import { cloudinaryAssetUrl } from '@/lib/cloudinary';

/**
 * Listing / home trek-card cover only — not used on the trek detail gallery.
 * Portrait creative with “VALLEY OF Flowers” title baked into the photo.
 * Width-only transform (no gravity crop) so the designed frame stays intact.
 */
export const VALLEY_OF_FLOWERS_CARD = cloudinaryAssetUrl(
  'v1791132855/Valley_of_Flowers_Trek.png',
  { w: 800, crop: 'scale' },
);
