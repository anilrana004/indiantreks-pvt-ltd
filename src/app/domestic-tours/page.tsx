import DomesticToursPageView from '@/components/domestic/DomesticToursPageView';
import { getDomesticLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata = {
  title: 'Domestic Tours in India | Himalayan & Heritage Getaways | Indian Treks',
  description:
    'Curated domestic tours across India — Himalayan treks, heritage circuits, and regional getaways with Indian Treks fixed departures and small groups.',
};

export default async function DomesticToursPage() {
  const blogArticles = await getDomesticLandingArticles();
  return <DomesticToursPageView blogArticles={blogArticles} />;
}
