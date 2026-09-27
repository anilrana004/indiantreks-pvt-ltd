import type { Metadata } from 'next';
import WomenOnlyTreksPageView from '@/components/special-programs/WomenOnlyTreksPageView';
import { getWomenOnlyTreksLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Women-Only Treks | All-Girls Himalayan Groups | Indian Treks',
  description:
    'Join women-only Himalayan treks with safe, supportive groups, experienced female leaders, and routes designed for comfort and confidence.',
};

export default async function WomenOnlyTreksPage() {
  const blogArticles = await getWomenOnlyTreksLandingArticles();
  return <WomenOnlyTreksPageView blogArticles={blogArticles} />;
}
