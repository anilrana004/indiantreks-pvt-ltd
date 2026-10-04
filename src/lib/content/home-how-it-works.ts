import { ensureCldAuto } from '@/lib/cloudinary';

export type HowItWorksStep = {
  id: string;
  n: string;
  title: readonly [string, string];
  desc: string;
  img: string;
  icon: string;
  href: string;
};

/** Step 01 media — planning trek on a Himalayan ridge (Choose Your Trip). */
const CHOOSE_YOUR_TRIP_IMG = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791145430/WhatsApp_Image_2026-09-30_at_15.13.30_2.jpg',
);

/** Step 02 media — booking confirmed with balance due (Book & Pay Later). */
const BOOK_PAY_LATER_IMG = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791145586/WhatsApp_Image_2026-09-30_at_15.13.47.jpg',
);

/** Step 03 media — group on trail toward Himalayan peaks (Go on Adventure). */
const GO_ON_ADVENTURE_IMG = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791145688/WhatsApp_Image_2026-09-30_at_15.13.58.jpg',
);

export const HOW_IT_WORKS_SECTION = {
  kicker: 'How It Works',
  titleLead: '3 Steps',
  titleRest: 'to Your Next Adventure',
  lede: 'From choosing to booking to exploring – we make it simple.',
  linkLabel: 'Explore Treks',
} as const;

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: 'choose-trip',
    n: '01',
    title: ['Choose', 'Your Trip'],
    desc: 'Discover handpicked Himalayan treks, peak expeditions and adventure journeys. Choose your destination, difficulty level and departure date to find the right trek for you.',
    img: CHOOSE_YOUR_TRIP_IMG,
    icon: 'fa-solid fa-compass',
    href: '/treks',
  },
  {
    id: 'book-pay-later',
    n: '02',
    title: ['Book', '& Pay Later'],
    desc: 'Secure your trek with a simple and transparent booking process. Flexible payment options make it easy to reserve your spot and prepare for your Himalayan adventure.',
    img: BOOK_PAY_LATER_IMG,
    icon: 'fa-solid fa-wallet',
    href: '/treks',
  },
  {
    id: 'go-adventure',
    n: '03',
    title: ['Go on', 'Adventure'],
    desc: 'Trek with experienced local guides and a dedicated ground team. From the trailhead to the summit, we take care of the essentials while you focus on the mountains.',
    img: GO_ON_ADVENTURE_IMG,
    icon: 'fa-solid fa-person-hiking',
    href: '/treks',
  },
];
