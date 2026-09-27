import type { Metadata } from 'next';
import SpecialProgramsHubPageView from '@/components/special-programs/SpecialProgramsHubPageView';
import { getSpecialProgramsHubLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Special Programs | Indian Treks — Women, Family, Senior & Beginner Treks',
  description:
    'Curated Himalayan trek collections for women-only groups, senior citizens, families, and beginner-friendly first treks with Indian Treks.',
};

export default async function SpecialProgramsHubPage() {
  const blogArticles = await getSpecialProgramsHubLandingArticles();
  return <SpecialProgramsHubPageView blogArticles={blogArticles} />;
}
