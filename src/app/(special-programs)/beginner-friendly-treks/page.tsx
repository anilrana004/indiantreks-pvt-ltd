import type { Metadata } from 'next';
import BeginnerFriendlyTreksPageView from '@/components/special-programs/BeginnerFriendlyTreksPageView';
import { getBeginnerTreksLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Beginner-Friendly Treks | Easy Himalayan Routes | Indian Treks',
  description:
    'Start your Himalayan journey on beginner-friendly treks with gentle trails, expert guides, and supportive group pacing from Indian Treks.',
};

export default async function BeginnerFriendlyTreksPage() {
  const blogArticles = await getBeginnerTreksLandingArticles();
  return <BeginnerFriendlyTreksPageView blogArticles={blogArticles} />;
}
