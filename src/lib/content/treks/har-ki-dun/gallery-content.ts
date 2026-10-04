import { cloudinaryAssetUrl } from '@/lib/cloudinary';

/**
 * Listing / home trek-card cover only — not used on the trek detail gallery.
 * Portrait creative with “HARKIDUN Trek” title baked into the photo.
 * Width-only transform (no gravity crop) so the designed frame stays intact.
 */
export const HAR_KI_DUN_CARD = cloudinaryAssetUrl(
  'v1791136478/Harkidun_Trek_at_Sunset.png',
  { w: 800, crop: 'scale' },
);
