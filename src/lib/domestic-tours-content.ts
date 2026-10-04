import { photos } from '@/lib/media';
import { whatsappUrl } from '@/lib/contact';

export type DomesticDestinationId =
  | 'kashmir'
  | 'ladakh'
  | 'spiti'
  | 'himachal'
  | 'uttarakhand'
  | 'meghalaya'
  | 'rajasthan'
  | 'south-india';

export type DomesticDestination = {
  id: DomesticDestinationId;
  name: string;
  shortName: string;
  blurb: string;
  tags: string[];
  cover: string;
  cta: string;
};

export type DomesticPackage = {
  id: string;
  destinationId: DomesticDestinationId;
  title: string;
  subtitle?: string;
  duration: string;
  price: number;
  tags: string[];
  badge?: string;
  cover: string;
  href: string;
  /** WhatsApp / external enquiry links */
  external?: boolean;
};

/** Destination cards — copy style aligned with JustWravel India packages, destinations from our catalog. */
export const domesticDestinations: DomesticDestination[] = [
  {
    id: 'kashmir',
    name: 'Jammu and Kashmir',
    shortName: 'Kashmir',
    blurb: 'Snowy valleys, lakes & timeless beauty',
    tags: ['Couple & Family Friendly', 'Mountains & Valleys', 'Paradise'],
    cover: photos.himachal,
    cta: 'Explore Kashmir Trips',
  },
  {
    id: 'ladakh',
    name: 'Ladakh',
    shortName: 'Ladakh',
    blurb: 'Epic roads, high passes & blue lakes',
    tags: ['High Altitude Adventure', 'Adventure Seekers', 'Road Trip'],
    cover: photos.snow,
    cta: 'Explore Ladakh Trips',
  },
  {
    id: 'spiti',
    name: 'Spiti',
    shortName: 'Spiti',
    blurb: 'Rugged Himalayas and offbeat adventures',
    tags: ['Himalayan Wilderness', 'Backpackers', 'Offbeat Escape'],
    cover: photos.snow,
    cta: 'Explore Spiti Trips',
  },
  {
    id: 'himachal',
    name: 'Himachal Pradesh',
    shortName: 'Himachal',
    blurb: 'Scenic hill towns for every traveller',
    tags: ['Mountain Retreat', 'Family & Friends', 'Nature Escape'],
    cover: photos.himachal,
    cta: 'Explore Himachal Trips',
  },
  {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    shortName: 'Uttarakhand',
    blurb: 'Temples, peaks & peaceful hill escapes',
    tags: ['Devbhoomi', 'Pilgrims & Nature Lovers', 'Spiritual & Adventure'],
    cover: photos.uttarakhand,
    cta: 'Explore Uttarakhand Trips',
  },
  {
    id: 'meghalaya',
    name: 'Meghalaya',
    shortName: 'Meghalaya',
    blurb: 'Waterfalls, caves & living root bridges',
    tags: ['Abode of Clouds', 'Waterfalls & Caves', 'Backpackers'],
    cover: photos.nepal,
    cta: 'Explore Meghalaya Trips',
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan',
    shortName: 'Rajasthan',
    blurb: 'Palaces, forts & golden desert dunes',
    tags: ['Heritage & Culture', 'Couple & Family', 'Royal Rajasthan'],
    cover: photos.rajasthan,
    cta: 'Explore Rajasthan Trips',
  },
  {
    id: 'south-india',
    name: 'South India',
    shortName: 'South India',
    blurb: 'Backwaters, hills, temples & coastal charm',
    tags: ['Kerala · Tamil Nadu · Karnataka', 'Culture & Nature', 'Custom Tours'],
    cover: photos.southIndia,
    cta: 'Explore South India Trips',
  },
];

/** Handpicked packages from Indian Treks catalog / landings only. */
export const domesticPackages: DomesticPackage[] = [
  {
    id: 'kashmir-great-lakes',
    destinationId: 'kashmir',
    title: 'Kashmir Great Lakes Trek',
    subtitle: 'Alpine lakes & Himalayan meadows',
    duration: '7N/8D',
    price: 18999,
    tags: ['Dal Lake region', 'High meadows', 'Adventure'],
    badge: 'Traveler Favourite',
    cover: photos.himachal,
    href: '/treks/kashmir-great-lakes',
  },
  {
    id: 'kedarkantha',
    destinationId: 'uttarakhand',
    title: 'Kedarkantha Trek',
    subtitle: 'Winter summit classic in Uttarakhand',
    duration: '4N/5D',
    price: 5499,
    tags: ['Snow Peaks', 'Beginner Friendly', 'Hill Escape'],
    badge: 'Popular',
    cover: photos.kedarkantha,
    href: '/treks/kedarkantha',
  },
  {
    id: 'chopta-tungnath',
    destinationId: 'uttarakhand',
    title: 'Chopta Tungnath Chandrashila Trek',
    subtitle: 'Meadows & the highest Shiva temple',
    duration: '2N/3D',
    price: 5499,
    tags: ['Chopta', 'Tungnath', 'Quick Escape'],
    cover: photos.chopta,
    href: '/treks/chopta-tungnath',
  },
  {
    id: 'hampta-pass',
    destinationId: 'himachal',
    title: 'Hampta Pass Trek',
    subtitle: 'Manali to Spiti-side landscapes',
    duration: '4N/5D',
    price: 6499,
    tags: ['Manali', 'Pass Crossing', 'Nature'],
    badge: 'Bestseller',
    cover: photos.hampta,
    href: '/treks/hampta-pass',
  },
  {
    id: 'himachal-backpacking',
    destinationId: 'himachal',
    title: 'Himachal Backpacking Trip',
    subtitle: 'Manali · Kasol · Jibhi',
    duration: '6N/7D',
    price: 18500,
    tags: ['Cafés', 'Valleys', 'Group Trip'],
    cover: photos.himachal,
    href: '/backpacking#himachal',
  },
  {
    id: 'winter-spiti',
    destinationId: 'spiti',
    title: 'Winter Spiti Trip',
    subtitle: 'High-altitude winter circuit',
    duration: '8N/9D',
    price: 24000,
    tags: ['Spiti', 'Winter', 'Offbeat'],
    badge: 'Popular',
    cover: photos.snow,
    href: '/backpacking#spiti',
  },
  {
    id: 'ladakh-bike-8d',
    destinationId: 'ladakh',
    title: 'Ladakh Bike Trip',
    subtitle: 'High passes & desert highways',
    duration: '8D/7N',
    price: 34999,
    tags: ['Road Trip', 'Khardung La', 'Adventure'],
    badge: 'Bucket List',
    cover: photos.snow,
    href: '/biking#ladakh',
  },
  {
    id: 'meghalaya-kaziranga',
    destinationId: 'meghalaya',
    title: 'Meghalaya & Kaziranga Backpacking',
    subtitle: 'Forests, falls & safari',
    duration: '6N/7D',
    price: 28000,
    tags: ['Waterfalls', 'Living Roots', 'Safari'],
    cover: photos.ebc,
    href: '/backpacking#meghalaya',
  },
  {
    id: 'kedarnath-yatra',
    destinationId: 'uttarakhand',
    title: 'Kedarnath Yatra',
    subtitle: 'Sacred Jyotirlinga pilgrimage',
    duration: '3N/4D',
    price: 10499,
    tags: ['Spiritual', 'Devbhoomi', 'Family'],
    cover: photos.kedarnath,
    href: '/yatra/kedarnath-yatra',
  },
  {
    id: 'spiti-valley-tour',
    destinationId: 'spiti',
    title: 'Spiti Valley Tour',
    subtitle: 'Manali · Kaza · Monasteries',
    duration: '8D/7N',
    price: 24999,
    tags: ['Monasteries', 'Cold Desert', 'Road Trip'],
    cover: photos.himachal,
    href: '/biking#spiti',
  },
  {
    id: 'valley-of-flowers',
    destinationId: 'uttarakhand',
    title: 'Valley of Flowers Trek',
    subtitle: 'UNESCO alpine bloom trail',
    duration: '5N/6D',
    price: 8500,
    tags: ['Nature', 'Flowers', 'Hemkund'],
    cover: photos.vof,
    href: '/treks/valley-of-flowers',
  },
  {
    id: 'triund',
    destinationId: 'himachal',
    title: 'Triund & McLeodganj Trek',
    subtitle: 'Weekend Himalayan escape',
    duration: '2N/3D',
    price: 2499,
    tags: ['Weekend', 'Dhauladhar', 'Quick Escape'],
    cover: photos.triund,
    href: '/treks/mcleodganj-trek',
  },
  {
    id: 'rajasthan-heritage',
    destinationId: 'rajasthan',
    title: 'Rajasthan Heritage Circuit',
    subtitle: 'Jaipur · Udaipur · Jodhpur',
    duration: '6N/7D',
    price: 15999,
    tags: ['Palaces', 'Forts', 'Culture'],
    badge: 'Custom Tour',
    cover: photos.rajasthan,
    href: whatsappUrl('Hi Indian Treks! I want a customised Rajasthan heritage tour (Jaipur, Udaipur, Jodhpur).'),
    external: true,
  },
  {
    id: 'jaisalmer-desert',
    destinationId: 'rajasthan',
    title: 'Jaisalmer Desert Safari',
    subtitle: 'Thar dunes, havelis & folk evenings',
    duration: '4N/5D',
    price: 12999,
    tags: ['Desert Camp', 'Safari', 'Heritage'],
    cover: photos.rajasthan,
    href: whatsappUrl('Hi Indian Treks! I want a customised Jaisalmer desert safari trip.'),
    external: true,
  },
  {
    id: 'kerala-backwaters',
    destinationId: 'south-india',
    title: 'Kerala Backwaters & Hills',
    subtitle: 'Munnar · Alleppey · Kochi',
    duration: '5N/6D',
    price: 18999,
    tags: ['Backwaters', 'Tea Hills', 'Houseboat'],
    badge: 'Popular',
    cover: photos.southIndia,
    href: whatsappUrl('Hi Indian Treks! I want a customised Kerala backwaters & hills tour.'),
    external: true,
  },
  {
    id: 'tamil-nadu-temples',
    destinationId: 'south-india',
    title: 'Tamil Nadu Temple Trail',
    subtitle: 'Madurai · Rameswaram · Kanyakumari',
    duration: '5N/6D',
    price: 16999,
    tags: ['Temples', 'Coast', 'Spiritual'],
    cover: photos.southIndia,
    href: whatsappUrl('Hi Indian Treks! I want a customised Tamil Nadu temple trail tour.'),
    external: true,
  },
];

export const domesticStats = [
  { label: 'Incredible Destinations', value: '8+', sub: 'Across India' },
  { label: 'Curated Packages', value: '50+', sub: 'Handpicked routes' },
  { label: 'Traveller Rating', value: '4.8/5', sub: 'Verified reviews' },
  { label: 'Flexible & Safe', value: '100%', sub: 'Your pace, our care' },
] as const;

export const domesticHeroTrust = [
  { title: 'Customised', sub: 'Just for you' },
  { title: 'Trusted', sub: 'by 80K+ Travellers' },
  { title: '24/7 Support', sub: "We're here" },
  { title: 'Responsible', sub: 'Eco travel' },
] as const;

export const domesticSearchWhen = [
  'Flexible dates',
  'Within 30 days',
  '1–3 months ahead',
  'Peak season (Oct–Mar)',
] as const;

export const domesticSearchWho = [
  'Solo traveller',
  'Couple',
  'Family (3–5)',
  'Group (6+)',
] as const;

export const domesticMoodCards = [
  { id: 'adventure', title: 'Adventure', blurb: 'Curated escapes for peaks, passes and trails', meta: '4.8 · Excellent' },
  { id: 'backpacking', title: 'Backpacking', blurb: 'Flexible routes with like-minded travellers', meta: 'Social · Flexible' },
  { id: 'winter', title: 'Winter Wonderland', blurb: 'Snow treks and serene winter circuits', meta: 'Serene' },
  { id: 'nature', title: 'Nature', blurb: 'Meadows, forests, lakes and quiet valleys', meta: 'Adventure' },
] as const;

export const domesticWhyPoints = [
  {
    title: 'Offbeat to Mainstream',
    body: 'From hidden Himalayan escapes to iconic destinations — travel where your heart leads.',
  },
  {
    title: 'Support Beyond the Map',
    body: 'From planning to homecoming, our team is just a call or WhatsApp away.',
  },
  {
    title: 'A Trip for Every Mood',
    body: 'Solo, friends, family or partner — pick a pace and style that fits you.',
  },
  {
    title: 'Crafted with Care',
    body: 'Every itinerary is thoughtfully planned around your interests, dates and budget.',
  },
] as const;

export const domesticFaqs = [
  {
    q: 'Which destinations can I explore with Indian Treks domestic packages?',
    a: 'You can explore destinations across India from our catalog — including Kashmir, Ladakh, Spiti, Himachal Pradesh, Uttarakhand, Meghalaya, Rajasthan and South India — across treks, backpacking trips, bike expeditions, heritage tours and sacred yatras.',
  },
  {
    q: 'How can I customise my trip itinerary before booking?',
    a: 'Speak with our travel experts about preferred destinations, dates, budget and stays. We can tailor the itinerary to your plan before you confirm the booking.',
  },
  {
    q: 'Will I receive a detailed itinerary before making the payment?',
    a: 'Yes. You can review the proposed itinerary, inclusions, accommodation, activities and transport details before confirming your booking.',
  },
  {
    q: 'Is it possible to cover multiple destinations in one trip?',
    a: 'Yes — depending on duration and route. Our team can help plan a multi-destination trip while keeping travel days practical and comfortable.',
  },
  {
    q: 'Are flights included, or do I need to book them separately?',
    a: 'Flight inclusions depend on the package. If flights are not included, you may need to book them separately. Check the package details or ask our team before booking.',
  },
  {
    q: 'How can your travel experts help me choose the right destination?',
    a: 'We shortlist destinations based on your budget, dates, trip length, fitness and the kind of experience you want — trek, backpacking, bike or pilgrimage — and explain inclusions clearly before you book.',
  },
] as const;

export const domesticStickyNav = [
  { id: 'explore-india', label: 'Explore' },
  { id: 'handpicked', label: 'Favourites' },
  { id: 'by-budget', label: 'Budget' },
  { id: 'why-domestic', label: 'Why us' },
] as const;

export function packagesForDestination(id: DomesticDestinationId): DomesticPackage[] {
  return domesticPackages.filter((p) => p.destinationId === id);
}

export function packagesByBudget(max: number, min = 0): DomesticPackage[] {
  return domesticPackages.filter((p) => p.price >= min && p.price <= max);
}

export const domesticFeaturedMonth = {
  name: 'Kashmir',
  title: 'Destination of the Month',
  blurb: "Experience Kashmir's valleys, lakes and alpine trails — crafted around your pace.",
  cover: photos.himachal,
  ctaLabel: 'Get a Customised Kashmir Quote',
  whatsappMsg:
    'Hi Indian Treks! I want a customised Kashmir domestic tour quote.',
} as const;
