import { toCatalogCard } from '@/lib/catalog';
import { treks } from '@/lib/data';
import { photos } from '@/lib/media';
import {
  weekendTripsArticles,
  weekendTripsReviews,
} from '@/lib/landing-social-content';
import type { GroupJourneyPremiumHeroConfig } from '@/lib/group-journey-hero-types';
import type { TrendingLandingConfig } from '@/lib/trending-landing-types';
import { tripFromCatalog } from '@/lib/trending-landing-utils';

/**
 * Curated weekend shortlist — order is intentional for the landing page.
 * 1) Auli + Chopta Tungnath Chandrashila
 * 2) Chopta Tungnath Chandrashila
 * 3) Nag Tibba
 */
const WEEKEND_IDS = [
  'auli-chopta-tungnath',
  'chopta-tungnath',
  'nag-tibba',
] as const;

function weekendCards() {
  const byId = new Map(treks.map((t) => [t.id, t]));
  return WEEKEND_IDS.map((id) => byId.get(id))
    .filter(Boolean)
    .map((t) => toCatalogCard(t!));
}

const all = weekendCards();

const featuredSection = {
  id: 'featured-weekends',
  kicker: 'Long weekend ready',
  title: 'Weekend Treks',
  intro:
    'Three short Garhwal escapes — Auli with Chopta–Tungnath–Chandrashila, the classic Chopta summit trail, and Nag Tibba near Dehradun.',
  trips: all.map((c) => tripFromCatalog(c, { ctaLabel: 'View Trek' })),
};

const tripSections = [featuredSection];

export const weekendTripsLandingConfig: TrendingLandingConfig = {
  slug: 'weekend-trips',
  heroImage: photos.weekendHero,
  heroEyebrow: '2–4 days · Easy trails',
  heroTitle: 'Weekend Trips',
  heroLead:
    'Short Himalayan escapes you can fit into a long weekend — Auli–Chopta, Tungnath–Chandrashila and Nag Tibba with Indian Treks.',
  heroPrimaryCta: { label: 'Browse Weekends', targetId: 'explore-weekends' },
  heroWhatsappMsg: 'Hi Indian Treks! I want help choosing a weekend trek.',
  journeyHero: {
    badgePrimary: '2–4 days',
    badgeSecondary: 'Easy trails',
    badgeIcon: 'calendar',
    titleLine1: 'Weekend',
    titleLine2: 'Trips',
    leadBefore: 'Short Himalayan escapes you can fit into a long weekend — ',
    leadHighlight: 'Auli–Chopta, Tungnath–Chandrashila and Nag Tibba',
    leadAfter: ' with Indian Treks.',
    primaryCtaLabel: 'Browse Weekends',
    primaryCtaTargetId: 'explore-weekends',
    whatsappMsg: 'Hi Indian Treks! I want help choosing a weekend trek.',
    features: [
      { title: 'Quick Escapes', sub: 'Fit a long weekend from Delhi' },
      { title: 'Easy Trails', sub: 'First-timer friendly routes' },
      { title: 'Fixed Groups', sub: 'Confirmed departures with leaders' },
      { title: 'Smooth Logistics', sub: 'Pickups, stays & briefings handled' },
    ],
  } satisfies GroupJourneyPremiumHeroConfig,
  stickyNav: [
    { id: 'explore-weekends', label: 'Weekends', icon: 'mountain' },
    { id: 'featured-weekends', label: 'Treks', icon: 'mountain' },
  ],
  exploreSection: {
    id: 'explore-weekends',
    kicker: 'Short escapes',
    title: 'Our Weekend Treks',
    intro:
      'Three curated short group treks with confirmed dates, clear difficulty and Delhi-friendly logistics.',
    cards: [
      {
        id: 'featured-weekends',
        title: 'Weekend Treks',
        blurb: 'Auli–Chopta, Tungnath–Chandrashila and Nag Tibba for a long weekend.',
        cover: photos.chopta,
        tripCount: all.length,
      },
    ],
  },
  whySection: {
    kicker: 'Why weekend with us',
    title: 'Why Book a Weekend Trek',
    tagline: 'Big mountain energy. Small time window.',
    intro:
      'Weekend trips are paced for first-timers and busy travellers — short days, experienced leaders and smooth pickups.',
    points: [
      '2–4 day itineraries that fit a long weekend',
      'Easy and easy-to-moderate graded trails',
      'Fixed group departures with experienced leaders',
      'Clear inclusions, packing lists and briefings',
      'Ideal for first-timers and office groups',
      'WhatsApp support until departure day',
    ],
  },
  tripSections,
  reviews: {
    kicker: 'Traveller reviews',
    title: 'Weekend stories from the trail',
    intro: 'Feedback from short batches on Nag Tibba, Chopta and Auli–Chopta weekends.',
    items: weekendTripsReviews,
  },
  articles: {
    kicker: 'From the blog',
    title: 'Prepare for a short escape',
    items: weekendTripsArticles,
  },
  discovery: {
    id: 'find-my-trip',
    title: 'Which Weekend Fits You?',
    intro: 'Tell us your preferred vibe — we’ll suggest the right short trek.',
    whatsappPrefix: 'Hi Indian Treks! I’m looking for a weekend trip and',
    options: [
      {
        id: 'auli-chopta',
        label: 'Auli + Chopta / Chandrashila',
        targetSectionId: 'featured-weekends',
        whatsappHint: 'want the Auli Chopta Tungnath Chandrashila weekend trek',
      },
      {
        id: 'chopta',
        label: 'Classic Chopta Tungnath',
        targetSectionId: 'featured-weekends',
        whatsappHint: 'want the Chopta Tungnath Chandrashila weekend trek',
      },
      {
        id: 'nag-tibba',
        label: 'Short Nag Tibba weekend',
        targetSectionId: 'featured-weekends',
        whatsappHint: 'want the Nag Tibba weekend trek',
      },
      {
        id: 'first',
        label: 'This is my first trek',
        targetSectionId: 'featured-weekends',
        whatsappHint: 'want a beginner-friendly weekend trek',
      },
    ],
  },
  discoveryIcon: 'sparkles',
};
