'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Mountain,
  Sparkles,
} from 'lucide-react';
import TrekCuratedSection from '@/components/treks/TrekCuratedSection';
import WinterTreksLanding from '@/components/treks/WinterTreksLanding';
import { DESK_HEADER_H, MOBILE_HEADER_H } from '@/lib/layout';
import {
  CURATED_SECTIONS,
  DIFFICULTIES,
  DURATIONS,
  EXPERIENCES,
  INFO_BANNERS,
  MONTHS,
  MONTH_CURATED_TREK_IDS,
  REGIONS,
  SEASONS,
  resolveCuratedTreks,
  type CuratedSection,
  type ListingTrek,
  type SeasonId,
  type TopCategory,
} from '@/lib/treks-listing';
import {
  buildFilterCuratedSection,
  getFilterView,
  resolveFilterTreks,
} from '@/lib/trek-filter-views';
import {
  WINTER_FILTER_TREKS,
  WINTER_TOP_TREK_IDS,
} from '@/lib/content/winter-treks-guide';
import type { SpecialProgramId } from '@/lib/special-programs-content';
import type { Trek } from '@/lib/data';
import { CONTACT, telUrl } from '@/lib/contact';
import { winterTrekReviews } from '@/lib/content/winter-trek-reviews';
import { treksArticles, treksReviews, type LandingArticle } from '@/lib/landing-social-content';
import LandingBlogSection from '@/components/landing/LandingBlogSection';
import LandingReviewsBlog from '@/components/landing/LandingReviewsBlog';
import TreksWhySection from '@/components/treks/TreksWhySection';
import {
  WinterPackingSection,
  WinterSafetySection,
} from '@/components/treks/WinterPackingSafety';
import WinterTreksFaq from '@/components/treks/WinterTreksFaq';
import WinterTreksReviews from '@/components/treks/WinterTreksReviews';
import TreksDesktopHero from '@/components/treks/TreksDesktopHero';
import './treks-explorer.css';

type Filters = {
  q: string;
  month: number | null;
  difficulty: string | null;
  experience: SpecialProgramId | null;
  season: SeasonId | null;
  duration: string | null;
  region: Trek['region'] | null;
};

function normalizeDifficulty(raw: string | null): string | null {
  if (!raw) return null;
  const q = raw.toLowerCase().replace(/[_\s]+/g, ' ').trim();
  const hit = DIFFICULTIES.find(
    (d) =>
      d.toLowerCase() === q ||
      d.toLowerCase().replace(/ to /g, '-') === q ||
      d.toLowerCase().includes(q),
  );
  return hit ?? null;
}

function parseInitial(sp: URLSearchParams): Filters {
  const monthRaw = sp.get('month');
  const monthNum = monthRaw ? Number(monthRaw) : NaN;
  let month: number | null = null;
  if (Number.isFinite(monthNum) && monthNum >= 0 && monthNum <= 11) month = monthNum;
  else if (monthRaw) {
    const idx = MONTHS.findIndex((m) => m.toLowerCase() === monthRaw.toLowerCase());
    if (idx >= 0) month = idx;
  }

  const experience = sp.get('experience') as SpecialProgramId | null;
  const season = sp.get('season') as SeasonId | null;
  const region = sp.get('region') as Trek['region'] | null;
  const duration = sp.get('duration');

  return {
    q: sp.get('q')?.trim() || '',
    month,
    difficulty: normalizeDifficulty(sp.get('difficulty')),
    experience: EXPERIENCES.some((e) => e.id === experience) ? experience : null,
    season: SEASONS.some((s) => s.id === season) ? season : null,
    duration: DURATIONS.some((d) => d.id === duration) ? duration : null,
    region: REGIONS.some((r) => r.id === region) ? region : null,
  };
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="it-treks-filter-section">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="it-treks-filter-section__toggle"
        aria-expanded={open}
      >
        <span className="it-treks-filter-section__title">{title}</span>
        <ChevronDown
          className={`it-treks-filter-section__chevron${open ? ' is-open' : ''}`}
        />
      </button>
      {open && <div className="it-treks-filter-section__body">{children}</div>}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`it-treks-filter-chip${active ? ' is-active' : ''}${compact ? ' is-compact' : ''}`}
    >
      {children}
    </button>
  );
}

function subscribeDesktop(onStoreChange: () => void) {
  const mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia('(min-width: 1024px)').matches;
}

function getDesktopServerSnapshot() {
  return false;
}

export default function AllTreksExplorer({
  treks,
  categories,
  year = 2026,
  blogArticles,
}: {
  treks: ListingTrek[];
  categories: TopCategory[];
  year?: number;
  blogArticles?: LandingArticle[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [filters, setFilters] = useState<Filters>(() => parseInitial(searchParams));
  const [mobileFilters, setMobileFilters] = useState(false);
  const [searchDraft, setSearchDraft] = useState(filters.q);
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );

  useEffect(() => {
    setFilters(parseInitial(searchParams));
    setSearchDraft(searchParams.get('q')?.trim() || '');
  }, [searchParams]);

  useEffect(() => {
    if (!mobileFilters) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFilters]);

  const syncUrl = useCallback(
    (next: Filters) => {
      const params = new URLSearchParams();
      if (next.q) params.set('q', next.q);
      if (next.month !== null) params.set('month', String(next.month));
      if (next.difficulty) params.set('difficulty', next.difficulty);
      if (next.experience) params.set('experience', next.experience);
      if (next.season) params.set('season', next.season);
      if (next.duration) params.set('duration', next.duration);
      if (next.region) params.set('region', next.region);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const update = useCallback(
    (patch: Partial<Filters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        queueMicrotask(() => syncUrl(next));
        return next;
      });
    },
    [syncUrl],
  );

  const clearAll = () => {
    const empty: Filters = {
      q: '',
      month: null,
      difficulty: null,
      experience: null,
      season: null,
      duration: null,
      region: null,
    };
    setSearchDraft('');
    setFilters(empty);
    queueMicrotask(() => syncUrl(empty));
    setMobileFilters(false);
  };

  /** Scroll to the trek grid (mobile + desktop targets). */
  const scrollToTreks = useCallback(() => {
    window.requestAnimationFrame(() => {
      document.getElementById('curated-treks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document
        .getElementById('curated-treks-desktop')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  /** Apply a category tile in-place (same page) and scroll to the trek list. */
  const applyCategoryHref = useCallback(
    (href: string) => {
      const qs = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';
      const next = parseInitial(new URLSearchParams(qs));
      setSearchDraft(next.q);
      setFilters(next);
      queueMicrotask(() => syncUrl(next));
      scrollToTreks();
    },
    [scrollToTreks, syncUrl],
  );

  const selectMonth = useCallback(
    (index: number) => {
      const next = filters.month === index ? null : index;
      update({ month: next });
      if (next !== null) scrollToTreks();
    },
    [filters.month, scrollToTreks, update],
  );

  const toggleFilter = useCallback(
    <K extends keyof Filters>(key: K, value: NonNullable<Filters[K]>, current: Filters[K]) => {
      const next = current === value ? null : value;
      update({ [key]: next } as Partial<Filters>);
      if (next !== null) scrollToTreks();
    },
    [scrollToTreks, update],
  );

  const activeCount = [
    filters.q,
    filters.month !== null,
    filters.difficulty,
    filters.experience,
    filters.season,
    filters.duration,
    filters.region,
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    let list = treks;

    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q) ||
          t.state.toLowerCase().includes(q) ||
          t.region.toLowerCase().includes(q),
      );
    }
    if (filters.region) list = list.filter((t) => t.region === filters.region);
    if (filters.difficulty) list = list.filter((t) => t.difficulty === filters.difficulty);
    if (filters.month !== null) {
      const curated = MONTH_CURATED_TREK_IDS[filters.month];
      if (curated?.length) {
        const ids = new Set(curated);
        list = list.filter((t) => ids.has(t.id));
      } else {
        list = list.filter((t) => t.openMonths.includes(filters.month!));
      }
    }
    if (filters.season === 'winter') {
      const winterIds = new Set<string>(WINTER_TOP_TREK_IDS);
      list = list.filter((t) => winterIds.has(t.id));
    } else if (filters.season) {
      list = list.filter((t) => t.seasons.includes(filters.season!));
    }
    if (filters.experience) {
      list = list.filter((t) => t.experiences.includes(filters.experience!));
    }
    if (filters.duration) {
      const rule = DURATIONS.find((d) => d.id === filters.duration);
      if (rule) list = list.filter((t) => rule.test(t.days));
    }

    const difficultyRank: Record<string, number> = {
      Easy: 1,
      'Easy to Moderate': 2,
      Moderate: 3,
      'Moderate-Difficult': 4,
      Difficult: 5,
    };

    return [...list].sort(
      (a, b) =>
        Number(b.rating) - Number(a.rating) ||
        (difficultyRank[a.difficulty] ?? 9) - (difficultyRank[b.difficulty] ?? 9),
    );
  }, [treks, filters]);

  const submitSearch = (e?: FormEvent) => {
    e?.preventDefault();
    const q = searchDraft.trim();
    update({ q });
    if (q) scrollToTreks();
  };

  const isFilterFocus = activeCount > 0;
  const filterView = isFilterFocus ? getFilterView(filters) : null;
  const showBrowseExtras = !isFilterFocus;

  const isWinterFocus =
    filters.season === 'winter' &&
    !filters.q &&
    filters.month === null &&
    !filters.difficulty &&
    !filters.experience &&
    !filters.duration &&
    !filters.region;

  const winterLandingTreks = useMemo(() => {
    if (!isWinterFocus) return [] as ListingTrek[];
    return resolveFilterTreks(filters, filtered);
  }, [isWinterFocus, filters, filtered]);

  const curatedBlocks = useMemo(() => {
    if (isWinterFocus) return [];

    if (isFilterFocus && filterView) {
      const list = resolveFilterTreks(filters, filtered);
      if (list.length === 0) return [];
      return [{ section: buildFilterCuratedSection(filterView), treks: list }];
    }

    return CURATED_SECTIONS.map((section) => ({
      section,
      treks: resolveCuratedTreks(section, filtered, {
        limit: section.trekIds?.length ?? 8,
        month: filters.month,
      }),
    })).filter((b) => b.treks.length > 0);
  }, [filtered, filterView, filters, isFilterFocus, isWinterFocus]);

  const curatedOnOpen = (section: CuratedSection) => {
    if (isFilterFocus) return undefined;
    if (section.id === 'summits') return undefined;
    return () => applyCategoryHref(section.href);
  };

  const curatedLayout = (_sectionId: string) => (isFilterFocus ? 'grid' as const : 'scroll' as const);

  const mobileHeroTitle = filterView?.heading ?? 'Looking for a specific trek?';
  const mobileHeroLead =
    filterView?.sectionTitle ??
    'Filter by month, difficulty, season or region — or search your dream Himalayan trail.';
  const desktopHeroTitle = filterView?.heading ?? `Upcoming Treks in ${year}`;
  const desktopHeroLead =
    filterView?.sectionTitle ??
    `New year, new trails! Explore handpicked treks across the Himalayas. Start planning your ${year} adventure today.`;
  const isDefaultDesktopHero = !isFilterFocus;

  const filterPanel = (
    <div className="it-treks-filters">
      <div className="it-treks-filters__head">
        <div className="it-treks-filters__title">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filter Treks
        </div>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="it-treks-filters__clear">
            Clear all
          </button>
        )}
      </div>

      <FilterSection title="Treks by Month">
        <div className="it-treks-filter-section__grid">
          {MONTHS.map((m, i) => (
            <Chip
              key={m}
              compact
              active={filters.month === i}
              onClick={() => selectMonth(i)}
            >
              {m.slice(0, 3)}
            </Chip>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Treks by Difficulty">
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d}
            active={filters.difficulty === d}
            onClick={() => toggleFilter('difficulty', d, filters.difficulty)}
          >
            {d}
          </Chip>
        ))}
      </FilterSection>

      <FilterSection title="Treks by Experience" defaultOpen={false}>
        {EXPERIENCES.map((e) => (
          <Chip
            key={e.id}
            active={filters.experience === e.id}
            onClick={() => toggleFilter('experience', e.id, filters.experience)}
          >
            {e.label}
          </Chip>
        ))}
      </FilterSection>

      <FilterSection title="Treks by Season" defaultOpen={filters.season === 'winter'}>
        {SEASONS.map((s) => (
          <Chip
            key={s.id}
            active={filters.season === s.id}
            onClick={() => {
              if (s.id === 'winter' && filters.season !== 'winter') {
                update({
                  season: 'winter',
                  q: '',
                  month: null,
                  difficulty: null,
                  experience: null,
                  duration: null,
                  region: null,
                });
                scrollToTreks();
                return;
              }
              toggleFilter('season', s.id, filters.season);
            }}
          >
            {s.label}
          </Chip>
        ))}
      </FilterSection>

      <FilterSection
        title="Best Winter Treks 2026–27"
        defaultOpen={filters.season === 'winter'}
      >
        <Chip
          active={filters.season === 'winter'}
          onClick={() => {
            if (filters.season !== 'winter') {
              update({
                season: 'winter',
                q: '',
                month: null,
                difficulty: null,
                experience: null,
                duration: null,
                region: null,
              });
              scrollToTreks();
            } else {
              toggleFilter('season', 'winter', filters.season);
            }
          }}
        >
          All winter snow treks
        </Chip>
        <div className="it-treks-filter-section__grid mt-2">
          {WINTER_FILTER_TREKS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="it-treks-filter-chip it-treks-filter-chip--link is-compact"
              onClick={() => {
                update({
                  season: 'winter',
                  q: '',
                  month: null,
                  difficulty: null,
                  experience: null,
                  duration: null,
                  region: null,
                });
                scrollToTreks();
                window.setTimeout(() => {
                  document.getElementById(`trek-${t.id}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 120);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Treks by Duration" defaultOpen={false}>
        {DURATIONS.map((d) => (
          <Chip
            key={d.id}
            active={filters.duration === d.id}
            onClick={() => toggleFilter('duration', d.id, filters.duration)}
          >
            {d.label}
          </Chip>
        ))}
      </FilterSection>

      <FilterSection title="Treks by Region">
        {REGIONS.map((r) => (
          <Chip
            key={r.id}
            active={filters.region === r.id}
            onClick={() => toggleFilter('region', r.id, filters.region)}
          >
            {r.label}
          </Chip>
        ))}
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--ih-bg)]">
      {/* —— Mobile phone UI (Indiahikes-style) —— */}
      <div className="lg:hidden">
        {/* Compact announcement strip */}
        <div className="border-b border-[#bbf7d0] bg-[#14532d] px-4 py-2.5">
          <p className="text-[12px] leading-snug text-[#dcfce7]">
            {INFO_BANNERS[0].text}{' '}
            <Link href={INFO_BANNERS[0].href} className="font-semibold underline underline-offset-2">
              {INFO_BANNERS[0].cta}
            </Link>
          </p>
        </div>

        <section className="bg-white px-4 pb-4 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#16a34a]">
            Upcoming · {year}
          </p>
          <h1 className="mt-1.5 font-[family-name:var(--font-heading)] text-[1.65rem] font-bold leading-[1.15] text-gray-900">
            {mobileHeroTitle}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
            {mobileHeroLead}
          </p>

          <form onSubmit={submitSearch} className="mt-4 flex gap-2" role="search">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search treks</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search treks…"
                className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#16a34a] focus:bg-white focus:ring-2 focus:ring-[#16a34a]/20"
              />
            </label>
            <button
              type="button"
              onClick={() => setMobileFilters(true)}
              className="it-retro-btn it-retro-btn--primary it-retro-btn--pill it-retro-btn--sm shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1 text-[10px]">
                  {activeCount}
                </span>
              )}
            </button>
          </form>
        </section>

        {/* Sticky quick filters — floating pill shell (same language as landing sticky nav) */}
        <div
          className="it-treks-quick"
          style={{ ['--it-mob-header' as string]: `${MOBILE_HEADER_H}px` }}
        >
          <div className="it-treks-quick__shell">
            <p className="it-treks-quick__label">Filter</p>
            <div className="it-treks-quick__track" role="tablist" aria-label="Quick trek filters">
              {[
                { label: 'All', on: !isFilterFocus, go: () => clearAll() },
                { label: 'Beginner', on: filters.experience === 'beginner', go: () => toggleFilter('experience', 'beginner', filters.experience) },
                {
                  label: 'Winter',
                  on: isWinterFocus || filters.season === 'winter',
                  go: () => {
                    if (filters.season === 'winter') {
                      toggleFilter('season', 'winter', filters.season);
                      return;
                    }
                    update({
                      season: 'winter',
                      q: '',
                      month: null,
                      difficulty: null,
                      experience: null,
                      duration: null,
                      region: null,
                    });
                    scrollToTreks();
                  },
                },
                { label: 'Uttarakhand', on: filters.region === 'uttarakhand', go: () => toggleFilter('region', 'uttarakhand', filters.region) },
                { label: 'Himachal', on: filters.region === 'himachal', go: () => toggleFilter('region', 'himachal', filters.region) },
                { label: 'Easy', on: filters.difficulty === 'Easy', go: () => toggleFilter('difficulty', 'Easy', filters.difficulty) },
                { label: 'Nepal', on: filters.region === 'nepal', go: () => toggleFilter('region', 'nepal', filters.region) },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  role="tab"
                  aria-selected={chip.on}
                  onClick={chip.go}
                  className={`it-treks-quick__chip${chip.on ? ' is-active' : ''}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-10 pt-5">
          {showBrowseExtras && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Explore Our Top Categories</h2>
              <div
                className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none' }}
              >
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => applyCategoryHref(c.href)}
                    className="relative h-[168px] w-[42vw] max-w-[180px] shrink-0 snap-start overflow-hidden rounded-2xl text-left"
                  >
                    <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <div className="text-[10px] font-semibold text-[#86efac]">{c.countLabel}</div>
                      <div className="mt-0.5 text-[13px] font-bold leading-snug text-white">{c.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {showBrowseExtras && (
            <div className="mb-2 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-3.5">
              <p className="text-[13px] leading-relaxed text-[#14532d]">
                <span className="font-bold">Tip: </span>
                {INFO_BANNERS[1].text}{' '}
                <Link href={INFO_BANNERS[1].href} className="font-semibold underline underline-offset-2">
                  {INFO_BANNERS[1].cta}
                </Link>
              </p>
            </div>
          )}

          <div id="curated-treks" className="scroll-mt-28">
            {isWinterFocus && filterView && !isDesktop && (
              <WinterTreksLanding
                title={filterView.sectionTitle}
                info={filterView.info}
                treks={winterLandingTreks}
                shareHref={filterView.href}
              />
            )}
            {curatedBlocks.map(({ section, treks: sectionTreks }, i) => (
              <div key={section.id}>
                <TrekCuratedSection
                  title={section.title}
                  info={section.info}
                  treks={sectionTreks}
                  layout={curatedLayout(section.id)}
                  onOpen={curatedOnOpen(section)}
                  shareHref={section.href}
                  sectionId={section.id}
                />
                {INFO_BANNERS[i + 1] && i % 2 === 0 && (
                  <div className="my-2 rounded-2xl bg-[#062816] p-3.5 text-[13px] leading-relaxed text-[#dcfce7]">
                    {INFO_BANNERS[(i + 2) % INFO_BANNERS.length].text}{' '}
                    <Link
                      href={INFO_BANNERS[(i + 2) % INFO_BANNERS.length].href}
                      className="font-semibold text-[#86efac] underline underline-offset-2"
                    >
                      {INFO_BANNERS[(i + 2) % INFO_BANNERS.length].cta}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {activeCount > 0 &&
            !isWinterFocus &&
            curatedBlocks.every((b) => b.treks.length === 0) && (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
              <Mountain className="mx-auto mb-2 h-9 w-9 text-gray-300" />
              <p className="text-sm font-semibold text-gray-900">No treks match</p>
              <button type="button" onClick={clearAll} className="mt-3 text-sm font-semibold text-[#16a34a]">
                Reset filters
              </button>
            </div>
          )}

          {/* Help strip */}
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-bold text-gray-900">Need help choosing a trek?</p>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
              Our trek advisors help with fitness, season, and batch dates — {CONTACT.hoursShort}.
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={telUrl()}
                className="it-retro-btn it-retro-btn--primary it-retro-btn--pill it-retro-btn--md flex-1"
              >
                Call {CONTACT.phoneDisplay}
              </a>
              <Link
                href="/contact"
                className="it-retro-btn it-retro-btn--outline it-retro-btn--pill it-retro-btn--md flex-1"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* —— Desktop layout —— */}
      <div className="hidden lg:block">
        <TreksDesktopHero
          year={year}
          title={desktopHeroTitle}
          lead={desktopHeroLead}
          isDefaultHero={isDefaultDesktopHero}
          searchDraft={searchDraft}
          onSearchDraft={setSearchDraft}
          onSubmitSearch={submitSearch}
          onExplore={scrollToTreks}
          trekCount={treks.length}
          treks={treks}
          showPopularPicks={showBrowseExtras}
          headerOffset={DESK_HEADER_H}
        />

        <div className="container mx-auto py-12 pb-16">
          {showBrowseExtras && (
            <section className="mb-10">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#16a34a]">
                    Explore
                  </p>
                  <h2 className="mt-1 text-2xl font-bold leading-tight text-gray-900">
                    Our Top Categories
                  </h2>
                </div>
                <Link
                  href="/special-programs"
                  className="mb-0.5 text-sm font-semibold text-[#16a34a] hover:underline"
                >
                  Special programs →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => applyCategoryHref(c.href)}
                    className="group relative aspect-[4/5] overflow-hidden rounded-2xl text-left"
                  >
                    <img
                      src={c.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#86efac]">
                        {c.countLabel}
                      </div>
                      <div className="mt-0.5 text-sm font-bold leading-snug text-white">{c.title}</div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] text-white/70">{c.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {showBrowseExtras && (
            <div className="mb-9 flex gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-5 lg:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#14532d]">{INFO_BANNERS[0].text}</p>
                <Link
                  href={INFO_BANNERS[0].href}
                  className="mt-1 inline-block text-sm font-semibold text-[#166534] underline underline-offset-2"
                >
                  {INFO_BANNERS[0].cta}
                </Link>
              </div>
            </div>
          )}

          <div className="flex gap-8">
            <aside className="w-[260px] shrink-0 self-stretch">
              <div
                className="it-treks-desk-filters"
                style={{ ['--it-desk-header' as string]: `${DESK_HEADER_H}px` }}
              >
                {filterPanel}
              </div>
            </aside>

            <div id="curated-treks-desktop" className="min-w-0 flex-1 scroll-mt-28">
              {activeCount > 0 && (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-gray-800">
                    {filterView
                      ? `${filtered.length} trek${filtered.length === 1 ? '' : 's'} · ${filterView.sectionTitle}`
                      : `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`}
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[13px] font-semibold text-[#16a34a] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
              <div className="space-y-1">
                {isWinterFocus && filterView && isDesktop && (
                  <WinterTreksLanding
                    title={filterView.sectionTitle}
                    info={filterView.info}
                    treks={winterLandingTreks}
                    shareHref={filterView.href}
                  />
                )}
                {curatedBlocks.map(({ section, treks: sectionTreks }) => (
                  <TrekCuratedSection
                    key={section.id}
                    title={section.title}
                    info={section.info}
                    treks={sectionTreks}
                    layout={curatedLayout(section.id)}
                    onOpen={curatedOnOpen(section)}
                    shareHref={section.href}
                    sectionId={section.id}
                  />
                ))}
              </div>
              {activeCount > 0 &&
                !isWinterFocus &&
                curatedBlocks.every((b) => b.treks.length === 0) && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                  <Mountain className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <h3 className="text-lg font-bold text-gray-900">No treks match these filters</h3>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="it-retro-btn it-retro-btn--primary it-retro-btn--pill it-retro-btn--md mt-5"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TreksWhySection />

      {isWinterFocus && <WinterPackingSection />}
      {isWinterFocus && <WinterSafetySection />}
      {isWinterFocus && <WinterTreksFaq />}

      {isWinterFocus ? (
        <>
          <WinterTreksReviews items={winterTrekReviews} />
          <LandingBlogSection
            kicker="From the blog"
            title="Trek guides & tips"
            items={blogArticles ?? treksArticles}
          />
        </>
      ) : (
        <LandingReviewsBlog
          reviews={{
            kicker: 'Trekker reviews',
            title: 'Stories from the trail',
            intro:
              'Real notes from hikers who summited Kedarkantha, crossed Hampta Pass, and found their first Himalayan views with Indian Treks.',
            items: treksReviews,
          }}
          articles={{
            kicker: 'From the blog',
            title: 'Trek guides & tips',
            items: blogArticles ?? treksArticles,
          }}
        />
      )}

      {mobileFilters && (
        <div className="it-treks-mob-filters fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="it-treks-mob-filters__backdrop absolute inset-0"
            onClick={() => setMobileFilters(false)}
          />
          <div className="it-treks-mob-filters__sheet absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col">
            <div className="it-treks-mob-filters__head flex h-14 shrink-0 items-center justify-between px-4">
              <span>Filter Treks</span>
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                className="it-treks-mob-filters__close rounded-full p-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="it-treks-mob-filters__body flex-1 overflow-y-auto px-4 py-3">
              {filterPanel}
            </div>
            <div className="it-treks-mob-filters__foot safe-area-bottom shrink-0 p-4">
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-white"
              >
                Show {filtered.length} treks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
