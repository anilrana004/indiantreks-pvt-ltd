import type { Metadata } from 'next';
import LearningProgramLandingView from '@/components/corporate/LearningProgramLandingView';
import { campusLanding } from '@/lib/corporate/campus-landing';
import { getCampusAmbassadorLandingArticles, mergeLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Campus Ambassador Program | Indian Treks',
  description:
    'Join the Indian Treks campus ambassador program — represent adventure travel on your campus, earn rewards, and help peers discover Himalayan treks.',
};

export default async function CampusAmbassadorPage() {
  const blogArticles = await getCampusAmbassadorLandingArticles();
  return (
    <LearningProgramLandingView content={mergeLandingArticles(campusLanding, blogArticles)} />
  );
}
