import type { Metadata } from 'next';
import LearningProgramLandingView from '@/components/corporate/LearningProgramLandingView';
import { giftLanding } from '@/lib/corporate/gift-landing';
import { getTravelGiftCardsLandingArticles, mergeLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Travel Gift Cards | Indian Treks',
  description:
    'Gift Himalayan adventures with Indian Treks travel gift cards — perfect for birthdays, milestones, and experience-led gifting.',
};

export default async function TravelGiftCardsPage() {
  const blogArticles = await getTravelGiftCardsLandingArticles();
  return (
    <LearningProgramLandingView content={mergeLandingArticles(giftLanding, blogArticles)} />
  );
}
