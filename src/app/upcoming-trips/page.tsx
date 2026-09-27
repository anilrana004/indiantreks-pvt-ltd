import TrendingLandingPageView from '@/components/trending/TrendingLandingPageView';
import { getUpcomingTripsLandingArticles } from '@/lib/knowledge/landing-page-articles';
import { upcomingTripsLandingConfig } from '@/lib/upcoming-trips-content';

export const revalidate = 300;

export const metadata = {
  title: 'Upcoming Trips | August, September & October Departures | Indian Treks',
  description:
    'Book fixed group departures for August, September and October — Himalayan treks, yatras and Nepal adventures with confirmed batch dates from Indian Treks.',
};

export default async function UpcomingTripsPage() {
  const blogArticles = await getUpcomingTripsLandingArticles();
  const config = {
    ...upcomingTripsLandingConfig,
    articles: { ...upcomingTripsLandingConfig.articles, items: blogArticles },
  };
  return <TrendingLandingPageView config={config} />;
}
