import {
  getBestSellerBuckets,
  getSiteInternational,
  getSiteTreks,
  getSiteYatras,
  toCatalogCard,
} from '@/lib/catalog';
import { treks } from '@/lib/data';
import { photos } from '@/lib/media';
import {
  bucketListSaleArticles,
  bucketListSaleReviews,
} from '@/lib/landing-social-content';
import type { CatalogCard } from '@/lib/catalog';
import type { TrendingLandingConfig, TrendingLandingTrip } from '@/lib/trending-landing-types';
import { tripFromCatalog } from '@/lib/trending-landing-utils';

function offBadge(card: CatalogCard): string {
  if (card.origPrice <= card.price) return 'SALE';
  const pct = Math.round((1 - card.price / card.origPrice) * 100);
  return pct > 0 ? `${pct}% OFF` : 'SALE';
}

function saleTrip(card: CatalogCard, ctaLabel?: string): TrendingLandingTrip {
  return tripFromCatalog(card, {
    badge: offBadge(card),
    ctaLabel: ctaLabel ?? (card.type === 'yatra' ? 'View Yatra' : 'View Trek'),
  });
}

const WEEKEND_IDS = new Set([
  'auli-chopta-tungnath',
  'chopta-tungnath',
  'nag-tibba',
]);

const bestsellers = getBestSellerBuckets();
const domesticDeals = [
  ...bestsellers['Top Treks'],
  ...getSiteTreks()
    .filter((c) => !bestsellers['Top Treks'].some((b) => b.id === c.id))
    .slice(0, 4),
].slice(0, 8);

const yatraDeals = getSiteYatras().slice(0, 6);
const internationalDeals = getSiteInternational().slice(0, 4);

const weekendDeals = WEEKEND_IDS.size
  ? Array.from(WEEKEND_IDS)
      .map((id) => treks.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => toCatalogCard(t!))
  : getSiteTreks()
      .filter((c) => Number(c.dur.match(/(\d+)D/)?.[1] ?? 99) <= 3)
      .slice(0, 4);

const domesticSection = {
  id: 'domestic-deals',
  kicker: 'Himalayan treks',
  title: 'Domestic Trek Deals',
  intro:
    'Handpicked Uttarakhand and Himachal treks with limited-period sale pricing — Valley of Flowers, Kedarkantha, Hampta and more.',
  trips: domesticDeals.map((c) => saleTrip(c, 'View Trek')),
};

const yatraSection = {
  id: 'yatra-deals',
  kicker: 'Sacred journeys',
  title: 'Yatra Sale Packages',
  intro:
    'Kedarnath, Do Dham and Char Dham circuits on sale — guided groups, clear inclusions and festival-season departures.',
  trips: yatraDeals.map((c) => saleTrip(c, 'View Yatra')),
};

const internationalSection = {
  id: 'international-deals',
  kicker: 'Nepal & beyond',
  title: 'International Sale Adventures',
  intro:
    'Everest Base Camp, Annapurna and Nepal backpacking — bucket-list international treks at sale fares.',
  trips: internationalDeals.map((c) => saleTrip(c, 'View Trek')),
};

const weekendSection = {
  id: 'weekend-deals',
  kicker: 'Short escapes',
  title: 'Weekend & Flash Deals',
  intro:
    'Quick 2–3 day escapes on sale — Triund, Kheerganga, Beas Kund and Chopta for a long weekend getaway.',
  trips: weekendDeals.map((c) => saleTrip(c, 'View Trek')),
};

const tripSections = [
  domesticSection,
  yatraSection,
  internationalSection,
  weekendSection,
].filter((s) => s.trips.length > 0);

export const bucketListSaleLandingConfig: TrendingLandingConfig = {
  slug: 'bucket-list-sale',
  heroImage: photos.ebc,
  heroEyebrow: 'Limited period offer · Up to 40% off',
  heroTitle: 'Bucket List Sale',
  heroLead:
    'Limited-time discounts on handpicked treks, yatras and international adventures — book your dream Himalayan trip before seats fill.',
  heroPrimaryCta: { label: 'Browse Deals', targetId: 'explore-deals' },
  heroWhatsappMsg:
    'Hi Indian Treks! I want details on the Bucket List Sale deals and current discounts.',
  saleHero: {
    titleMain: 'Bucket List',
    titleAccent: 'Sale',
    countdownEnd: '2026-09-03T23:59:59+05:30',
    features: [
      { title: 'Up to 40% Off', sub: 'Limited period deals' },
      { title: 'Handpicked Trips', sub: 'Curated by experts' },
      { title: 'Secure Booking', sub: 'Easy & safe payments' },
      { title: '24/7 Support', sub: "We're here for you" },
    ],
  },
  stickyNav: [
    { id: 'explore-deals', label: 'Deals', icon: 'tag' },
    ...tripSections.map((s) => ({
      id: s.id,
      label:
        s.id === 'domestic-deals'
          ? 'Domestic'
          : s.id === 'yatra-deals'
            ? 'Yatras'
            : s.id === 'international-deals'
              ? 'International'
              : 'Weekend Getaways',
      icon:
        s.id === 'domestic-deals'
          ? ('mountain' as const)
          : s.id === 'yatra-deals'
            ? ('landmark' as const)
            : s.id === 'international-deals'
              ? ('globe' as const)
              : ('calendar' as const),
    })),
  ],
  exploreSection: {
    id: 'explore-deals',
    kicker: 'Sale categories',
    title: 'Explore Bucket List Deals',
    intro:
      'Jump to domestic treks, sacred yatras, Nepal adventures or weekend flash deals — all with active sale pricing.',
    cards: tripSections.map((s) => ({
      id: s.id,
      title: s.title.replace(/ Deals$| Sale Packages$| Sale Adventures$/, ''),
      blurb: s.intro.slice(0, 70) + (s.intro.length > 70 ? '…' : ''),
      cover:
        s.id === 'domestic-deals'
          ? photos.kedarkantha
          : s.id === 'yatra-deals'
            ? photos.yatra
            : s.id === 'international-deals'
              ? photos.ebc
              : photos.triund,
      tripCount: s.trips.length,
    })),
  },
  whySection: {
    kicker: 'Why book the sale',
    title: 'Why Shop the Bucket List Sale',
    tagline: 'Real discounts. Same Indian Treks standards.',
    intro:
      'Sale pricing applies to curated trips only — logistics, leaders and safety stay the same as our regular catalog.',
    points: [
      'Up to 40% off on select treks & yatras',
      'Fixed group departures with experienced leaders',
      'Transparent inclusions — no hidden sale catches',
      'Book now, pay later on eligible trips',
      'Domestic, international & weekend options',
      'WhatsApp support until your departure day',
    ],
  },
  tripSections,
  reviews: {
    kicker: 'Traveller reviews',
    title: 'Booked during the sale — still loved the trip',
    intro:
      'Travellers who grabbed sale seats on Kedarkantha, Valley of Flowers, Kedarnath and Nepal treks.',
    items: bucketListSaleReviews,
  },
  articles: {
    kicker: 'From the blog',
    title: 'Plan before you book',
    items: bucketListSaleArticles,
  },
  discovery: {
    id: 'find-my-trip',
    title: 'Need Help Picking a Sale Deal?',
    intro:
      'Tell us your budget, month or trip type — we’ll match you to the best active Bucket List Sale offer.',
    whatsappPrefix: 'Hi Indian Treks! I’m browsing the Bucket List Sale and',
    options: [
      {
        id: 'domestic',
        label: 'I want a domestic trek deal',
        targetSectionId: 'domestic-deals',
        whatsappHint: 'want a domestic trek sale deal',
      },
      {
        id: 'yatra',
        label: 'I want a yatra on sale',
        targetSectionId: 'yatra-deals',
        whatsappHint: 'want a yatra package on sale',
      },
      {
        id: 'international',
        label: 'I want Nepal / international',
        targetSectionId: 'international-deals',
        whatsappHint: 'want an international trek sale deal',
      },
      {
        id: 'weekend',
        label: 'Something under a long weekend',
        targetSectionId: 'weekend-deals',
        whatsappHint: 'want a weekend flash sale trek',
      },
    ],
  },
  discoveryIcon: 'sparkles',
};
