import SacredYatraPageView from '@/components/yatra/SacredYatraPageView';
import { getYatraLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata = {
  title: 'Sacred Yatra Tours | Kedarnath, Char Dham & Himalayan Pilgrimage | Indian Treks',
  description:
    'Organised Himalayan yatra tours to Kedarnath, Badrinath, Char Dham and more. Safe darshan logistics, experienced coordinators and comfortable stays with Indian Treks.',
};

export default async function YatraPage() {
  const blogArticles = await getYatraLandingArticles();
  return <SacredYatraPageView blogArticles={blogArticles} />;
}
