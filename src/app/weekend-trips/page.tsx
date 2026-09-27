import TrendingLandingPageView from '@/components/trending/TrendingLandingPageView';
import { getWeekendTripsLandingArticles } from '@/lib/knowledge/landing-page-articles';
import { weekendTripsLandingConfig } from '@/lib/weekend-trips-content';

export const revalidate = 300;

export const metadata = {
  title: 'Weekend Trips | Short Himalayan Treks | Indian Treks',
  description:
    'Book 2–3 day weekend treks across Himachal and Uttarakhand — Triund, Nag Tibba, Kheerganga, Beas Kund, Chopta and more with Indian Treks.',
};

export default async function WeekendTripsPage() {
  const blogArticles = await getWeekendTripsLandingArticles();
  const config = {
    ...weekendTripsLandingConfig,
    articles: { ...weekendTripsLandingConfig.articles, items: blogArticles },
  };
  return <TrendingLandingPageView config={config} />;
}
