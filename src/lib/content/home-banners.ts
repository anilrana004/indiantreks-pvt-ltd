import type { BannerItem } from '@/components/Banners';
import { photos } from '@/lib/media';
import { cloudinaryAssetUrl } from '@/lib/cloudinary';

/**
 * Designed promo strips — width-only scale of native 3840×764 art.
 * f_auto/q_auto keep bytes low; no pad/fill so framing stays intact.
 */
function designedStripBanner(assetPath: string) {
  return {
    mobile: cloudinaryAssetUrl(assetPath, {
      w: 1280,
      crop: 'scale',
    }),
    desktop: cloudinaryAssetUrl(assetPath, {
      w: 1920,
      crop: 'scale',
    }),
  };
}

/** India's Best Winter Treks — homepage explore slide 1. */
const winterTreksBanner = designedStripBanner(
  'v1791151369/indias_best_winter_treks_3840x764.png',
);

/**
 * Kedarkantha winter pre-sell creative (designed strip, 10% off).
 * Asset: kedarkantha_trek_banner_3840x764.png
 */
const kedarkanthaWinterBanner = designedStripBanner(
  'v1791150641/kedarkantha_trek_banner_3840x764.png',
);

/**
 * Char Dham Yatra — sacred Himalayan journey (designed strip).
 * Asset: char_dham_sacred_himalayan_journey_3840x764.png
 */
const charDhamYatraBanner = designedStripBanner(
  'v1791151503/char_dham_sacred_himalayan_journey_3840x764.png',
);

/**
 * Himachal Pradesh adventure — designed strip.
 * Asset: himachal_pradesh_trekking_banner_3840x764.png
 */
const himachalAdventureBanner = designedStripBanner(
  'v1791151090/himachal_pradesh_trekking_banner_3840x764.png',
);

/** Shared winter-treks designed promo (hero mobile strip + homepage explore). */
export const WINTER_TREKS_PROMO_BANNER: BannerItem = {
  src: winterTreksBanner.mobile,
  desktopSrc: winterTreksBanner.desktop,
  href: '/treks?season=winter',
  title: "India's Best Winter Treks",
  designed: true,
  /** Nudge framing up so title / icon row sit clearer in the strip. */
  objectPosition: 'center 36%',
};

export type HomeBannerGroup =
  | 'explore'
  | 'book'
  | 'sale'
  | 'customize'
  | 'international'
  | 'trek'
  | 'community';

/**
 * Shared explore strip — used on desktop homepage AND phone hero.
 * Keep a single source so mobile never drifts from desktop creatives.
 */
export const HOME_EXPLORE_BANNERS: BannerItem[] = [
  WINTER_TREKS_PROMO_BANNER,
  {
    src: kedarkanthaWinterBanner.mobile,
    desktopSrc: kedarkanthaWinterBanner.desktop,
    href: '/treks/kedarkantha',
    title: 'Kedarkantha Trek — Pre Sell · Flat 10% Off',
    designed: true,
  },
  {
    src: charDhamYatraBanner.mobile,
    desktopSrc: charDhamYatraBanner.desktop,
    href: '/yatra',
    title: 'Char Dham Yatra — Sacred Himalayan Journey',
    designed: true,
    /** Tiny upward nudge so title / icon row clear the strip edge. */
    objectPosition: 'center 45%',
  },
  {
    src: himachalAdventureBanner.mobile,
    desktopSrc: himachalAdventureBanner.desktop,
    href: '/treks?region=himachal',
    title: 'Himachal Pradesh — Adventure Capital',
    designed: true,
    /** Tiny upward nudge so title / icon row clear the strip edge. */
    objectPosition: 'center 45%',
  },
];

export const HOME_BANNERS: Record<HomeBannerGroup, BannerItem[]> = {
  explore: HOME_EXPLORE_BANNERS,
  book: [
    { src: photos.kedarkantha, href: '/treks', title: 'Book Now, Pay in EMIs', subtitle: 'Reserve your spot with just ₹799  -  pay the rest later', badge: '0% EMI', discount: 'Pay Later Available' },
    { src: photos.himachal, href: '/treks', title: 'Flexible Payment Options', subtitle: 'Choose full payment or easy installments at checkout', badge: 'No Cost EMI', discount: 'Check Availability' },
    { src: photos.vof, href: '/travel-gift-cards', title: 'Gift a Trip', subtitle: 'Give the gift of adventure to your loved ones', badge: 'Gift Cards', discount: 'Buy Gift Card' },
  ],
  sale: [
    { src: photos.ebc, href: '/bucket-list-sale', title: 'Bucket List Sale  -  UPTO 40% OFF', subtitle: 'Limited period discounts on handpicked bucket list treks & yatras', badge: 'Sale Active', discount: 'Grab Your Deal' },
    { src: photos.uttarakhand, href: '/treks', title: 'Best Value Uttarakhand Treks', subtitle: 'Chopta, Dayara Bugyal, Nag Tibba  -  top-rated at unbeatable prices', badge: 'Best Value', discount: 'Shop Now' },
    { src: photos.snow, href: '/bucket-list-sale', title: 'Flash Sale  -  Extra ₹3,000 OFF', subtitle: 'Use code BUCKET3000 at checkout on all treks', badge: 'Limited Time', discount: 'Book Now' },
  ],
  customize: [
    { src: photos.chopta, href: '/customized', title: 'Customize Your Himalayan Trek', subtitle: 'Tell us your preferences  -  we will build your dream Uttarakhand or Himachal trip', badge: 'Tailor-Made', discount: 'Plan Your Trip' },
    { src: photos.yatra, href: '/customized', title: 'Char Dham Yatra Packages', subtitle: 'Customized pilgrimage tours for groups, families & seniors', badge: 'Yatra Special', discount: 'Enquire Now' },
    { src: photos.nepal, href: '/customized', title: 'Nepal Custom Tours', subtitle: 'EBC · ABC · Kathmandu · Chitwan  -  crafted just for you', badge: 'Nepal', discount: 'View Packages' },
  ],
  international: [
    { src: photos.nepal, href: '/treks?region=nepal', title: 'Nepal  -  Himalayan Kingdom', subtitle: 'Everest Base Camp · Annapurna · Kathmandu · Pokhara · Chitwan', badge: 'Nepal', discount: 'Explore Nepal' },
    { src: photos.ebc, href: '/treks/everest-base-camp', title: 'Everest Base Camp Trek', subtitle: 'Stand at the foot of the world\'s highest peak', badge: 'Legendary', discount: '13D/12N' },
    { src: photos.hampta, href: '/treks/nepal-backpacking', title: 'Nepal Backpacking Circuit', subtitle: 'Kathmandu · Pokhara · Chitwan  -  Complete Nepal experience', badge: 'UPTO ₹8,000 OFF', discount: '10D/9N' },
  ],
  trek: [
    { src: photos.uttarakhand, href: '/treks', title: 'Trek the Himalayas', subtitle: 'Valley of Flowers · Kedarkantha · Hampta Pass · Chopta & 18+ more', badge: 'Himalayas', discount: 'View All Treks' },
    { src: photos.kedarkantha, desktopSrc: photos.kedarkantha, href: '/treks/kedarkantha', title: 'Kedarkantha  -  Winter Wonderland', subtitle: 'India\'s most popular winter trek with 360° Himalayan panoramas', badge: 'Winter Special', discount: '5D/4N' },
    { src: photos.vof, href: '/treks/valley-of-flowers', title: 'Valley of Flowers  -  Blooming Paradise', subtitle: 'UNESCO World Heritage  -  alpine meadows, rare flora, snow-capped vistas', badge: 'Monsoon Magic', discount: '6D/5N' },
  ],
  community: [
    { src: photos.triund, href: '/treks', title: 'Join 80,000+ Travelers', subtitle: 'Be part of India\'s fastest growing travel community', badge: 'Community', discount: 'Start Your Journey' },
    { src: photos.chopta, href: '/blog', title: 'Travel Stories & Guides', subtitle: 'Read experiences from fellow trekkers & yatris', badge: 'Blog', discount: 'Read Stories' },
    { src: photos.himachal, href: '/campus-ambassador', title: 'Campus Ambassador Program', subtitle: 'Lead, earn, and travel with Indian Treks', badge: 'Apply Now', discount: 'Know More' },
  ],
};
