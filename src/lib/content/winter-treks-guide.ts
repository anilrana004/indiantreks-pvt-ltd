/**
 * Best Winter Treks in India 2026–27 — editorial copy for /treks?season=winter.
 * Trek cards use WINTER_TOP_TREK_IDS; guide sections hold the full article detail.
 */

export const WINTER_TREKS_SEO = {
  title: 'Best Winter Treks in India 2026–27 | Snow Trekking Guide – IndianTreks',
  description:
    'Explore the best winter treks in India for 2026–27. Discover Kedarkantha, Chopta Tungnath Chandrashila, Kuari Pass, Pangarchulla, Nag Tibba, Dayara Bugyal and Brahmatal with IndianTreks.',
  primaryKeyword: 'Best Winter Treks in India',
} as const;

/** Editorial winter shortlist shown on curated + season=winter filter. */
export const WINTER_TOP_TREK_IDS = [
  'kedarkantha',
  'chopta-tungnath',
  'kuari-pass',
  'pangarchulla',
  'nag-tibba',
  'dayara-bugyal',
  'brahmatal',
] as const;

export type WinterFilterTrek = {
  id: (typeof WINTER_TOP_TREK_IDS)[number];
  label: string;
  href: string;
};

/** Chips in the trek filter sidebar — Best Winter Treks 2026–27. */
export const WINTER_FILTER_TREKS: WinterFilterTrek[] = [
  { id: 'kedarkantha', label: 'Kedarkantha', href: '/treks/kedarkantha' },
  { id: 'chopta-tungnath', label: 'Chopta Tungnath Chandrashila', href: '/treks/chopta-tungnath' },
  { id: 'kuari-pass', label: 'Kuari Pass', href: '/treks/kuari-pass' },
  { id: 'pangarchulla', label: 'Pangarchulla Peak', href: '/treks/pangarchulla' },
  { id: 'nag-tibba', label: 'Nag Tibba', href: '/treks/nag-tibba' },
  { id: 'dayara-bugyal', label: 'Dayara Bugyal', href: '/treks/dayara-bugyal' },
  { id: 'brahmatal', label: 'Brahmatal', href: '/treks/brahmatal' },
];

/** Rich intro shown in the winter curated header (same green box as other trek sections). */
export const WINTER_SECTION_INTRO = {
  kicker: 'Winter Trekking Guide · 2026–27',
  paragraphs: [
    'Winter transforms the Himalayas into a completely different world. Pine forests turn quieter, high-altitude meadows disappear beneath layers of snow, frozen lakes reflect snow-covered peaks, and every trail becomes an adventure.',
    'For trekkers, winter is one of the most rewarding seasons to explore the Indian Himalayas — whether you are planning your first snow trek, a weekend escape, or a challenging high-altitude adventure.',
    'From the legendary Kedarkantha Trek and Chopta–Tungnath–Chandrashila to Kuari Pass, Pangarchulla Peak, Nag Tibba, Dayara Bugyal and Brahmatal, winter trekking offers experiences for every kind of mountain lover.',
    'At IndianTreks, we believe the mountains are not just destinations. They are places where you challenge yourself, slow down, connect with nature, and return with stories worth remembering.',
  ],
  whyTitle: 'Why go for a winter trek?',
  whyPoints: [
    'Experience the Himalayas in snow — white meadows, frozen streams and snow-covered peaks.',
    'Peaceful trails — fewer crowds, quieter campsites and clearer mountain silence.',
    'Real adventure — snow walking, cold camping and rewarding winter summits.',
    'Great for first-timers — several routes suit beginners with proper prep and an experienced team.',
  ],
  seasonNote:
    'Best snow window for many Uttarakhand treks is generally December to February; the wider winter season runs about November–March depending on snowfall and trail conditions.',
} as const;

export const WINTER_FILTER_VIEW = {
  heading: 'Best Winter Treks in India',
  sectionTitle: 'Best Winter Treks in India 2026–27',
  info: WINTER_SECTION_INTRO.paragraphs[0],
} as const;

export const WINTER_CURATED_SECTION = {
  id: 'winter',
  title: 'Best Winter Treks in India 2026–27',
  info: WINTER_SECTION_INTRO.paragraphs.slice(0, 2).join(' '),
  href: '/treks?season=winter',
} as const;

export type WinterGuideBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'faq'; items: { q: string; a: string }[] };

export type WinterGuideSection = {
  id: string;
  title: string;
  blocks: WinterGuideBlock[];
};

export const WINTER_GUIDE_INTRO = {
  kicker: 'Winter Trekking Guide · 2026–27',
  title: 'Best Winter Treks in India 2026–27',
  lead:
    'Winter transforms the Himalayas into a completely different world. Pine forests turn quieter, high-altitude meadows disappear beneath layers of snow, frozen lakes reflect snow-covered peaks, and every trail becomes an adventure.',
  body: [
    'For trekkers, winter is one of the most rewarding seasons to explore the Indian Himalayas — whether you are planning your first snow trek, a weekend escape, or a challenging high-altitude adventure.',
    'At IndianTreks, we believe the mountains are not just destinations. They are places where you challenge yourself, slow down, connect with nature, and return with stories worth remembering.',
  ],
} as const;

/** Per-trek winter copy — paired with trek cards on the winter landing. */
export type WinterTrekProfile = {
  id: (typeof WINTER_TOP_TREK_IDS)[number];
  eyebrow: string;
  headline: string;
  summary: string;
  facts: { label: string; value: string }[];
  whyChoose?: string;
};

export const WINTER_TREK_PROFILES: WinterTrekProfile[] = [
  {
    id: 'kedarkantha',
    eyebrow: 'Classic winter snow trek',
    headline: 'Kedarkantha Trek — The Classic Winter Snow Trek',
    summary:
      'One of India’s most popular winter treks and a fantastic introduction to Himalayan snow. The trail passes through pine and oak forests, open snowfields and mountain landscapes before a rewarding summit with expansive Himalayan views.',
    facts: [
      { label: 'Location', value: 'Sankri, Uttarakhand' },
      { label: 'Altitude', value: 'Approx. 12,500 ft' },
      { label: 'Duration', value: '5 Days / 4 Nights' },
      { label: 'Difficulty', value: 'Easy to Moderate' },
      { label: 'Best Season', value: 'December to March' },
      { label: 'Distance', value: 'Approx. 20 km' },
      { label: 'Ideal For', value: 'Beginners, first-time snow trekkers, groups & solo' },
    ],
    whyChoose: 'If this is your first Himalayan winter trek, Kedarkantha is one of the best places to begin.',
  },
  {
    id: 'chopta-tungnath',
    eyebrow: 'Temple & summit',
    headline: 'Chopta Tungnath Chandrashila Trek — Highest Shiva Temple & Summit Views',
    summary:
      'A short Garhwal classic: rhododendron and oak forests to Tungnath — the world’s highest Shiva temple — then a push to Chandrashila for a wide Himalayan sunrise. Ideal when you want winter scenery without a long expedition.',
    facts: [
      { label: 'Location', value: 'Chopta, Uttarakhand' },
      { label: 'Altitude', value: 'Approx. 13,550 ft (Chandrashila)' },
      { label: 'Duration', value: '3 Days / 2 Nights' },
      { label: 'Difficulty', value: 'Easy to Moderate' },
      { label: 'Best Season', value: 'December to March' },
      { label: 'Ideal For', value: 'Weekend travellers, beginners & spiritual trekkers' },
    ],
    whyChoose: 'Temple trail plus a true summit viewpoint in a compact winter itinerary.',
  },
  {
    id: 'kuari-pass',
    eyebrow: 'Lord Curzon Trail',
    headline: 'Kuari Pass Trek — The Lord Curzon Trail',
    summary:
      'Forests, alpine meadows and mountain ridges with spectacular Greater Himalayan views. Winter snow transforms the landscape, with peaks including Nanda Devi, Dronagiri, Chaukhamba and Hathi Ghoda.',
    facts: [
      { label: 'Location', value: 'Chamoli, Uttarakhand' },
      { label: 'Altitude', value: 'Approx. 12,516 ft' },
      { label: 'Duration', value: '6 Days / 5 Nights' },
      { label: 'Difficulty', value: 'Easy to Moderate' },
      { label: 'Distance', value: 'Approx. 32 km' },
      { label: 'Best Season', value: 'December to April' },
      { label: 'Pickup', value: 'Rishikesh to Rishikesh' },
      { label: 'Ideal For', value: 'Fit beginners, experienced trekkers & photographers' },
    ],
    whyChoose: 'Choose this trek if panoramic Himalayan views are high on your list.',
  },
  {
    id: 'pangarchulla',
    eyebrow: 'Peak climb',
    headline: 'Pangarchulla Peak Trek — Summit Above the Kuari Trail',
    summary:
      'A rewarding Garhwal peak day from the Kuari Pass approach — steep but non-technical near the top, with close views of Nanda Devi, Dronagiri and Hathi–Ghoda from Pangarchulla summit.',
    facts: [
      { label: 'Location', value: 'Chamoli, Uttarakhand' },
      { label: 'Altitude', value: 'Approx. 15,069 ft' },
      { label: 'Duration', value: '6 Days / 5 Nights' },
      { label: 'Difficulty', value: 'Moderate' },
      { label: 'Distance', value: 'Approx. 42 km' },
      { label: 'Best Season', value: 'December to April' },
      { label: 'Ideal For', value: 'Fit trekkers wanting a true peak after easier routes' },
    ],
    whyChoose: 'For trekkers ready to step up from a pass trek to a Himalayan summit.',
  },
  {
    id: 'nag-tibba',
    eyebrow: 'Weekend snow trek',
    headline: 'Nag Tibba Trek — A Perfect Weekend Snow Trek',
    summary:
      'One of the best short treks near Dehradun and Mussoorie — popular with beginners, college groups, families and weekend travellers. Forest trails, mountain views and snow when conditions allow.',
    facts: [
      { label: 'Location', value: 'Tehri Garhwal, Uttarakhand' },
      { label: 'Altitude', value: 'Approx. 9,915 ft' },
      { label: 'Duration', value: '2 Days / 1 Night or 3 Days' },
      { label: 'Difficulty', value: 'Easy to Moderate' },
      { label: 'Best Season', value: 'Winter months' },
      { label: 'Ideal For', value: 'Beginners, weekend travellers & first-timers' },
    ],
    whyChoose: 'A quick Himalayan escape without a long leave from work or college.',
  },
  {
    id: 'dayara-bugyal',
    eyebrow: 'Snow meadows',
    headline: 'Dayara Bugyal Trek — Snow-Covered Alpine Meadows',
    summary:
      'Expansive alpine meadows that turn into vast snowfields in winter — one of Uttarakhand’s most beautiful winter landscapes, with forests and open meadow sections to enjoy at an approachable pace.',
    facts: [
      { label: 'Location', value: 'Uttarkashi, Uttarakhand' },
      { label: 'Altitude', value: 'Approx. 12,000 ft' },
      { label: 'Duration', value: '4–5 Days' },
      { label: 'Difficulty', value: 'Easy to Moderate' },
      { label: 'Best Season', value: 'December to March' },
      { label: 'Ideal For', value: 'Beginners, families, groups & snow lovers' },
    ],
    whyChoose: 'Beautiful snowy landscapes without an extremely demanding trek.',
  },
  {
    id: 'brahmatal',
    eyebrow: 'Frozen lake & views',
    headline: 'Brahmatal Trek — Frozen Lake & Himalayan Views',
    summary:
      'Snow-covered forests, alpine landscapes and a high-altitude lake. Dense forests and open ridges lead to Brahmatal and Brahmatal Pass, with views of Trishul and Nanda Ghunti on clear days.',
    facts: [
      { label: 'Location', value: 'Chamoli, Uttarakhand' },
      { label: 'Altitude', value: 'Approx. 12,200 ft' },
      { label: 'Duration', value: '6 Days / 5 Nights' },
      { label: 'Difficulty', value: 'Moderate' },
      { label: 'Best Season', value: 'December to March' },
      { label: 'Ideal For', value: 'Snow lovers, beginners with fitness & experienced trekkers' },
    ],
    whyChoose:
      'For a classic Himalayan winter experience with beautiful mountain views and snow-covered trails.',
  },
];

export const WINTER_OFFBEAT_NOTE =
  'Also worth knowing: Mukta Top is an offbeat Uttarakhand winter option (~11,840 ft, ~6 days). The Chadar Trek in Ladakh is a frozen-river adventure — challenging, ice-dependent, and suited only to prepared, experienced trekkers with professional leadership.';

export const WINTER_GUIDE_SECTIONS: WinterGuideSection[] = [
  {
    id: 'why-winter',
    title: 'Why Go for a Winter Trek in India?',
    blocks: [
      {
        type: 'p',
        text: 'A winter trek is more than walking through snow. It is an opportunity to experience the Himalayas in their quietest and most dramatic form.',
      },
      {
        type: 'ul',
        items: [
          'Experience the Himalayas in snow — snow-covered trails, frozen streams, white meadows and Himalayan peaks create landscapes that feel completely different from the summer trekking season.',
          'Peaceful mountain trails — winter generally brings a quieter atmosphere. Fewer crowds mean more time to enjoy the forests, campsites, sunrise views and mountain silence.',
          'Perfect for adventure seekers — walking through snow, camping in freezing temperatures and reaching a summit covered in winter landscapes makes every kilometre feel rewarding.',
          'Unforgettable campsites — finish a day of trekking, reach your campsite, have a hot cup of chai and watch the sky fill with stars. Winter camping creates some of the most memorable Himalayan experiences.',
          'A great challenge for first-time trekkers — several Indian winter treks are suitable for beginners when undertaken with proper preparation, equipment and an experienced trekking team.',
        ],
      },
    ],
  },
  {
    id: 'which-trek',
    title: 'Which Winter Trek Is Best for You?',
    blocks: [
      {
        type: 'p',
        text: 'Choosing the right trek depends on your fitness, previous trekking experience and the kind of landscape you want to experience.',
      },
      {
        type: 'table',
        headers: ['Trek', 'Difficulty', 'Best For'],
        rows: [
          ['Kedarkantha', 'Easy–Moderate', 'First-time snow trekkers'],
          ['Chopta Tungnath Chandrashila', 'Easy–Moderate', 'Temple trail & weekend summit'],
          ['Nag Tibba', 'Easy–Moderate', 'Weekend & beginner trips'],
          ['Dayara Bugyal', 'Easy–Moderate', 'Beginners & families'],
          ['Brahmatal', 'Moderate', 'Snow & mountain views'],
          ['Kuari Pass', 'Easy–Moderate', 'Himalayan panoramas'],
          ['Pangarchulla Peak', 'Moderate', 'Peak climb & big views'],
        ],
      },
    ],
  },
  {
    id: 'packing',
    title: 'What to Pack for a Winter Trek',
    blocks: [
      {
        type: 'p',
        text: 'A proper packing list is essential for winter trekking. Temperatures can drop significantly after sunset, particularly at higher camps.',
      },
      {
        type: 'h3',
        text: 'Essential Winter Trek Gear',
      },
      {
        type: 'ul',
        items: [
          'Thermal inner layers',
          'Fleece jacket',
          'Down or insulated jacket',
          'Waterproof/windproof outer layer',
          'Warm trekking trousers',
          'Woollen socks',
          'Waterproof trekking shoes with good grip',
          'Warm gloves',
          'Beanie or woollen cap',
          'Sunglasses',
          'Sunscreen and lip balm',
          'Headlamp',
          'Trekking poles',
          'Personal first-aid kit',
          'Reusable water bottle',
          'Energy snacks',
          'Personal medicines',
          'Small backpack and rain cover',
        ],
      },
      {
        type: 'p',
        text: 'Pro Tip: Layering is better than wearing one extremely heavy jacket. You can add or remove layers according to your activity level and temperature.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Winter Trekking Safety Tips',
    blocks: [
      {
        type: 'p',
        text: 'Winter trekking is incredibly rewarding, but snow and cold weather require additional preparation.',
      },
      {
        type: 'ul',
        items: [
          'Check weather conditions — mountain weather can change quickly. Always check the latest weather and trail conditions before departure.',
          'Choose the right trek — don’t select a difficult trek simply because it looks beautiful online. Match the trek with your fitness and experience.',
          'Trek with an experienced team — a professional team helps with route navigation, weather changes, campsites, emergencies and high-altitude challenges.',
          'Start early — winter days are shorter. Starting early gives more daylight and a safer arrival at camp.',
          'Stay hydrated — cold weather can reduce your sense of thirst, but your body still needs regular hydration.',
          'Protect yourself from the sun — snow reflects sunlight strongly. Sunglasses and sunscreen are essential even when it is very cold.',
          'Don’t ignore your body — headache, unusual fatigue, dizziness, nausea or breathing difficulties at altitude should never be ignored. Inform your trek leader immediately.',
        ],
      },
    ],
  },
  {
    id: 'best-time',
    title: 'Best Time for Winter Trekking in India',
    blocks: [
      {
        type: 'p',
        text: 'The winter trekking season generally begins around November or December and continues into March, depending on the trek, snowfall, weather and trail conditions.',
      },
      {
        type: 'p',
        text: 'For the best snow experience, December to February is generally the core winter period for many Uttarakhand snow treks.',
      },
      {
        type: 'p',
        text: 'However, snowfall is unpredictable. Conditions can vary from one season to another, so trek dates should always be planned according to current mountain conditions rather than relying only on historical snowfall patterns.',
      },
    ],
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    blocks: [
      {
        type: 'faq',
        items: [
          {
            q: 'Which is the best winter trek in India for beginners?',
            a: 'Kedarkantha, Nag Tibba and Dayara Bugyal are excellent starting points for beginners. Your choice should depend on your fitness, available time and desired snow experience.',
          },
          {
            q: 'Which is the best snow trek in Uttarakhand?',
            a: 'Kedarkantha, Brahmatal, Dayara Bugyal and Kuari Pass are among the most popular choices for winter snow trekking in Uttarakhand.',
          },
          {
            q: 'When does the winter trekking season start?',
            a: 'The winter trekking season generally begins around November–December and continues through March, depending on the destination and weather conditions.',
          },
          {
            q: 'Which winter trek is best for first-time trekkers?',
            a: 'For a first snow trek, Kedarkantha is one of the most popular choices. Nag Tibba is also a good option if you want a shorter introduction to Himalayan trekking.',
          },
          {
            q: 'Is winter trekking safe?',
            a: 'Winter trekking can be safe when you choose a suitable route, carry the correct equipment, follow weather advisories and trek with an experienced professional team.',
          },
          {
            q: 'What should I wear on a winter trek?',
            a: 'Use a layering system consisting of thermal innerwear, fleece, an insulated jacket and a waterproof/windproof outer layer. Warm socks, gloves, a cap and suitable trekking shoes are also essential.',
          },
          {
            q: 'Can I do a winter trek if I have never trekked before?',
            a: 'Yes. Several Himalayan winter treks are suitable for beginners. However, you should prepare with regular walking, cardio and strength training before the trek.',
          },
          {
            q: 'How much fitness is required for a winter trek?',
            a: 'Fitness requirements depend on the trek. As a basic preparation, build your stamina through regular walking, stair climbing, jogging or cycling and include strength exercises for your legs and core.',
          },
        ],
      },
    ],
  },
];
