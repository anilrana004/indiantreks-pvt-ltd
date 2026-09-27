import TrendingLandingPageView from '@/components/trending/TrendingLandingPageView';
import { getNewLaunchesLandingArticles } from '@/lib/knowledge/landing-page-articles';
import { newLaunchesLandingConfig } from '@/lib/new-launches-content';

export const revalidate = 300;

export const metadata = {
  title: 'New Launches | Latest Backpacking Trips | Indian Treks',
  description:
    'Discover Indian Treks newest backpacking launches — Meghalaya circuits, all-girls batches, winter Spiti and fresh Himachal routes with small-group departures.',
};

export default async function NewLaunchesPage() {
  const blogArticles = await getNewLaunchesLandingArticles();
  const config = {
    ...newLaunchesLandingConfig,
    articles: { ...newLaunchesLandingConfig.articles, items: blogArticles },
  };
  return <TrendingLandingPageView config={config} />;
}
