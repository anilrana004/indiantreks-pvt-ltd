import type { ItineraryDay } from '@/lib/content/treks/types';

/** Day-wise itinerary for Pangarchulla Peak — shown in the trek detail accordion. */
export const PANGARCHULLA_ITINERARY: ItineraryDay[] = [
  {
    day: 1,
    title: 'Rishikesh to Joshimath (Drive)',
    description: [
      'Your Pangarchulla Peak adventure begins with a scenic drive from Rishikesh along the Alaknanda corridor toward Joshimath — the gateway and base for the Kuari / Pangarchulla approach.',
      'The route passes Devprayag, Srinagar (Garhwal), Rudraprayag, Karnaprayag and Nandaprayag before you reach Joshimath. Check in, rest after the long mountain drive, and join the evening trek briefing.',
    ].join('\n\n'),
    meals: 'Dinner',
    altitude: '6,150 ft',
    distance: 'Approx. 280 km drive',
    duration: '9–10 hrs',
    overnight: 'Joshimath Hotel',
    pickup: 'Rishikesh Natraj Chowk',
    departure: 'Around 6:00–7:00 AM',
  },
  {
    day: 2,
    title: 'Joshimath to Dhak / Tugasi & Trek to Gulling',
    description: [
      'After breakfast, a short drive takes you to the trailhead near Dhak / Tugasi. The trek begins with a gradual forest climb toward Gulling camp.',
      'This is an important acclimatization day — keep a steady pace, drink water often, and settle in at Gulling with views opening toward the Garhwal skyline when the weather is clear.',
    ].join('\n\n'),
    meals: 'Breakfast, Lunch, Dinner',
    altitude: '9,200 ft',
    distance: 'Approx. 6 km trek',
    duration: '4–5 hrs',
    difficulty: 'Easy to Moderate',
    overnight: 'Gulling Campsite',
  },
  {
    day: 3,
    title: 'Gulling to Khullara (Trek)',
    description: [
      'Ascend through oak and rhododendron forest into alpine meadows toward Khullara — the high camp for both Kuari Pass and the Pangarchulla summit push.',
      'In winter, snow often lingers on forest and meadow sections. The open slopes below Khullara offer early views of Dronagiri and Hathi–Ghoda when visibility allows.',
    ].join('\n\n'),
    meals: 'Breakfast, Lunch, Dinner',
    altitude: '11,200 ft',
    distance: 'Approx. 7 km trek',
    duration: '5–6 hrs',
    difficulty: 'Moderate',
    overnight: 'Khullara Campsite',
  },
  {
    day: 4,
    title: 'Khullara to Pangarchulla Summit & Return',
    description: [
      'Summit day. An early start from Khullara leads toward Pangarchulla Peak (approx. 15,069 ft). The final sections are steep and non-technical but demanding — especially with snow and wind in winter.',
      'From the top, clear weather can reveal close views of Nanda Devi, Dronagiri, Kamet and Hathi–Ghoda. Descend carefully to Khullara for overnight.',
    ].join('\n\n'),
    meals: 'Breakfast, Lunch, Dinner',
    altitude: '15,069 ft',
    distance: 'Approx. 12 km trek',
    duration: '8–9 hrs',
    difficulty: 'Moderate to Difficult',
    overnight: 'Khullara Campsite',
  },
  {
    day: 5,
    title: 'Khullara to Dhak / Tugasi & Drive to Joshimath',
    description: [
      'Descend through meadows and forest to the trailhead, then drive back to Joshimath. Celebrate a completed peak trek with a warm meal and rest.',
    ].join('\n\n'),
    meals: 'Breakfast, Lunch, Dinner',
    distance: 'Approx. 13 km trek + drive',
    duration: '6 hrs',
    overnight: 'Joshimath Hotel',
  },
  {
    day: 6,
    title: 'Joshimath to Rishikesh (Drive)',
    description: [
      'Drive back to Rishikesh along the Alaknanda. The trek concludes at the drop point; onward travel to Dehradun / Delhi is on your own schedule.',
    ].join('\n\n'),
    meals: 'Breakfast',
    duration: '9–10 hrs drive',
    dropoff: 'Rishikesh',
  },
];
