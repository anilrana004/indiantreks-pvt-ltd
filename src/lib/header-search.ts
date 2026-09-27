import { treks, trekDetailPath } from '@/lib/data';
import {
  CUSTOMIZED_RICH,
  GROUP_TRIPS_RICH,
  LEARNING_RICH,
  MORE_RICH,
  SPECIAL_RICH,
  TRENDING_RICH,
  YATRA_RICH,
  type RichNavItem,
} from '@/lib/nav-rich-menu';
import { CURATED_SECTIONS, MONTHS, REGIONS } from '@/lib/treks-listing';

export type HeaderSearchHit = {
  id: string;
  title: string;
  category: string;
  href: string;
  /** Lowercased haystack for matching */
  haystack: string;
};

function hit(
  id: string,
  title: string,
  category: string,
  href: string,
  extra = '',
): HeaderSearchHit {
  return {
    id,
    title,
    category,
    href,
    haystack: `${title} ${category} ${extra}`.toLowerCase(),
  };
}

function richCategory(item: RichNavItem): string {
  const href = item.href.toLowerCase();
  if (href.includes('/treks') || href.includes('trek')) return 'Trek List';
  if (href.includes('/yatra')) return 'Yatra';
  if (href.includes('/blog')) return 'Blog';
  return 'Page';
}

function buildIndex(): HeaderSearchHit[] {
  const items: HeaderSearchHit[] = [];

  for (const trek of treks) {
    items.push(
      hit(
        `trek-${trek.id}`,
        trek.title,
        trek.type === 'yatra' ? 'Yatra' : 'Trek',
        trekDetailPath(trek),
        `${trek.subtitle} ${trek.state} ${trek.region} ${trek.location}`,
      ),
    );
  }

  MONTHS.forEach((monthName, month) => {
    items.push(
      hit(
        `month-${month}`,
        `${monthName} Treks`,
        'Trek List',
        `/treks?month=${month}`,
        `best treks in ${monthName} upcoming`,
      ),
    );
  });

  for (const region of REGIONS) {
    const label = region.label;
    items.push(
      hit(
        `region-${region.id}`,
        `Best Treks to Do in ${label}`,
        'Trek List',
        `/treks?region=${region.id}`,
        `${label} ${region.id} jammu and kashmir himalaya`,
      ),
    );
  }

  for (const section of CURATED_SECTIONS) {
    items.push(
      hit(`curated-${section.id}`, section.title, 'Trek List', section.href, section.info),
    );
  }

  const richMenus: RichNavItem[] = [
    ...GROUP_TRIPS_RICH,
    ...CUSTOMIZED_RICH,
    ...TRENDING_RICH,
    ...YATRA_RICH,
    ...LEARNING_RICH,
    ...SPECIAL_RICH,
    ...MORE_RICH,
  ];

  for (const item of richMenus) {
    items.push(
      hit(`nav-${item.id}`, item.title, richCategory(item), item.href, item.subtitle),
    );
  }

  return items;
}

const INDEX = buildIndex();

function scoreHit(item: HeaderSearchHit, q: string): number {
  const title = item.title.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 75;
  if (item.haystack.includes(q)) return 50;
  // Token match (e.g. "kashmir trek")
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => item.haystack.includes(t))) return 60;
  return 0;
}

/** Live header search — treks, month/region lists, curated pages, and nav destinations. */
export function searchHeaderContent(query: string, limit = 12): HeaderSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return INDEX.map((item) => ({ item, score: scoreHit(item, q) }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.category.localeCompare(b.item.category) ||
        a.item.title.localeCompare(b.item.title),
    )
    .slice(0, limit)
    .map((x) => x.item);
}

export function headerSearchFallbackHref(query: string): string {
  const q = query.trim();
  return q ? `/treks?q=${encodeURIComponent(q)}` : '/treks';
}
