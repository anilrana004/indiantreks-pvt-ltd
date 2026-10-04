import { cloudinaryAssetUrl } from '@/lib/cloudinary';

/**
 * Listing / home trek-card cover only — not used on the trek detail gallery.
 * Portrait creative with “KASHMIR Great Lake” title baked into the photo.
 * Width-only transform (no gravity crop) so the designed frame stays intact.
 */
export const KASHMIR_GREAT_LAKES_CARD = cloudinaryAssetUrl(
  'v1791142954/Kashmir_Great_Lake_Winter_Escape.png',
  { w: 800, crop: 'scale' },
);
