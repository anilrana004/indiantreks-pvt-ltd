import TrendingLandingPageView from '@/components/trending/TrendingLandingPageView';
import { bucketListSaleLandingConfig } from '@/lib/bucket-list-sale-content';
import { getBucketListSaleLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata = {
  title: 'Bucket List Sale | Up to 40% Off Treks & Yatras | Indian Treks',
  description:
    'Limited-period Bucket List Sale on Himalayan treks, sacred yatras, weekend escapes and Nepal adventures — up to 40% off with Indian Treks.',
};

export default async function BucketListSalePage() {
  const blogArticles = await getBucketListSaleLandingArticles();
  const config = {
    ...bucketListSaleLandingConfig,
    articles: { ...bucketListSaleLandingConfig.articles, items: blogArticles },
  };
  return <TrendingLandingPageView config={config} />;
}
