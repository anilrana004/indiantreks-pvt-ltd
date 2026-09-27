import { treks, trekDetailPath, type Trek } from '@/lib/data';
import { photos } from '@/lib/media';
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
  /** Result thumbnail — always set for typeahead UI */
  image: string;
  /** Lowercased haystack for matching */
  haystack: string;
};

function trekImage(trek: Trek): string {
  return trek.cardImage || trek.images[0] || photos.uttarakhand;
}

function fallbackImage(category: string, href: string, title = ''): string {
  const h = href.toLowerCase();
  const t = title.toLowerCase();
  if (h.includes('winter') || t.includes('winter') || t.includes('snow')) return photos.snow;
  if (h.includes('yatra') || t.includes('yatra') || t.includes('kedarnath')) return photos.kedarnath;
  if (h.includes('himachal') || t.includes('himachal')) return photos.himachal;
  if (h.includes('nepal') || h.includes('international') || t.includes('everest')) return photos.nepal;
  if (h.includes('weekend') || t.includes('triund')) return photos.triund;
  if (h.includes('backpacking')) return photos.backpackingHero;
  if (h.includes('biking')) return photos.bikingHero;
  if (category === 'Yatra') return photos.yatra;
  if (category === 'Blog') return photos.uttarakhand;
  return photos.uttarakhand;
}

/** Prefer a live trek photo when the nav/list title matches a trek name. */
function imageForTitle(title: string, category: string, href: string): string {
  const q = title.toLowerCase();
  const matched = treks.find(
    (t) =>
      q.includes(t.title.toLowerCase()) ||
      t.title.toLowerCase().includes(q.replace(/\s+treks?$/i, '').trim()),
  );
  if (matched) return trekImage(matched);
  // First trek in a region list
  const region = REGIONS.find((r) => href.includes(`region=${r.id}`) || q.includes(r.label.toLowerCase()));
  if (region) {
    const sample = treks.find((t) => t.region === region.id);
    if (sample) return trekImage(sample);
  }
  return fallbackImage(category, href, title);
}

function hit(
  id: string,
  title: string,
  category: string,
  href: string,
  image: string,
  extra = '',
): HeaderSearchHit {
  return {
    id,
    title,
    category,
    href,
    image,
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
        trek.type === 'yatra' ? 'Yatra' : 'Upcoming Trek',
        trekDetailPath(trek),
        trekImage(trek),
        `${trek.subtitle} ${trek.state} ${trek.region} ${trek.location}`,
      ),
    );
  }

  MONTHS.forEach((monthName, month) => {
    const href = `/treks?month=${month}`;
    items.push(
      hit(
        `month-${month}`,
        `${monthName} Treks`,
        'Trek List',
        href,
        imageForTitle(`${monthName} Treks`, 'Trek List', href),
        `best treks in ${monthName} upcoming`,
      ),
    );
  });

  for (const region of REGIONS) {
    const label = region.label;
    const href = `/treks?region=${region.id}`;
    items.push(
      hit(
        `region-${region.id}`,
        `Best Treks to Do in ${label}`,
        'Trek List',
        href,
        imageForTitle(label, 'Trek List', href),
        `${label} ${region.id} jammu and kashmir himalaya`,
      ),
    );
  }

  for (const section of CURATED_SECTIONS) {
    const sampleId = section.trekIds?.[0];
    const sample = sampleId ? treks.find((t) => t.id === sampleId) : undefined;
    items.push(
      hit(
        `curated-${section.id}`,
        section.title,
        'Trek List',
        section.href,
        sample ? trekImage(sample) : imageForTitle(section.title, 'Trek List', section.href),
        section.info,
      ),
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
    const category = richCategory(item);
    items.push(
      hit(
        `nav-${item.id}`,
        item.title,
        category,
        item.href,
        imageForTitle(item.title, category, item.href),
        item.subtitle,
      ),
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
