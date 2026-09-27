import InternationalGetawaysPageView from '@/components/international/InternationalGetawaysPageView';
import { getInternationalLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata = {
  title: 'International Getaways | Nepal, Bhutan & Beyond | Indian Treks',
  description:
    'International group getaways from India — Nepal treks, Bhutan journeys, and curated overseas adventures with Indian Treks.',
};

export default async function InternationalGetawaysPage() {
  const blogArticles = await getInternationalLandingArticles();
  return <InternationalGetawaysPageView blogArticles={blogArticles} />;
}
