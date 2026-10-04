import { cloudinaryAssetUrl } from '@/lib/cloudinary';

/**
 * Listing / home trek-card cover only — not used on the trek detail gallery.
 * Portrait creative with “TRIUND Mcloadganj” title baked into the photo.
 * Width-only transform (no gravity crop) so the designed frame stays intact.
 */
export const MCLEODGANJ_TREK_CARD = cloudinaryAssetUrl(
  'v1791135322/Triund_Himalayan_Trek_Poster.png',
  { w: 800, crop: 'scale' },
);
