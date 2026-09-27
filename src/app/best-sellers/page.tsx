import TrendingLandingPageView from '@/components/trending/TrendingLandingPageView';
import { bestSellersLandingConfig } from '@/lib/best-sellers-content';
import { getBestSellersLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata = {
  title: 'Best Sellers | Most Booked Group Trips | Indian Treks',
  description:
    'Explore Indian Treks best-selling group trips — top Himalayan treks, sacred yatras and international adventures with the highest ratings and repeat bookings.',
};

export default async function BestSellersPage() {
  const blogArticles = await getBestSellersLandingArticles();
  const config = {
    ...bestSellersLandingConfig,
    articles: { ...bestSellersLandingConfig.articles, items: blogArticles },
  };
  return <TrendingLandingPageView config={config} />;
}
