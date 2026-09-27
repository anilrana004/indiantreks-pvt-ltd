'use client';

import CategoryScroller from '@/components/home/CategoryScroller';
import { HOME_EXPLORE_CATEGORIES } from '@/lib/content/home-explore-categories';

/** Desktop-only JustWravel pill — phone uses the original strip inside Hero. */
export default function ExploreCategories() {
  return (
    <section
      aria-label="Explore categories"
      className="hidden bg-[var(--ih-bg)] py-3 lg:block lg:py-4"
    >
      <div className="container mx-auto">
        <div className="mx-auto w-fit max-w-full overflow-x-auto rounded-full border border-[var(--ih-border)] bg-[var(--ih-surface)] px-5 py-3 shadow-[var(--ih-shadow-soft)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 sm:py-3.5">
          <CategoryScroller items={HOME_EXPLORE_CATEGORIES} variant="desktop" />
        </div>
      </div>
    </section>
  );
}
