import type { TrekRichSection } from '@/lib/content/treks/types';

/** Pangarchulla packing guide — focused on winter summit conditions. */
export const PANGARCHULLA_PACKING_SECTION: TrekRichSection = {
  id: 'things-to-carry',
  kicker: 'Packing Guide',
  title: 'Pangarchulla Peak Packing List — Layers, Footwear & Summit Essentials',
  intro:
    'Pack for cold camps at Khullara and a long, windy summit day. Prefer layers over one bulky jacket, and keep your daypack light for the push to 15,069 ft.',
  blocks: [
    {
      type: 'h3',
      text: 'Clothing layers',
    },
    {
      type: 'ul',
      items: [
        '2–3 quick-dry base layers (avoid cotton)',
        '1 warm fleece or light insulated mid-layer',
        '1 windproof / waterproof outer shell',
        'Warm down or synthetic jacket for camp and summit wait',
        '2–3 pairs of trekking socks + 1 warm pair for night',
        'Warm gloves, woollen cap / balaclava, neck gaiter',
        'Sunglasses (UV) and high-SPF sunscreen — snow glare is strong',
      ],
    },
    {
      type: 'h3',
      text: 'Footwear & traction',
    },
    {
      type: 'ul',
      items: [
        'Broken-in waterproof trekking shoes with good grip',
        'Gaiters (helpful in soft snow)',
        'Microspikes when winter conditions require (team may advise)',
        'Camp shoes / sandals for evenings',
      ],
    },
    {
      type: 'h3',
      text: 'Daypack essentials (summit day)',
    },
    {
      type: 'ul',
      items: [
        '2–3 litres water + electrolytes',
        'High-calorie snacks',
        'Headlamp with spare batteries (early starts)',
        'Personal first aid and any prescribed medicines',
        'Trekking poles (strongly recommended for steep snow)',
        'Power bank and rain cover for your pack',
      ],
    },
    {
      type: 'p',
      text: 'After booking, IndianTreks shares a full checklist. Offloading options (if offered on your departure) should be confirmed at booking — you still carry a daypack on summit day.',
    },
  ],
};
