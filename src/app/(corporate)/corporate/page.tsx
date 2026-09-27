import type { Metadata } from 'next';
import CorporateTeamBuildingPageView from '@/components/corporate/CorporateTeamBuildingPageView';
import { getCorporateLandingArticles } from '@/lib/knowledge/landing-page-articles';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Team Building Treks for Companies | Corporate Offsites | Indian Treks',
  description:
    'Elevate team bonding through Himalayan adventure. Day hikes, overnight camping, and collaborative leadership programmes designed for companies — beyond the usual corporate offsite.',
};

export default async function CorporatePage() {
  const blogArticles = await getCorporateLandingArticles();
  return <CorporateTeamBuildingPageView blogArticles={blogArticles} />;
}
