import type { BannerItem } from '@/components/Banners';
import { HOME_EXPLORE_BANNERS } from '@/lib/content/home-banners';
import { KEDARKANTHA_FEATURE, KEDARKANTHA_HOME_HERO } from '@/lib/content/treks/kedarkantha/gallery-content';
import {
  KUARI_PASS_CARD,
  KUARI_PASS_HOME_HERO,
} from '@/lib/content/treks/kuari-pass/gallery-content';
import {
  BRAHMATAL_CARD,
  BRAHMATAL_HOME_HERO,
} from '@/lib/content/treks/brahmatal/gallery-content';
import {
  PANGARCHULLA_CARD,
  PANGARCHULLA_HERO,
} from '@/lib/content/treks/pangarchulla/gallery-content';
import {
  NAG_TIBBA_CARD,
  NAG_TIBBA_HERO,
} from '@/lib/content/treks/nag-tibba/gallery-content';
import { KASHMIR_GREAT_LAKES_CARD } from '@/lib/content/treks/kashmir-great-lakes/gallery-content';
import {
  HOME_HIMALAYAN_DEFAULT_SEASON,
  type HomeHimalayanSeason,
} from '@/lib/content/home-himalayan-treks';
import { photos } from '@/lib/media';

export type HeroMobileBanner = {
  /** Phone hero media — video only, no poster / preview image. */
  video: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
};

export type HeroDesktopSlide = {
  id: string;
  name: string;
  sub: string;
  img: string;
  featureImg: string;
  t: 'trek' | 'yatra';
  rating: string;
  duration: string;
  difficulty: string;
  altitude: string;
  distance: string;
  reviews: string;
  season: string;
  group: string;
};

/** Phone hero carousel — video slides only (no still/preview images). */
export const HERO_MOB_BANNERS: HeroMobileBanner[] = [
  {
    video:
      'https://media.indiantreks.in/indian%20treks/winter%20banner/himachal%20paredsh/From%20Klickpin.com-%20Stylish%20side%20hustle%20ideas%20that%20feel%20fresh%20elevated%20and%20surprisingly%20easy%20to%20recreate%20at%20home%20for%20busy%20people%20who%20still%20want%20gor.mp4',
    title: 'Himachal Adventures',
    subtitle: 'Hampta Pass – Triund – Bhrigu Lake & more',
    cta: 'Explore Himachal',
    href: '/treks?region=himachal',
  },
  {
    video:
      'https://media.indiantreks.in/indian%20treks/winter%20banner/uttarakhnad/From%20Klickpin.com-%20Fresh%20declutter%20motivation%20this%20season%20with%20simple%20charm%20and%20practical%20value%20for%20real%20life%20days-pin-id-1000080661007340684.mp4',
    title: 'Uttarakhand Adventure',
    subtitle: 'Chopta – Kedarkantha – Valley of Flowers & more',
    cta: 'Explore Treks',
    href: '/treks?region=uttarakhand',
  },
  {
    video:
      'https://media.indiantreks.in/indian%20treks/winter%20banner/kedarkantha/videoplayback%20(1).mp4',
    title: 'Kedarkantha Trek',
    subtitle: 'Queen of winter treks — snow forests & 360° summit sunrise',
    cta: 'Explore Trek',
    href: '/treks/kedarkantha',
  },
];

/** Phone hero explore strip — same designed creatives as desktop explore. */
export const HERO_EXPLORE_PROMOS: BannerItem[] = HOME_EXPLORE_BANNERS;

/**
 * Desktop hero slides by season.
 * Flip `HOME_HIMALAYAN_DEFAULT_SEASON` to change what the homepage hero promotes.
 */
export const HERO_DESK_SLIDES_BY_SEASON: Record<HomeHimalayanSeason, HeroDesktopSlide[]> = {
  Winter: [
    {
      id: 'kedarkantha',
      name: 'Kedarkantha Trek',
      sub: 'Queen of Winter Treks — snow forests, frozen Juda Ka Talab & a 360° summit sunrise',
      img: KEDARKANTHA_HOME_HERO,
      featureImg: KEDARKANTHA_FEATURE,
      t: 'trek',
      rating: '4.9',
      duration: '5D/4N',
      difficulty: 'Easy-Moderate',
      altitude: '12,500 ft',
      distance: '22 km',
      reviews: '10k+',
      season: 'Dec-Apr',
      group: '6-15',
    },
    {
      id: 'chopta-tungnath',
      name: 'Chopta Tungnath Chandrashila Trek',
      sub: 'Highest Shiva temple & Chandrashila summit — short winter escape in the Garhwal',
      img: photos.chopta,
      featureImg: photos.choptaSale,
      t: 'trek',
      rating: '4.7',
      duration: '3D/2N',
      difficulty: 'Easy-Moderate',
      altitude: '13,550 ft',
      distance: '28 km',
      reviews: '7k+',
      season: 'Winter',
      group: '6-15',
    },
    {
      id: 'kuari-pass',
      name: 'Kuari Pass Trek',
      sub: 'Lord Curzon Trail — snow Bugyals and panoramic views of Nanda Devi & Chaukhamba',
      img: KUARI_PASS_CARD,
      featureImg: KUARI_PASS_HOME_HERO,
      t: 'trek',
      rating: '4.8',
      duration: '6D/5N',
      difficulty: 'Easy-Moderate',
      altitude: '12,516 ft',
      distance: '32 km',
      reviews: '7k+',
      season: 'Dec-Apr',
      group: '6-15',
    },
    {
      id: 'pangarchulla',
      name: 'Pangarchulla Peak Trek',
      sub: 'Summit day above the Kuari trail — Nanda Devi, Dronagiri & Hathi–Ghoda close-ups',
      img: PANGARCHULLA_CARD,
      featureImg: PANGARCHULLA_HERO,
      t: 'trek',
      rating: '4.7',
      duration: '6D/5N',
      difficulty: 'Moderate',
      altitude: '15,069 ft',
      distance: '42 km',
      reviews: '2k+',
      season: 'Dec-Apr',
      group: '6-12',
    },
    {
      id: 'nag-tibba',
      name: 'Nag Tibba Trek',
      sub: 'Perfect weekend snow trek near Dehradun — forests, summit views & first-timer friendly',
      img: NAG_TIBBA_CARD,
      featureImg: NAG_TIBBA_HERO,
      t: 'trek',
      rating: '4.8',
      duration: '2D/1N',
      difficulty: 'Easy-Moderate',
      altitude: '9,915 ft',
      distance: '16 km',
      reviews: '8k+',
      season: 'Winter',
      group: '6-15',
    },
    {
      id: 'dayara-bugyal',
      name: 'Dayara Bugyal Trek',
      sub: 'India’s iconic alpine meadow blanketed in snow — gentle winter trail for all levels',
      img: photos.dayara,
      featureImg: photos.dayara,
      t: 'trek',
      rating: '4.7',
      duration: '5D/4N',
      difficulty: 'Easy-Moderate',
      altitude: '12,000 ft',
      distance: '20 km',
      reviews: '6k+',
      season: 'Dec-Jan',
      group: '6-15',
    },
    {
      id: 'brahmatal',
      name: 'Brahmatal Trek',
      sub: 'Frozen alpine lakes, oak forests & Trishul–Nanda Ghunti views in peak winter',
      img: BRAHMATAL_CARD,
      featureImg: BRAHMATAL_HOME_HERO,
      t: 'trek',
      rating: '4.8',
      duration: '6D/5N',
      difficulty: 'Easy-Moderate',
      altitude: '12,150 ft',
      distance: '24 km',
      reviews: '7k+',
      season: 'Dec-Mar',
      group: '6-15',
    },
  ],
  Spring: [
    {
      id: 'har-ki-dun',
      name: 'Har Ki Dun Trek',
      sub: 'Valley of Gods — spring meadows, ancient villages & Swargarohini views',
      img: photos.uttarakhand,
      featureImg: photos.uttarakhand,
      t: 'trek',
      rating: '4.8',
      duration: '7D/6N',
      difficulty: 'Moderate',
      altitude: '11,700 ft',
      distance: '35 km',
      reviews: '8k+',
      season: 'Mar-Jun',
      group: '6-15',
    },
    {
      id: 'kuari-pass',
      name: 'Kuari Pass Trek',
      sub: 'Lord Curzon Trail in spring bloom — rhododendrons, Bugyals & Nanda Devi views',
      img: KUARI_PASS_CARD,
      featureImg: KUARI_PASS_HOME_HERO,
      t: 'trek',
      rating: '4.8',
      duration: '6D/5N',
      difficulty: 'Easy-Moderate',
      altitude: '12,516 ft',
      distance: '32 km',
      reviews: '7k+',
      season: 'Mar-Apr',
      group: '6-15',
    },
    {
      id: 'chopta-tungnath',
      name: 'Chopta Tungnath Trek',
      sub: 'Rhododendron trails to Tungnath & Chandrashila — ideal spring weekend summit',
      img: photos.chopta,
      featureImg: photos.choptaSale,
      t: 'trek',
      rating: '4.7',
      duration: '3D/2N',
      difficulty: 'Easy-Moderate',
      altitude: '13,550 ft',
      distance: '28 km',
      reviews: '7k+',
      season: 'Apr-May',
      group: '6-15',
    },
    {
      id: 'nag-tibba',
      name: 'Nag Tibba Trek',
      sub: 'Weekend Himalayan summit near Mussoorie — perfect first spring trek',
      img: NAG_TIBBA_CARD,
      featureImg: photos.nagTibba,
      t: 'trek',
      rating: '4.6',
      duration: '3D/2N',
      difficulty: 'Easy',
      altitude: '9,915 ft',
      distance: '15 km',
      reviews: '9k+',
      season: 'Mar-Jun',
      group: '8-20',
    },
  ],
  Summer: [
    {
      id: 'valley-of-flowers',
      name: 'Valley of Flowers Trek',
      sub: 'UNESCO Himalayan Paradise — alpine meadows, rare flora & snow-capped vistas',
      img: photos.vof,
      featureImg: photos.vof,
      t: 'trek',
      rating: '4.8',
      duration: '6D/5N',
      difficulty: 'Moderate',
      altitude: '14,107 ft',
      distance: '38 km',
      reviews: '8k+',
      season: 'Jul-Sep',
      group: '6-15',
    },
    {
      id: 'hampta-pass',
      name: 'Hampta Pass Trek',
      sub: 'Cross-over Adventure — lush green Kullu meets barren Spiti valley',
      img: photos.hampta,
      featureImg: photos.himachal,
      t: 'trek',
      rating: '4.7',
      duration: '5D/4N',
      difficulty: 'Moderate',
      altitude: '14,100 ft',
      distance: '26 km',
      reviews: '8k+',
      season: 'Jun-Oct',
      group: '6-14',
    },
    {
      id: 'kashmir-great-lakes',
      name: 'Kashmir Great Lakes Trek',
      sub: 'Alpine lakes of Sonamarg — emerald waters & high Himalayan meadows',
      img: KASHMIR_GREAT_LAKES_CARD,
      featureImg: photos.uttarakhand,
      t: 'trek',
      rating: '4.9',
      duration: '8D/7N',
      difficulty: 'Moderate-Difficult',
      altitude: '13,800 ft',
      distance: '72 km',
      reviews: '5k+',
      season: 'Jul-Sep',
      group: '4-12',
    },
    {
      id: 'rupin-pass',
      name: 'Rupin Pass Trek',
      sub: 'Waterfall trail across Himachal–Uttarakhand — dramatic summer crossing',
      img: photos.himachal,
      featureImg: photos.himachal,
      t: 'trek',
      rating: '4.8',
      duration: '7D/6N',
      difficulty: 'Difficult',
      altitude: '15,250 ft',
      distance: '52 km',
      reviews: '4k+',
      season: 'May-Jun',
      group: '4-12',
    },
  ],
  Autumn: [
    {
      id: 'roopkund',
      name: 'Roopkund Trek',
      sub: 'Mystery Lake of Skeletons — autumn Bugyals & Trishul massif views',
      img: photos.uttarakhand,
      featureImg: photos.uttarakhand,
      t: 'trek',
      rating: '4.8',
      duration: '8D/7N',
      difficulty: 'Difficult',
      altitude: '16,470 ft',
      distance: '53 km',
      reviews: '6k+',
      season: 'Sep-Oct',
      group: '4-12',
    },
    {
      id: 'ali-bedni-bugyal',
      name: 'Ali Bedni Bugyal Trek',
      sub: 'Twin alpine meadows of Garhwal — clear autumn skies & golden grasslands',
      img: photos.uttarakhand,
      featureImg: photos.uttarakhand,
      t: 'trek',
      rating: '4.7',
      duration: '6D/5N',
      difficulty: 'Moderate',
      altitude: '11,500 ft',
      distance: '30 km',
      reviews: '3k+',
      season: 'Sep-Nov',
      group: '6-15',
    },
    {
      id: 'gulabi-kantha',
      name: 'Gulabi Kantha Trek',
      sub: 'Hidden meadow summit of Garhwal — quiet autumn trails & peak panoramas',
      img: photos.uttarakhand,
      featureImg: photos.uttarakhand,
      t: 'trek',
      rating: '4.7',
      duration: '6D/5N',
      difficulty: 'Moderate',
      altitude: '13,100 ft',
      distance: '28 km',
      reviews: '2k+',
      season: 'Sep-Nov',
      group: '6-14',
    },
    {
      id: 'har-ki-dun',
      name: 'Har Ki Dun Trek',
      sub: 'Valley of Gods in autumn gold — crisp air & Swargarohini views',
      img: photos.uttarakhand,
      featureImg: photos.uttarakhand,
      t: 'trek',
      rating: '4.8',
      duration: '7D/6N',
      difficulty: 'Moderate',
      altitude: '11,700 ft',
      distance: '35 km',
      reviews: '8k+',
      season: 'Sep-Nov',
      group: '6-15',
    },
  ],
};

/** Active homepage hero slides — follows `HOME_HIMALAYAN_DEFAULT_SEASON`. */
export function getHeroDeskSlides(): HeroDesktopSlide[] {
  return HERO_DESK_SLIDES_BY_SEASON[HOME_HIMALAYAN_DEFAULT_SEASON];
}

/** Active-season slides (Winter while `HOME_HIMALAYAN_DEFAULT_SEASON` is Winter). */
export const HERO_DESK_SLIDES = getHeroDeskSlides();

export const HERO_SEARCH_DESTINATIONS = [
  'Kedarkantha',
  'Brahmatal',
  'Kuari Pass',
  'Dayara Bugyal',
  'Chopta Tungnath',
  'Nag Tibba',
] as const;
