import type { CategoryItem } from '@/components/home/CategoryScroller';
import { photos } from '@/lib/media';
import { KEDARKANTHA_HOME_HERO } from '@/lib/content/treks/kedarkantha/gallery-content';

/**
 * JustWravel-style homepage category strip.
 * Short labels; `featured` = brand-green ring + label (campaign / season).
 * Links and copy map to existing storefront routes only.
 */
export const HOME_EXPLORE_CATEGORIES: CategoryItem[] = [
  {
    n: 'Winter Treks',
    h: '/treks?season=winter',
    img: KEDARKANTHA_HOME_HERO,
    featured: true,
  },
  {
    n: 'Early Bird',
    h: '/bucket-list-sale',
    img: photos.snow,
  },
  {
    n: 'New Launches',
    h: '/new-launches',
    img: photos.snow,
  },
  {
    n: 'Best Sellers',
    h: '/best-sellers',
    img: photos.vof,
  },
  {
    n: 'Upcoming',
    h: '/upcoming-trips',
    img: photos.uttarakhand,
  },
  {
    n: 'Treks',
    h: '/treks',
    img: photos.uttarakhand,
  },
  {
    n: 'Backpacking',
    h: '/backpacking',
    img: photos.himachal,
  },
  {
    n: 'International',
    h: '/international-getaways',
    img: photos.nepal,
  },
  {
    n: 'Biking',
    h: '/biking',
    img: photos.bikingHero,
  },
  {
    n: 'India',
    h: '/domestic-tours',
    img: photos.triund,
  },
  {
    n: 'Weekend',
    h: '/weekend-trips',
    img: photos.chopta,
  },
  {
    n: 'Yatra',
    h: '/yatra',
    img: photos.kedarnath,
  },
  {
    n: 'Honeymoon',
    h: '/honeymoon',
    img: photos.vof,
  },
  {
    n: 'All Girls',
    h: '/women-only-treks',
    img: photos.womenTrek,
  },
  {
    n: 'Family',
    h: '/family-treks',
    img: photos.familyTrek,
  },
  {
    n: 'Beginners',
    h: '/beginner-friendly-treks',
    img: photos.beginnerTrek,
  },
  {
    n: 'Seniors',
    h: '/senior-citizen-treks',
    img: photos.seniorTrek,
  },
  {
    n: 'Gear',
    h: '/gear-rental',
    img: photos.hampta,
  },
];
