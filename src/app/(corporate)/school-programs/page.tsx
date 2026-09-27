import type { Metadata } from 'next';
import LearningProgramLandingView from '@/components/corporate/LearningProgramLandingView';
import { schoolLanding } from '@/lib/corporate/school-landing';
import { getSchoolProgramsLandingArticles, mergeLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'School Programs | Educational Himalayan Outings | Indian Treks',
  description:
    'Safe, curriculum-aligned school trekking and outdoor learning programs in Uttarakhand and Himachal — nature camps, leadership trails, and heritage journeys.',
};

export default async function SchoolProgramsPage() {
  const blogArticles = await getSchoolProgramsLandingArticles();
  return (
    <LearningProgramLandingView content={mergeLandingArticles(schoolLanding, blogArticles)} />
  );
}
