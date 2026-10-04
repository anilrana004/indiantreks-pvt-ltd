import { cloudinaryAssetUrl } from '@/lib/cloudinary';

/**
 * Listing / home trek-card cover only — not used on the trek detail gallery.
 * Portrait creative with “HAMPTA Pass” title baked into the photo.
 * Width-only transform (no gravity crop) so the designed frame stays intact.
 */
export const HAMPTA_PASS_CARD = cloudinaryAssetUrl(
  'v1791133647/Hampta_Pass_Alpine_Trek_Adventure.png',
  { w: 800, crop: 'scale' },
);
