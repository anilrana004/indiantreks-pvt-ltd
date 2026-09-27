import { notFound } from 'next/navigation';
import { treks, getTrekById } from '@/lib/data';
import TrekDetailContent from '@/components/TrekDetailContent';
import { fetchRelatedBlogPosts } from '@/lib/knowledge/adapter';
import { getPromoBanners } from '@/lib/trek-detail-content';

export const dynamicParams = true;
export const revalidate = 300;

export function generateStaticParams() {
  return treks.filter((t) => t.type === 'yatra').map((t) => ({ id: t.id }));
}

export default async function YatraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trek = getTrekById(id);
  if (!trek) notFound();
  const relatedBlogPosts = await fetchRelatedBlogPosts(trek, 3, 'yatra');
  const promoBanners = getPromoBanners(trek);

  return (
    <TrekDetailContent
      trek={trek}
      type={trek.type === 'yatra' ? 'yatra' : 'trek'}
      relatedBlogPosts={relatedBlogPosts}
      promoBanners={promoBanners}
    />
  );
}
