import type { Metadata } from 'next';
import FamilyTreksPageView from '@/components/special-programs/FamilyTreksPageView';
import { getFamilyTreksLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Family Treks in the Himalayas | Kids & Parents Welcome | Indian Treks',
  description:
    'Plan a family-friendly Himalayan trek with manageable trails, scenic meadows, and shared adventure designed for parents and children travelling together.',
};

export default async function FamilyTreksPage() {
  const blogArticles = await getFamilyTreksLandingArticles();
  return <FamilyTreksPageView blogArticles={blogArticles} />;
}
