import type { TrekRichSection } from '@/lib/content/treks/types';

/** Safety precautions — Pangarchulla Peak Trek. */
export const PANGARCHULLA_SAFETY_SECTION: TrekRichSection = {
  id: 'safety',
  kicker: 'Stay Safe',
  title: 'Safety Precautions for the Pangarchulla Peak Trek',
  intro:
    'Pangarchulla reaches approximately 15,069 ft with a steep summit day. Altitude, weather and winter snow require clear habits on the trail.',
  blocks: [
    {
      type: 'ul',
      items: [
        'Arrive fit — summit day is long; train with stairs, incline walks and light cardio for 4–6 weeks.',
        'Respect altitude — hydrate, avoid alcohol, and tell your trek leader immediately if you feel headache, nausea or unusual fatigue.',
        'Stay with the group on the summit push; weather and snow can reduce visibility quickly.',
        'Use traction (microspikes) when the team advises — icy or hard snow near the ridge is common in winter.',
        'Carry personal medicines and disclose medical conditions before the trek.',
        'Turn-around decisions belong to the trek leader when wind, avalanche risk or exhaustion make the summit unsafe.',
      ],
    },
    {
      type: 'h3',
      text: 'How Indian Treks supports you',
    },
    {
      type: 'ul',
      items: [
        'Certified trek leadership and support staff familiar with the Kuari / Pangarchulla approach.',
        'First-aid kit and oxygen support carried on the trail.',
        'Winter-aware briefing covering layering, snow walking and summit timing.',
        'Evacuation planning toward Joshimath / roadhead if a trekker cannot continue safely.',
      ],
    },
  ],
};
