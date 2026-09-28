/** Canonical about-page copy from https://indiantreks.in/about-us/ */

import { cldUrl } from '@/lib/cloudinary';

/** WordPress originals → Cloudinary fetch with f_auto/q_auto (WebP/AVIF). */
function teamPhoto(src: string, size = 320): string {
  return cldUrl(src, { w: size, h: size, crop: 'fill', gravity: 'face', quality: 'auto' });
}

export const ABOUT_STATS = [
  { v: '20,000+', l: 'Trekkers Every Year' },
  { v: '200+', l: 'Trekking Routes' },
  { v: 'Since 2016', l: 'Trusted Company' },
] as const;

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  highlights?: readonly string[];
};

/** Featured on About page — Founder & CEO only (rest of team on /team). */
export const TEAM_FEATURED: readonly TeamMember[] = [
  {
    id: 'vijay-singh-rana',
    name: 'Mr Vijay Singh Rana',
    role: 'Founder, Indiantreks',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2023/02/Vijay-Singh-Rana-Indian-Treks.jpg'),
    bio: 'Mr Vijay Singh Rana, Founder of Indiantreks, is an M.A. graduate. Indiantreks was established as a direct consequence of their enthusiasm for travelling across the globe. Long before Indian Treks was founded, Mr. Vijay Rana had already been working on the ground in trekking and mountaineering since 2005. With over two decades of hands-on Himalayan experience, he has led and supported hundreds of treks, expeditions, and outdoor programs across Uttarakhand, Himachal Pradesh, and Ladakh. When most organizations focused only on numbers, he prioritized the quality of work, safety, and real mountain experience.',
    highlights: [
      'Founded Indian Treks from field experience since 2005',
      '20+ years across Uttarakhand, Himachal & Ladakh',
      'Safety-first culture over volume-led tourism',
    ],
  },
  {
    id: 'vivek-rana',
    name: 'Mr Vivek Rana',
    role: 'CEO, Indiantreks',
    image: teamPhoto(
      'https://indiantreks.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-02-at-1.52.36-PM-1024x983.jpeg',
    ),
    bio: 'Mr. Vivek Rana, who hails from the remote Osla village in the western Garhwal Himalayas and has a cumulative experience of 15 years working in this field as a mountain guide, is the Chief Executive Officer of Indiantreks. He completed his Bachelor of Business Administration and Bachelor of Arts degrees, and has completed many treks across Uttarakhand, Himachal, and Ladakh — including Kalindi Khal, Bali Pass, Borasu Pass, Rupin Pass, Valley of Flowers, and Kedarkantha. He completed his Advance Mountaineering Course from the Nehru Institute of Mountaineering and a Wilderness Medicine course from a nationally renowned institute.',
    highlights: [
      'From Osla village, western Garhwal Himalayas',
      'Advance Mountaineering Course — NIM',
      'Wilderness Medicine certified · 15 years guiding',
    ],
  },
];

/** @deprecated Prefer TEAM_FEATURED for About; kept for any older imports. */
export const TEAM_LEADERS = TEAM_FEATURED;

export const TEAM_ROSTER: readonly TeamMember[] = [
  ...TEAM_FEATURED,
  {
    id: 'lalita-rana',
    name: 'Mrs. Lalita Rana',
    role: 'Trek Manager, Indiantreks',
    image: teamPhoto(
      'https://indiantreks.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-01-at-1.59.59-PM-926x1024.jpeg',
    ),
    bio: 'Mrs. Lalita Rana has been with Vivek Ji from the very beginning. With an excellent academic and athletic background, she completed both basic and advanced computer courses and achieved her Master of Arts degree. She is NCC-certified and manages office work while assisting the Finance and Accounts Department. She has completed Har Ki Dun, Kedarkantha, Ruinsara Lake, Satopanth Lake, Gaumukh Tapovan, Hampta Pass, Chopta Tungnath, Nag Tibba, Deoban, and many more treks.',
  },
  {
    id: 'sanjay-rawat',
    name: 'Mr. Sanjay Rawat',
    role: 'Himalayan Trek Expert at IndianTreks',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-01-at-3.12.47-PM.jpeg'),
    bio: 'Sanjay Rawat, a senior trek leader with Indiantreks, is well-known for his outstanding leadership and wealth of Himalayan trekking specialization. Sanjay has over 10 years of experience leading trekkers over some of the most stunning and challenging landscapes in the region, having been a part of Indiantreks since its inception. His trek leadership covers renowned High Mountain Pass Treks like Bali Pass, Lamkhaga Pass, Rupin Pass, Barasu Pass, Valley of Flowers, Char Dham Yatra, and Glacier Treks in Uttarakhand and Kashmir.',
  },
  {
    id: 'ajay-panwar',
    name: 'Mr. Ajay Panwar',
    role: "The Heart of Indiantreks' Transport Team",
    image: teamPhoto(
      'https://indiantreks.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-03-at-4.50.18-PM-1024x988.jpeg',
    ),
    bio: "Ajay Panwar, who spent time in the transportation industry for over 10 years, lends the Indiantreks team helpful insight. He has had a key role in simplifying trekkers' logistics since 2015, guaranteeing reliable and simple travel experiences. Ajay manages daily operations and communications for a variety of treks, ensuring every aspect — from the initial pickup to the last drop-off — is carefully handled.",
  },
  {
    id: 'jay',
    name: 'Mr. Jay',
    role: 'Marketing Manager',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2023/02/Jay-Rana-Indian-Treks.jpg'),
    bio: 'Professional mountaineer and all-around kind guy; crucial in keeping the peace on the trail. Excellent marketing skill.',
  },
  {
    id: 'buwan-rawat',
    name: 'Mr. Buwan Rawat',
    role: 'Senior Technical Guide',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2023/02/Bhuvan-Rawat-Indian-Treks.jpg'),
    bio: 'Very competent and knowledgeable technical guide who has climbed numerous high mountains to date.',
  },
  {
    id: 'jagdish-singh',
    name: 'Mr. Jagdish Singh',
    role: 'Senior Guide',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2023/02/Jagdish-Indian-Treks.jpeg'),
    bio: 'He has mastered the skill of guiding people and discovering paths, and holds the title of senior guide with Indiantreks.',
  },
  {
    id: 'ameen',
    name: 'Mr. Ameen',
    role: 'Expedition Trek Leader',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2023/02/Ameen-Indian-Treks.jpg'),
    bio: "He's been on a tonne of successful treks and knows all there is to know about gear and peak-hopping.",
  },
  {
    id: 'sachin-thapa',
    name: 'Mr. Sachin Thapa',
    role: 'Senior Driver at IndianTreks Family',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-01-at-2.44.29-PM.jpeg'),
    bio: 'With years of experience, Sachin Thapa skillfully negotiates a variety of terrains, guaranteeing adventurers a safe and easy trip. He is a trusted member of the Indiantreks Family, offering comfort and reliability on every trip because of his strong regard for safety and responsible driving.',
  },
  {
    id: 'bhagat-thapa',
    name: 'Mr. Bhagat Thapa',
    role: 'Experienced Driver at IndianTreks Family',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-01-at-2.34.04-PM.jpeg'),
    bio: "As IndianTreks' senior-most driver, Bhagat Thapa expertly handles all terrains, delivering safe, smooth, and efficient travel for trekkers. His years of experience and commitment to responsible driving make him a vital part of the IndianTreks Family.",
  },
  {
    id: 'vishnu-thapa',
    name: 'Mr. Vishnu Thapa',
    role: 'Trusted Driver at IndianTreks',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-01-at-4.02.11-PM.jpeg'),
    bio: 'Vishnu Thapa, a seasoned driver at IndianTreks, brings years of expertise and a deep understanding of challenging terrains. His exceptional driving skills, combined with a strong focus on safety, ensure that every journey with Indiantreks is comfortable, hassle-free, and secure for all adventurers.',
  },
  {
    id: 'sildar-panwar',
    name: 'Mr. Sildar Panwar',
    role: 'Senior Trek Leader at IndianTreks',
    image: teamPhoto('https://indiantreks.in/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-01-at-3.44.44-PM.jpeg'),
    bio: 'Sildar Panwar, a senior trek leader at Indiantreks, has over 10 years of experience leading trekkers through the Himalayas. His leadership includes iconic High Mountain Pass Treks like Bali Pass, Lamkhaga Pass, Rupin Pass, Barasu Pass, and Valley of Flowers Trek.',
  },
];


export const TEAM_INTRO =
  'Because of our committed team of specialists that put in a lot of effort and are professionals in their field, we are only able to provide our customers with excellent experiences. We are a group of around 50 individuals, the majority of whom come from a variety of communities located in the Indian Himalayas. More than 20 of our employees are qualified and experienced guides or tour leaders, and they are all housed under one roof.';
