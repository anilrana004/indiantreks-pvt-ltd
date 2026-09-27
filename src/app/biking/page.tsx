import BikingTripsPageView from '@/components/biking/BikingTripsPageView';
import { getBikingLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata = {
  title: 'Biking Trips in the Himalayas | Manali, Ladakh & Spiti | Indian Treks',
  description:
    'Epic Himalayan biking trips across Manali–Leh, Spiti, and high-altitude routes. Guided groups, support vehicles, and scenic camps with Indian Treks.',
};

export default async function BikingPage() {
  const blogArticles = await getBikingLandingArticles();
  return <BikingTripsPageView blogArticles={blogArticles} />;
}
