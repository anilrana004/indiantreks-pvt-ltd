import { treks, trekDetailPath, getTrekById, type Trek } from '@/lib/data';
import { safeImage, trekPhoto } from '@/lib/safe-image';
import {
  HOME_HIMALAYAN_SEASONS,
  HOME_HIMALAYAN_SEASON_TREK_IDS,
  type HomeHimalayanSeason,
} from '@/lib/content/home-himalayan-treks';

/** Starting (Economic) price — what listing cards show. */
export function trekPrice(trek: Trek) {
  return Math.min(...trek.pricing.map((p) => p.price));
}

export function trekOriginalPrice(trek: Trek) {
  const eco = trek.pricing.find((p) => p.name === 'Economic');
  return eco?.originalPrice ?? Math.round(trekPrice(trek) * 1.25);
}

export function trekCover(trek: Trek) {
  return safeImage(trek.cardImage ?? trek.images[0], trekPhoto(trek.id));
}

export type CatalogCard = {
  id: string;
  title: string;
  loc: string;
  dur: string;
  price: number;
  origPrice: number;
  rating: string;
  rev: string;
  img: string;
  href: string;
  badge?: string;
  difficulty: string;
  region: Trek['region'];
  type: Trek['type'];
};

export function toCatalogCard(trek: Trek): CatalogCard {
  return {
    id: trek.id,
    title: trek.title,
    loc: trek.location || trek.startEndPoint,
    dur: trek.duration.includes('N') ? trek.duration.replace(/(\d+)N\/(\d+)D/, '$2D/$1N') : trek.duration,
    price: trekPrice(trek),
    origPrice: trekOriginalPrice(trek),
    rating: trek.rating,
    rev: trek.reviewCount,
    img: trekCover(trek),
    href: trekDetailPath(trek),
    badge: trek.badge,
    difficulty: trek.difficulty,
    region: trek.region,
    type: trek.type,
  };
}

export const isDomesticTrek = (t: Trek) =>
  t.type === 'trek' && t.region !== 'nepal';

export const isInternational = (t: Trek) =>
  t.region === 'nepal' || t.id === 'everest-base-camp' || t.id === 'annapurna-base-camp';

export const isExpedition = (t: Trek) =>
  t.id === 'black-peak' || /expedition/i.test(t.title) || t.badge === 'Expedition';

export const isYatra = (t: Trek) => t.type === 'yatra' && t.region !== 'nepal';

/** Mirrors https://indiantreks.in/treks/ listing */
export function getSiteTreks() {
  return treks.filter((t) => t.type === 'trek' && !isExpedition(t)).map(toCatalogCard);
}

/** Mirrors https://indiantreks.in/yatra/ */
export function getSiteYatras() {
  return treks.filter(isYatra).map(toCatalogCard);
}

/** Mirrors https://indiantreks.in/international-trips/ */
export function getSiteInternational() {
  return treks.filter(isInternational).map(toCatalogCard);
}

/** Mirrors https://indiantreks.in/expeditions/ */
export function getSiteExpeditions() {
  return treks.filter(isExpedition).map(toCatalogCard);
}

export function getTreksByRegion(region: Trek['region']) {
  return treks.filter((t) => t.region === region && t.type === 'trek').map(toCatalogCard);
}

/** Homepage Himalayan carousel buckets — curated by season, not region. */
export function getHimalayanSeasonBuckets(): Record<HomeHimalayanSeason, CatalogCard[]> {
  const buckets = {} as Record<HomeHimalayanSeason, CatalogCard[]>;
  for (const season of HOME_HIMALAYAN_SEASONS) {
    buckets[season] = HOME_HIMALAYAN_SEASON_TREK_IDS[season]
      .map((id) => getTrekById(id))
      .filter((t): t is Trek => t != null && t.type === 'trek')
      .map(toCatalogCard);
  }
  return buckets;
}

export function getBestSellerBuckets() {
  const trekCards = treks
    .filter((t) => t.type === 'trek' && t.region !== 'nepal' && !isExpedition(t))
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 8)
    .map(toCatalogCard);
  const yatraCards = treks.filter(isYatra).map(toCatalogCard);
  const internationalCards = getSiteInternational();
  return {
    'Top Treks': trekCards.slice(0, 4),
    'Yatras & Pilgrimages': yatraCards.slice(0, 4),
    'International Adventures': internationalCards.slice(0, 4),
  } as const;
}

/** Upcoming / carousel seed from live catalog (deterministic order). */
export function getUpcomingCatalog(limit = 12) {
  const domestic = treks.filter((t) => isDomesticTrek(t) && !isExpedition(t));
  const international = treks.filter(isInternational);
  const merged = [...domestic.slice(0, 8), ...international.slice(0, 4)].slice(0, limit);
  return merged.map((t, i) => {
    const card = toCatalogCard(t);
    const month = ['Aug', 'Aug', 'Sep', 'Sep', 'Oct', 'Oct'][i % 6];
    const start = 5 + (i % 20);
    return {
      ...card,
      date: `${start}-${start + t.days - 1} ${month} 2026`,
      origin: t.startEndPoint.split(' to ')[0] || t.state,
      dest: t.title.replace(/ Trek| Yatra| Tour| Expedition/gi, ''),
      type: isInternational(t) ? 'international' : 'domestic',
    };
  });
}
