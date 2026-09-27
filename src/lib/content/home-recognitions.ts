export type HomeRecognitionLogo = {
  id: string;
  name: string;
  img: string;
};

export const HOME_RECOGNITIONS_SECTION = {
  kicker: 'RECOGNITIONS',
  title: 'Recognitions By Govt.',
  subtitle:
    'Recognized by Startup India, registered with ATOAI, and recipient of the TripAdvisor Travelers Choice Award.',
} as const;

/**
 * Real brand / gov logos self-hosted under /public/recognitions
 * (official sites + Wikimedia Commons originals — no generated marks).
 */
export const HOME_RECOGNITION_LOGOS: HomeRecognitionLogo[] = [
  { id: 'startup-india', name: 'Startup India', img: '/recognitions/startup-india.png' },
  { id: 'msme', name: 'MSME', img: '/recognitions/msme.svg' },
  { id: 'atoai', name: 'ATOAI', img: '/recognitions/atoai.png' },
  { id: 'iim-bangalore', name: 'IIM Bangalore', img: '/recognitions/iim-bangalore.svg' },
  { id: 'tripadvisor', name: 'TripAdvisor', img: '/recognitions/tripadvisor.svg' },
  { id: 'bengal-tourism', name: 'Bengal Tourism', img: '/recognitions/bengal.svg' },
  { id: 'uttarakhand-tourism', name: 'Uttarakhand Tourism', img: '/recognitions/uttarakhand.png' },
  { id: 'business-standard', name: 'Business Standard', img: '/recognitions/business-standard.svg' },
  { id: 'himachal-tourism', name: 'Himachal Tourism', img: '/recognitions/himachal.png' },
];
