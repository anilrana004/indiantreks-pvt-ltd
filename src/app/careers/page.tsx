import type { Metadata } from 'next';
import CareersPageView from '@/components/careers/CareersPageView';
import { getCareersLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Careers | Indian Treks — Join Our Himalayan Adventure Team',
  description:
    'Explore careers at Indian Treks. Join our team in Dehradun to help travellers experience unforgettable Himalayan treks, yatras, and adventure travel.',
};

/** Careers UI — structure mirrored from Thrillophilia careers */
export default async function CareersPage() {
  const blogArticles = await getCareersLandingArticles();
  return <CareersPageView blogArticles={blogArticles} />;
}
