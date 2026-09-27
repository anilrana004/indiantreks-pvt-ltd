import BackpackingTripsPageView from '@/components/backpacking/BackpackingTripsPageView';
import { getBackpackingLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata = {
  title: 'Backpacking Trips in India | Uttarakhand, Himachal, Spiti & Meghalaya | Indian Treks',
  description:
    'Flexible, social backpacking journeys across Uttarakhand, Himachal Pradesh, Spiti Valley and Meghalaya. Small groups, local experiences and carefully planned routes with Indian Treks.',
};

export default async function BackpackingPage() {
  const blogArticles = await getBackpackingLandingArticles();
  return <BackpackingTripsPageView blogArticles={blogArticles} />;
}
