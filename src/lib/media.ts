import { ensureCldAuto } from '@/lib/cloudinary';
import { KEDARKANTHA_HERO } from '@/lib/content/treks/kedarkantha/gallery-content';

/**
 * Reliable public photo URLs for hero / banners / category chips.
 * Prefer direct Unsplash + Cloudinary upload URLs — never bare Cloudinary `fetch/` without a source.
 */
const u = (id: string, w = 1200, h = 800) =>
  `https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Chopta Tungnath — Tungnath temple complex (Cloudinary, f_auto → WebP/AVIF). */
const CHOPTA_HERO = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1790592538/pexels-vikas-bhandari-421561-10432965.jpg',
);

/** Dayara Bugyal — alpine meadow flock (Cloudinary, f_auto → WebP/AVIF). */
const DAYARA_HERO = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1790592124/ashish-kumar-senapati-6eH51qNqyO8-unsplash.jpg',
);

export const photos = {
  himachal: u('photo-1626621341517-bbf3d9990a23', 1400, 900),
  uttarakhand: u('photo-1506905925346-21bda4d32df4', 1400, 900),
  yatra: u('photo-1564507592333-c60657eea523', 1400, 900),
  kedarnath: u('photo-1548013146-72479768bada', 800, 800),
  ebc: u('photo-1518002054494-3a6f94352e9d', 1400, 900),
  nepal: u('photo-1544735716-392fe2489ffa', 1400, 900),
  chopta: CHOPTA_HERO,
  dayara: DAYARA_HERO,
  hampta: u('photo-1486870591958-9b9d0d1dda99', 1400, 900),
  triund: u('photo-1454496522488-7a8e488e8606', 800, 800),
  snow: u('photo-1483728642387-6c3bdd6c93e5', 1400, 900),
  vof: u('photo-1464822759023-fed622ff2c3b', 1400, 900),
  kedarkantha: KEDARKANTHA_HERO,
  /** Women-only special program hero — golden-hour ridge trekkers */
  womenTrek: u('photo-1551632811-561732d1e306', 1400, 900),
  seniorTrek: u('photo-1464822759023-fed622ff2c3b', 1400, 900),
  familyTrek: u('photo-1506905925346-21bda4d32df4', 1400, 900),
  beginnerTrek: u('photo-1454496522488-7a8e488e8606', 1400, 900),
  /** Trek preparation guide hero — hiker on a mountain ridge */
  prepHero: u('photo-1517824809574-7c93d6a3c0c0', 1400, 900),
  fitnessHero: u('photo-1483728642387-6c3bdd6c93e5', 1400, 900),
  /** Biking trips hero — mountain highway ride */
  bikingHero: u('photo-1486870591958-9b9d0d1dda99', 1400, 900),
  /** Weekend trips hero — Dhauladhar ridge */
  weekendHero: u('photo-1454496522488-7a8e488e8606', 1400, 900),
  /** Backpacking trips hero — ridge trekker at sunrise */
  backpackingHero: u('photo-1517824809574-7c93d6a3c0c0', 1400, 900),
  /** Altitude sickness guide — trekker above cloud sea */
  altitudeHero: u('photo-1506905925346-21bda4d32df4', 1400, 900),
  /** Chopta promo / feature panel — same Chandrashila summit asset */
  choptaSale: CHOPTA_HERO,
  /** Rajasthan — Amber Fort & desert heritage */
  rajasthan: u('photo-1477587457783-2cddac358176', 1400, 900),
  /** South India — Kerala backwaters & coastal greenery */
  southIndia: u('photo-1582979512210-999916ea64d9', 1400, 900),
} as const;

export type PhotoKey = keyof typeof photos;

/** Square thumbnails for the rental-gear carousel on detail pages. */
export const gearPhotos: string[] = [
  u('photo-1454496522488-7a8e488e8606', 600, 600),
  u('photo-1483728642387-6c3bdd6c93e5', 600, 600),
  u('photo-1506905925346-21bda4d32df4', 600, 600),
  u('photo-1464822759023-fed622ff2c3b', 600, 600),
  u('photo-1518002054494-3a6f94352e9d', 600, 600),
  u('photo-1544735716-392fe2489ffa', 600, 600),
  u('photo-1486870591958-9b9d0d1dda99', 600, 600),
  u('photo-1626621341517-bbf3d9990a23', 600, 600),
  u('photo-1564507592333-c60657eea523', 600, 600),
  u('photo-1548013146-72479768bada', 600, 600),
];
