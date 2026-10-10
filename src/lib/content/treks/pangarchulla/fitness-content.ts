import type { TrekRichSection } from '@/lib/content/treks/types';

/** Fitness guidance — Pangarchulla Peak. */
export const PANGARCHULLA_FITNESS_SECTION: TrekRichSection = {
  id: 'fitness',
  kicker: 'Get Ready',
  title: 'Fitness Required for Pangarchulla Peak',
  intro:
    'Summit day can run 8–9 hours with steep gain above Khullara. Treat preparation seriously — especially for winter snow.',
  blocks: [
    {
      type: 'ul',
      items: [
        'Walk or jog 45–60 minutes, 4–5 days a week, for at least 4–6 weeks.',
        'Add stair climbing or incline treadmill sessions twice a week.',
        'Practice with a daypack (4–6 kg) on longer weekend walks.',
        'Include basic strength: squats, lunges, planks and calf raises.',
        'If this is your first trek above 12,000 ft, complete an easier trek first when possible.',
      ],
    },
    {
      type: 'p',
      text: 'If you have cardiac, respiratory or recent injury concerns, get medical clearance before booking a 15,000-ft summit trek.',
    },
  ],
};
