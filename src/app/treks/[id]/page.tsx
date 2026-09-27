import { notFound, redirect } from 'next/navigation';
import { treks, getTrekById, trekDetailPath } from '@/lib/data';
import TrekDetailContent from '@/components/TrekDetailContent';
import { fetchRelatedBlogPosts } from '@/lib/knowledge/adapter';
import { getPromoBanners } from '@/lib/trek-detail-content';

export const dynamicParams = true;
export const revalidate = 300;

export function generateStaticParams() {
  return treks.filter((t) => t.type === 'trek').map((t) => ({ id: t.id }));
}

export default async function TrekDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trek = getTrekById(id);
  if (!trek) notFound();

  // Canonicalize aliased / legacy slugs (e.g. /treks/triund → /treks/mcleodganj-trek)
  const canonical = trekDetailPath(trek);
  if (trek.type === 'yatra') {
    redirect(canonical);
  }
  if (id !== trek.id) {
    redirect(canonical);
  }

  const relatedBlogPosts = await fetchRelatedBlogPosts(trek, 3, 'trek');
  const promoBanners = getPromoBanners(trek);

  return (
    <TrekDetailContent
      trek={trek}
      type="trek"
      relatedBlogPosts={relatedBlogPosts}
      promoBanners={promoBanners}
    />
  );
}
