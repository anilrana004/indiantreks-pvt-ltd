'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { treks, trekDetailPath, type Trek } from '@/lib/data';
import { getDepartureBatches, parseISODate, type TrekBatch } from '@/lib/batches';
import { blogDate, blogPath, blogThumb, getRelatedPosts, type RelatedPost } from '@/lib/blog';
import { safeImage, trekPhoto } from '@/lib/safe-image';
import { photos } from '@/lib/media';
import { whatsappUrl } from '@/lib/contact';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';
import Banners, { type BannerItem } from '@/components/Banners';
import { HighlightIcon } from '@/components/treks/HighlightIcons';
import {
  addOns,
  bookingPolicyRows,
  cancellationPolicyRows,
  detailTestimonials,
  getPromoBanners,
  getReachSteps,
  getSeasonGuide,
  packingGroups,
  baseCamp,
  buildHighlightSpecs,
} from '@/lib/trek-detail-content';
import {
  GEAR_CATALOG,
  cartForTrek,
  cartSubtotal,
  encodeGearQuery,
  formatGearLines,
  readGearCart,
  removeGearLine,
  subscribeGearCart,
  upsertGearLine,
  type GearCartLine,
  type GearItem,
} from '@/lib/gear-rental';
import GearRentModal from '@/components/rental/GearRentModal';
import type { TrekTestimonial } from '@/lib/content/treks/types';
import { getTrekExtended } from '@/lib/treks/get-trek-extended';
import { getRouteProfile } from '@/lib/treks/get-route-profile';
import { CollapsibleRichBlocks, RichBlocks, TrekExtendedNavItems, TrekRichSectionCard } from '@/components/treks/TrekExtendedSections';
import TrekPackingSection from '@/components/treks/TrekPackingSection';
import TrekWhyChooseSection from '@/components/treks/TrekWhyChooseSection';
import TrekRouteMapSection from '@/components/treks/TrekRouteMapSection';
import TrekAltitudeChartSection from '@/components/treks/TrekAltitudeChartSection';

const TrekFitnessSection = dynamic(() => import('@/components/treks/TrekFitnessSection'), {
  ssr: false,
  loading: () => null,
});
import TrekGuestReviews from '@/components/treks/TrekGuestReviews';
import PackageReviewsSidebar from '@/components/treks/PackageReviewsSidebar';
import { DESK_HEADER_H, MOBILE_HEADER_H, CHROME_HIDDEN_CLASS } from '@/lib/layout';
import './trek-detail.css';

const routeNavLinks = [
  { id: 'route-map', label: 'Map', icon: 'fa-solid fa-map' },
  { id: 'altitude-chart', label: 'Chart', icon: 'fa-solid fa-chart-line' },
];

const NAV_SHORT_LABELS: Record<string, string> = {
  'route-map': 'Map',
  'altitude-chart': 'Chart',
  'inclusion-exclusion': 'Inclusions',
  fitness: 'Fitness',
  safety: 'Safety',
  food: 'Food',
  'why-choose': 'Why choose',
  'things-to-carry': 'Things to pack',
  note: 'Note',
  'how-to-reach': 'How to reach',
  'rent-gear': 'Rent gear',
  'best-time': 'Best time',
  faqs: 'FAQ',
};

function navLinkLabel(id: string, label: string) {
  return NAV_SHORT_LABELS[id] ?? label;
}

const baseNavLinks = [
  { id: 'highlight', label: 'Highlight', icon: 'fa-solid fa-star' },
  { id: 'overview', label: 'Overview', icon: 'fa-regular fa-file-lines' },
  { id: 'itinerary', label: 'Itinerary', icon: 'fa-regular fa-calendar-days' },
  { id: 'inclusion-exclusion', label: 'Inclusion & exclusion', icon: 'fa-solid fa-circle-check' },
  { id: 'best-time', label: 'Best Time', icon: 'fa-regular fa-snowflake' },
  { id: 'things-to-carry', label: 'Things to Carry', icon: 'fa-solid fa-suitcase' },
  { id: 'how-to-reach', label: 'How to Reach', icon: 'fa-solid fa-location-dot' },
  { id: 'policy', label: 'Policy', icon: 'fa-solid fa-shield-halved' },
  { id: 'faqs', label: "FAQ's", icon: 'fa-regular fa-circle-question' },
  { id: 'rent-gear', label: 'Rent a Gear', icon: 'fa-solid fa-suitcase-rolling' },
];

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Roopkund Heaven booking card: pricing tiers surface as occupancy pills. */
const OCCUPANCY_LABEL: Record<string, string> = {
  Economic: 'Triple Sharing',
  Standard: 'Twin Sharing',
  Premium: 'Single Occupancy',
};

function occupancyLabel(tierName: string) {
  return OCCUPANCY_LABEL[tierName] ?? tierName;
}

const DRAG_SCROLL_SKIP = 'button, a, input, select, textarea, label, [role="button"]';

/** Drag-to-scroll for month / date / addon strips (Roopkund Heaven pattern). */
function useDragScroll(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = false;
    let startX = 0;
    let origin = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if ((e.target as HTMLElement).closest(DRAG_SCROLL_SKIP)) {
        active = false;
        moved = false;
        return;
      }
      active = true;
      moved = false;
      startX = e.clientX;
      origin = el.scrollLeft;
      el.classList.add('bk-dragging');
      el.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.scrollLeft = origin - dx;
    };

    const onUp = (e: PointerEvent) => {
      if (!active) {
        moved = false;
        return;
      }
      active = false;
      el.classList.remove('bk-dragging');
      el.releasePointerCapture?.(e.pointerId);
      if (!moved) return;
      window.setTimeout(() => {
        moved = false;
      }, 0);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClickCapture, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, [ref]);
}

/** Maps a difficulty grade onto the level-badge colour classes. */
function levelClass(difficulty: string): 'easy' | 'moderate' | 'difficult' {
  if (/^easy$/i.test(difficulty) || /easy to moderate/i.test(difficulty)) return 'easy';
  if (/difficult/i.test(difficulty)) return 'difficult';
  return 'moderate';
}

const dateTagClass: Record<TrekBatch['status'], string> = {
  available: 'bk-tag-open',
  'filling-fast': 'bk-tag-filling-fast',
  'almost-full': 'bk-tag-limited',
  'sold-out': 'bk-tag-closed',
};

const dateTagLabel: Record<TrekBatch['status'], string> = {
  available: 'Open',
  'filling-fast': 'Filling',
  'almost-full': 'Limited',
  'sold-out': 'Closed',
};

/** Status badges for the fixed-departures card. */
const departureBadge: Record<
  TrekBatch['status'],
  { className: string; label: string; icon: string }
> = {
  available: { className: 'fd-badge--open', label: 'Open', icon: 'fa-solid fa-circle-check' },
  'filling-fast': { className: 'fd-badge--filling', label: 'Filling', icon: 'fa-solid fa-bolt' },
  'almost-full': { className: 'fd-badge--limited', label: 'Few left', icon: 'fa-solid fa-fire' },
  'sold-out': { className: 'fd-badge--full', label: 'Full', icon: 'fa-solid fa-ban' },
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Builds a de-duplicated gallery for the hero grid and lightbox. */
function galleryImages(trek: Trek): string[] {
  const trekImgs = trek.images.map((src) => safeImage(src, trekPhoto(trek.id)));
  const unique = [...new Set(trekImgs.filter(Boolean))];

  if (unique.length >= 3) {
    return unique.slice(0, 20);
  }

  const pool = [
    ...unique,
    safeImage(trek.mapImage, trekPhoto(trek.id)),
    photos.uttarakhand,
    photos.himachal,
    photos.snow,
    photos.nepal,
    photos.chopta,
    photos.triund,
    photos.hampta,
  ];
  return [...new Set(pool)].slice(0, 10);
}

function monthTabMeta(label: string) {
  const [monthName, year = ''] = label.split(' ');
  const idx = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ].indexOf(monthName);
  return {
    short: idx >= 0 ? MONTHS_SHORT[idx] : monthName.slice(0, 3),
    year,
  };
}

function batchDateRange(batch: TrekBatch) {
  const start = parseISODate(batch.startDate);
  const end = parseISODate(batch.endDate);
  return {
    startDay: start.getDate(),
    endDay: end.getDate(),
    startMonth: MONTHS_SHORT[start.getMonth()],
    endMonth: MONTHS_SHORT[end.getMonth()],
    sameMonth: start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear(),
  };
}

/**
 * Fixed departures — month tabs + compact scrollable date list. Syncs with booking.
 */
function FixedDepartures({
  months,
  activeMonth,
  onMonthChange,
  selectedId,
  onPick,
  kindLabel,
  enquiryHref,
}: {
  months: { label: string; items: TrekBatch[] }[];
  activeMonth: string;
  onMonthChange: (label: string) => void;
  selectedId: string | null;
  onPick: (batch: TrekBatch) => void;
  kindLabel: string;
  enquiryHref: string;
}) {
  const monthTabsRef = useRef<HTMLDivElement>(null);
  useDragScroll(monthTabsRef);

  const totalBatches = months.reduce((count, group) => count + group.items.length, 0);
  const openBatches = months.flatMap((group) => group.items.filter((batch) => batch.status !== 'sold-out'));
  const spotlight = openBatches[0] ?? null;
  const activeGroup = months.find((group) => group.label === activeMonth) ?? months[0];
  const visibleItems = activeGroup?.items ?? [];
  const dense = visibleItems.length > 8;

  return (
    <section id="departures" className={`fd-studio${dense ? ' fd-studio--dense' : ''}`} aria-label="Fixed departures">
      <div className="fd-studio__ambient" aria-hidden />
      <div className="fd-studio__panel">
        <header className="fd-studio__head">
          <div className="fd-studio__head-main">
            <span className="fd-studio__eyebrow">
              <i className="fa-solid fa-sparkles" aria-hidden />
              Fixed departures
            </span>
            <h2 className="fd-studio__title">Pick your trail date</h2>
            {totalBatches > 0 && (
              <p className="fd-studio__lede">
                {openBatches.length} open {openBatches.length === 1 ? 'batch' : 'batches'} · {months.length}{' '}
                {months.length === 1 ? 'month' : 'months'}
              </p>
            )}
          </div>
          {totalBatches > 0 && (
            <div className="fd-studio__stats" aria-hidden>
              <div className="fd-studio__stat">
                <strong>{openBatches.length}</strong>
                <span>Open</span>
              </div>
              <div className="fd-studio__stat">
                <strong>{months.length}</strong>
                <span>Months</span>
              </div>
            </div>
          )}
        </header>

        {months.length === 0 ? (
          <div className="fd-studio__empty">
            <div className="fd-studio__empty-art" aria-hidden>
              <i className="fa-regular fa-calendar-xmark" />
            </div>
            <p className="fd-studio__empty-copy">
              Dates for this {kindLabel.toLowerCase()} are being scheduled.{' '}
              <a className="fd-studio__empty-link" href={enquiryHref} target="_blank" rel="noopener noreferrer">
                Ask us for upcoming batches
              </a>
              .
            </p>
          </div>
        ) : (
          <>
            {spotlight && (
              <div className="fd-studio__spotlight">
                <div className="fd-studio__spotlight-copy">
                  <span className="fd-studio__spotlight-kicker">Next departure</span>
                  <p className="fd-studio__spotlight-date">
                    {spotlight.weekday}, {spotlight.label}
                  </p>
                  <span className="fd-studio__spotlight-seats">
                    {spotlight.seatsLeft} seats left
                  </span>
                </div>
                <button
                  type="button"
                  className={`fd-studio__spotlight-btn${selectedId === spotlight.id ? ' is-selected' : ''}`}
                  onClick={() => onPick(spotlight)}
                  aria-pressed={selectedId === spotlight.id}
                >
                  {selectedId === spotlight.id ? (
                    <>
                      <i className="fa-solid fa-circle-check" aria-hidden />
                      Selected
                    </>
                  ) : (
                    <>
                      Select
                      <i className="fa-solid fa-arrow-right" aria-hidden />
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="fd-studio__months-wrap">
              <div className="fd-studio__months" ref={monthTabsRef} role="tablist" aria-label="Departure months">
                {months.map((group) => {
                  const tab = monthTabMeta(group.label);
                  const openCount = group.items.filter((batch) => batch.status !== 'sold-out').length;
                  const active = activeGroup?.label === group.label;

                  return (
                    <button
                      type="button"
                      key={group.label}
                      role="tab"
                      aria-selected={active}
                      className={`fd-studio__month${active ? ' is-active' : ''}`}
                      onClick={() => onMonthChange(group.label)}
                    >
                      <span className="fd-studio__month-short">{tab.short}</span>
                      <span className="fd-studio__month-year">{tab.year}</span>
                      <span className="fd-studio__month-count">{openCount || group.items.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="fd-studio__grid-shell">
              <div className="fd-studio__grid" role="tabpanel">
                {visibleItems.map((batch) => {
                  const badge = departureBadge[batch.status];
                  const full = batch.status === 'sold-out';
                  const selected = selectedId === batch.id;
                  const range = batchDateRange(batch);

                  return (
                    <button
                      type="button"
                      key={batch.id}
                      className={`fd-studio__tile${selected ? ' is-selected' : ''}${full ? ' is-full' : ''}`}
                      onClick={() => onPick(batch)}
                      disabled={full}
                      aria-pressed={selected}
                      aria-label={
                        full ? `${batch.label} — batch full` : `Select departure ${batch.label}`
                      }
                    >
                      {selected && (
                        <span className="fd-studio__tile-check" aria-hidden>
                          <i className="fa-solid fa-check" />
                        </span>
                      )}

                      <span className="fd-studio__tile-weekday">{batch.weekday}</span>

                      <span className="fd-studio__tile-dates" aria-hidden>
                        <span className="fd-studio__tile-day">{range.startDay}</span>
                        <span className="fd-studio__tile-sep">
                          <i className="fa-solid fa-arrow-right" />
                        </span>
                        <span className="fd-studio__tile-day fd-studio__tile-day--end">{range.endDay}</span>
                        <span className="fd-studio__tile-month">
                          {range.sameMonth
                            ? range.startMonth
                            : `${range.startMonth}–${range.endMonth}`}
                        </span>
                      </span>

                      <span className={`fd-studio__tile-status fd-studio__tile-status--${batch.status}`}>
                        <i className={badge.icon} aria-hidden />
                        <span className="fd-studio__tile-status-label">{badge.label}</span>
                      </span>

                      {!full && (
                        <span className="fd-studio__tile-seats">{batch.seatsLeft} left</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {dense ? (
                <p className="fd-studio__grid-hint" aria-hidden>
                  Scroll for more dates in {activeGroup?.label}
                </p>
              ) : null}
            </div>
          </>
        )}

        <footer className="fd-studio__foot">
          <i className="fa-solid fa-route fd-studio__foot-icon" aria-hidden />
          <span>Your date syncs to booking instantly.</span>
        </footer>
      </div>
    </section>
  );
}

/** Latest blog posts, shown beside the departures card on wide screens. */
function BlogSidebar({ posts }: { posts: RelatedPost[] }) {
  if (posts.length === 0) return null;

  return (
    <aside className="bl-card" aria-label="From the blog">
      <div className="bl-header">
        <i className="fa-regular fa-newspaper" aria-hidden /> From the Blog
      </div>

      <div className="bl-list">
        {posts.map((post) => (
          <Link
            className={`bl-item${post.related ? ' is-related' : ''}`}
            href={blogPath(post.slug)}
            key={post.slug}
          >
            <span className="bl-thumb relative">
              <Image
                src={blogThumb(post.image)}
                alt=""
                fill
                sizes="58px"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </span>
            <span className="bl-body">
              <span className="bl-title">{post.title}</span>
              <span className="bl-meta">
                {post.related && <span className="bl-badge">Related</span>}
                <i className="fa-regular fa-calendar" aria-hidden /> {blogDate(post.publishedAt)}
                <span className="bl-dot" aria-hidden />
                <i className="fa-regular fa-clock" aria-hidden /> {post.read}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <Link className="bl-footer" href="/blog">
        Read all stories <i className="fa-solid fa-arrow-right" aria-hidden />
      </Link>
    </aside>
  );
}

function paragraphs(text: string): string[] {
  // Split on blank lines or real sentence ends — not abbreviations like Mt. / Dr. / St.
  return text
    .split(/\n{2,}|(?<!\b(?:Mt|Mr|Mrs|Ms|Dr|St|No|vs|approx|etc))\.\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`));
}

/** Section titles in itinerary copy — e.g. "Key Highlights Along the Route:" */
function isItineraryHeading(part: string): boolean {
  return /^[^:\n]{2,90}:\s*$/.test(part.trim());
}

/** Labelled lead lines that should use a heading + body — e.g. "Route: Dehradun → …" */
function splitItineraryLead(part: string): { heading: string; body: string } | null {
  const match = part.trim().match(/^(Route):\s*(.+)$/i);
  if (!match) return null;
  return { heading: match[1], body: match[2].trim() };
}

function ItineraryDescription({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((part, index) => {
        const trimmed = part.trim();
        if (!trimmed) return null;
        if (isItineraryHeading(trimmed)) {
          return (
            <h3 className="kg-acc-heading" key={`h-${index}-${trimmed.slice(0, 24)}`}>
              {trimmed.replace(/:\s*$/, '')}
            </h3>
          );
        }
        const lead = splitItineraryLead(trimmed);
        if (lead) {
          return (
            <div className="kg-acc-lead" key={`lead-${index}-${lead.heading}`}>
              <h3 className="kg-acc-heading">{lead.heading}</h3>
              <p>{lead.body}</p>
            </div>
          );
        }
        return <p key={`p-${index}-${trimmed.slice(0, 24)}`}>{trimmed}</p>;
      })}
    </>
  );
}

export default function TrekDetailContent({
  trek,
  type,
  initialGuests = 1,
  relatedBlogPosts,
  promoBanners,
}: {
  trek: Trek;
  type: 'trek' | 'yatra' | 'trip';
  initialGuests?: number;
  relatedBlogPosts?: RelatedPost[];
  /** Server-computed promo strips — keeps SSR and client hydration in sync */
  promoBanners?: [BannerItem[], BannerItem[], BannerItem[]];
}) {
  const router = useRouter();
  const isYatra = type === 'yatra';
  const isTrip = type === 'trip';
  const isInternational = trek.region === 'nepal' || trek.region === 'kashmir';
  const kindLabel = isYatra
    ? 'Yatra'
    : isTrip
      ? isInternational
        ? 'International Trip'
        : 'Trip'
      : isInternational
        ? 'International Trek'
        : 'Trek';
  const listHref = isYatra ? '/yatra' : isTrip ? '/trips' : '/treks';

  const extended = useMemo(() => getTrekExtended(trek), [trek]);
  const routeProfile = useMemo(() => getRouteProfile(trek, extended), [trek, extended]);
  /** Sticky nav — content sections only (dates live in hero departures band). */
  const navLinks = useMemo(() => {
    const beforeInclusion = baseNavLinks.slice(0, 3);
    const inclusionLink = baseNavLinks.slice(3, 4);
    const bestTimeLink = baseNavLinks.slice(4, 5);
    const carryLink = baseNavLinks.slice(5, 6);
    const reachLink = baseNavLinks.slice(6, 7);
    const policyFaqLinks = baseNavLinks.slice(7, 9);
    const rentGearLink = baseNavLinks.slice(9);

    const midPageSections = extended?.sections
      ? TrekExtendedNavItems(
          extended.sections.filter((section) => ['fitness', 'safety', 'food'].includes(section.id)),
        )
      : [];

    const whyChooseNav = extended?.sections
      ? TrekExtendedNavItems(extended.sections.filter((section) => section.id === 'why-choose'))
      : [];

    const noteNav = extended?.noteSection
      ? [{ id: 'note', label: 'Note', icon: 'fa-regular fa-sticky-note' }]
      : [];

    return [
      ...beforeInclusion,
      ...routeNavLinks,
      ...inclusionLink,
      ...midPageSections,
      ...bestTimeLink,
      ...carryLink,
      ...noteNav,
      ...reachLink,
      ...policyFaqLinks,
      ...whyChooseNav,
      ...rentGearLink,
    ];
  }, [extended]);

  const images = useMemo(() => galleryImages(trek), [trek]);
  const heroImage = images[0] ?? trekPhoto(trek.id);
  const sideImageA = images[1] ?? heroImage;
  const sideImageB = images[2] ?? heroImage;
  const batches = useMemo(() => getDepartureBatches(trek, 4, 3), [trek]);
  const seasons = useMemo(() => getSeasonGuide(trek), [trek]);
  const reachSteps = useMemo(
    () => extended?.reachSteps ?? getReachSteps(trek),
    [extended, trek],
  );
  const carryGroups = extended?.packingGroups ?? packingGroups;
  const pageTestimonials: TrekTestimonial[] =
    extended?.testimonials ??
    detailTestimonials.map((item) => ({
      name: item.name,
      text: item.text,
    }));
  const [nearbyPromo, offersPromo, topRatedPromo] = useMemo(
    () => promoBanners ?? getPromoBanners(trek),
    [promoBanners, trek],
  );
  const relatedPosts = useMemo(
    () => relatedBlogPosts ?? getRelatedPosts(trek, 3),
    [relatedBlogPosts, trek],
  );
  const baseOverviewParas = useMemo(() => {
    const base = [...paragraphs(trek.brief), ...paragraphs(trek.description)];
    if (extended?.overviewExtra?.length) {
      return base.filter((para) => !/^Key highlights/i.test(para));
    }
    return base;
  }, [trek, extended]);
  const collapsedOverviewBlocks = useMemo(
    () => extended?.overviewExtra?.slice(0, 9) ?? [],
    [extended],
  );

  const related = useMemo(
    () =>
      treks
        .filter((t) => t.id !== trek.id && (t.region === trek.region || t.type === trek.type))
        .slice(0, 8),
    [trek],
  );

  // ---- UI state -----------------------------------------------------------
  const [activeSection, setActiveSection] = useState('highlight');
  const [stuck, setStuck] = useState(false);
  const [trackFade, setTrackFade] = useState({ left: false, right: false });
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set([1]));
  const [routeSelection, setRouteSelection] = useState<
    import('@/types/trek-map').MapSelection
  >('overview');
  const [routeProfileFocusKm, setRouteProfileFocusKm] = useState<number | null>(null);
  const [policyTab, setPolicyTab] = useState<'booking' | 'cancellation'>('booking');
  const [faqQuery, setFaqQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [slide, setSlide] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // ---- Booking state ------------------------------------------------------
  const [tierName, setTierName] = useState(trek.pricing[0]?.name ?? 'Economic');
  const pickupOptions = useMemo(() => {
    const raw = (trek.startEndPoint || trek.location || '').trim();
    const parts = raw
      .split(/\s+to\s+/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2 && parts[0].toLowerCase() !== parts[1].toLowerCase()) {
      return [...new Set(parts)];
    }
    return [...new Set([parts[0] || trek.state, baseCamp(trek)].filter(Boolean))];
  }, [trek]);
  const [pickup, setPickup] = useState(pickupOptions[0] ?? trek.state);
  const months = useMemo(() => [...new Set(batches.map((b) => b.monthLabel))], [batches]);
  const [month, setMonth] = useState(() => months[0] ?? '');
  const monthBatches = useMemo(
    () => batches.filter((b) => b.monthLabel === month),
    [batches, month],
  );
  const [batchId, setBatchId] = useState<string | null>(() => {
    const label = months[0] ?? '';
    if (!label) return null;
    const inMonth = batches.filter((b) => b.monthLabel === label);
    return inMonth.find((b) => b.status !== 'sold-out')?.id ?? inMonth[0]?.id ?? null;
  });
  /** Months grouped for the fixed-departures accordion (same batches as the booking card). */
  const departureMonths = useMemo(
    () =>
      months
        .map((label) => ({ label, items: batches.filter((b) => b.monthLabel === label) }))
        .filter((group) => group.items.length > 0),
    [batches, months],
  );
  const [dateToast, setDateToast] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const shareToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [men, setMen] = useState(() => Math.min(20, Math.max(1, Math.floor(initialGuests) || 1)));
  const [women, setWomen] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [gearLines, setGearLines] = useState<GearCartLine[]>([]);
  const [pickingGear, setPickingGear] = useState<GearItem | null>(null);

  /** Prefer ?guests= from the URL without forcing the page into dynamic SSR. */
  useEffect(() => {
    try {
      const guests = Number(new URLSearchParams(window.location.search).get('guests') || '');
      if (Number.isFinite(guests) && guests >= 1) {
        setMen(Math.min(20, Math.floor(guests)));
      }
    } catch {
      /* ignore */
    }
  }, [trek.id]);

  useEffect(() => {
    const refresh = () => setGearLines(cartForTrek(trek.id, readGearCart()));
    refresh();
    return subscribeGearCart(refresh);
  }, [trek.id]);

  const tier = trek.pricing.find((p) => p.name === tierName) ?? trek.pricing[0];
  const basePrice = tier?.price ?? 0;
  /** City / gateway pickup (2nd pill) adds transport — Roopkund Heaven pattern. */
  const pickupSurcharge =
    pickupOptions.length > 1 && pickup === pickupOptions[1] ? 2000 : 0;
  const unitPrice = basePrice + pickupSurcharge;
  const persons = Math.max(1, men + women);
  const addOnTotal = addOns
    .filter((a) => picked.has(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const gearTotal = cartSubtotal(gearLines);
  const total = unitPrice * persons + addOnTotal * persons + gearTotal;

  const monthsRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  useDragScroll(monthsRef);
  useDragScroll(datesRef);
  const startingPrice = Math.min(...trek.pricing.map((p) => p.price));

  const selectedBatch = useMemo(
    () => (batchId ? batches.find((b) => b.id === batchId) ?? null : null),
    [batchId, batches],
  );

  /** Month tab — always move month + date together so effects never fight. */
  const selectMonth = useCallback(
    (label: string) => {
      setMonth(label);
      const inMonth = batches.filter((b) => b.monthLabel === label);
      const firstOpen = inMonth.find((b) => b.status !== 'sold-out') ?? inMonth[0];
      setBatchId(firstOpen?.id ?? null);
    },
    [batches],
  );

  // Reset departure picks when the trek changes (not on every month/date click).
  useEffect(() => {
    if (!months.length) {
      setMonth('');
      setBatchId(null);
      return;
    }
    const label = months[0];
    setMonth(label);
    const inMonth = batches.filter((b) => b.monthLabel === label);
    const firstOpen = inMonth.find((b) => b.status !== 'sold-out') ?? inMonth[0];
    setBatchId(firstOpen?.id ?? null);
  }, [trek.id]); // batches/months are derived from trek — read fresh when id changes

  // If the active month/date fell into the past (or emptied), snap to the next upcoming group.
  useEffect(() => {
    if (!months.length) {
      if (month) setMonth('');
      if (batchId) setBatchId(null);
      return;
    }
    if (!months.includes(month)) {
      selectMonth(months[0]);
      return;
    }
    if (batchId && !batches.some((b) => b.id === batchId)) {
      const inMonth = batches.filter((b) => b.monthLabel === month);
      const firstOpen = inMonth.find((b) => b.status !== 'sold-out') ?? inMonth[0];
      setBatchId(firstOpen?.id ?? null);
    }
  }, [batches, batchId, month, months, selectMonth]);

  // ---- Sticky section nav -------------------------------------------------
  // Roopkund Heaven flow: site chrome hides on scroll-down / shows on scroll-up.
  // Section nav parks under the chrome when visible, and at the top when hidden.
  const shellRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navTrackRef = useRef<HTMLDivElement>(null);
  const bookingStickyRef = useRef<HTMLDivElement>(null);
  const addonTapRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const departuresRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateTrackFade = useCallback(() => {
    const el = navTrackRef.current;
    if (!el) return;
    setTrackFade({
      left: el.scrollLeft > 6,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 6,
    });
  }, []);

  useDragScroll(navTrackRef);

  const headerOffset = useCallback(() => {
    const chromeHidden = document.documentElement.classList.contains(CHROME_HIDDEN_CLASS);
    if (window.innerWidth >= 1024) {
      return chromeHidden ? 0 : DESK_HEADER_H;
    }
    return chromeHidden ? 0 : MOBILE_HEADER_H;
  }, []);

  /** Roopkund flow: when site header is visible it covers the section nav (same top: 0). */
  const fixedChromeHeight = useCallback(
    (navHeight: number) => {
      const chromeHidden = document.documentElement.classList.contains(CHROME_HIDDEN_CLASS);
      return chromeHidden ? navHeight : headerOffset();
    },
    [headerOffset],
  );

  const syncStickyMetrics = useCallback(() => {
    const shell = shellRef.current;
    const nav = navRef.current;
    if (!shell || !nav) return;
    const h = nav.offsetHeight;
    // Lock placeholder height while stuck so header show/hide never shifts content.
    const isNavStuck = shell.getBoundingClientRect().top <= 0;
    const prev = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--kg-sticky-nav-h'),
    );
    const stable = isNavStuck && Number.isFinite(prev) && prev > 0 ? Math.max(h, prev) : h;
    shell.style.height = `${stable}px`;
    document.documentElement.style.setProperty('--kg-sticky-nav-h', `${h}px`);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    syncStickyMetrics();
    const ro = new ResizeObserver(syncStickyMetrics);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [stuck, syncStickyMetrics]);

  useEffect(() => {
    const el = navTrackRef.current;
    if (!el) return;
    updateTrackFade();
    el.addEventListener('scroll', updateTrackFade, { passive: true });
    const ro = new ResizeObserver(updateTrackFade);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateTrackFade);
      ro.disconnect();
    };
  }, [navLinks, stuck, updateTrackFade]);

  /** Keep active tab visible while scrolling long nav lists. */
  useEffect(() => {
    const track = navTrackRef.current;
    if (!track) return;
    const active = track.querySelector<HTMLElement>('.kg-sticky-link.is-active');
    if (!active) return;
    const left = active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [activeSection, stuck]);

  useEffect(() => {
    const sections = navLinks
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => !!el);

    let frame = 0;
    let isStuck = false;

    const update = () => {
      frame = 0;
      const shell = shellRef.current;
      const nav = navRef.current;
      if (!shell || !nav) return;

      isStuck = shell.getBoundingClientRect().top <= 0;
      setStuck(isStuck);
      syncStickyMetrics();

      const booking = bookingStickyRef.current;
      if (booking) {
        const topPx = fixedChromeHeight(nav.offsetHeight) + 18;
        if (window.innerWidth <= 1023) {
          booking.style.removeProperty('top');
          booking.style.removeProperty('--kg-booking-max');
        } else {
          booking.style.top = `${topPx}px`;
          const maxPx = Math.max(360, window.innerHeight - topPx - 24);
          booking.style.setProperty('--kg-booking-max', `${maxPx}px`);
        }
      }

      if (sections.length) {
        const chromePad = isStuck ? fixedChromeHeight(nav.offsetHeight) + 12 : 150;
        const checkpoint = window.scrollY + chromePad;
        let current = sections[0].id;
        for (const section of sections) {
          if (section.getBoundingClientRect().top + window.scrollY <= checkpoint) {
            current = section.id;
          }
        }
        setActiveSection(current);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const mo = new MutationObserver(onScroll);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mo.disconnect();
    };
  }, [navLinks, headerOffset, fixedChromeHeight, syncStickyMetrics]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Keep the active pill centered in the scrollable track.
  useEffect(() => {
    const track = navTrackRef.current;
    if (!track || track.scrollWidth <= track.clientWidth + 1) return;
    track
      .querySelector('.kg-sticky-link.is-active')
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    updateTrackFade();
  }, [activeSection, updateTrackFade]);

  // ---- Lightbox keyboard --------------------------------------------------
  const step = useCallback(
    (delta: number) => {
      setLightbox((cur) => (cur === null ? cur : (cur + delta + images.length) % images.length));
    },
    [images.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, step]);

  // ---- Mobile slider ------------------------------------------------------
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSlide((current) => (images.length === 0 ? 0 : Math.min(current, images.length - 1)));
    setLightbox((current) =>
      current === null || images.length === 0 ? current : Math.min(current, images.length - 1),
    );
  }, [images.length]);

  const goToSlide = (index: number) => {
    const track = mobileTrackRef.current;
    if (!track || images.length === 0) return;
    const next = Math.max(0, Math.min(index, images.length - 1));
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    setSlide(next);
  };

  const onMobileScroll = () => {
    const track = mobileTrackRef.current;
    if (!track || track.clientWidth <= 0 || images.length === 0) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    setSlide(Math.max(0, Math.min(next, images.length - 1)));
  };

  // ---- Gear carousel ------------------------------------------------------
  const gearRef = useRef<HTMLDivElement>(null);

  const nudge = (ref: React.RefObject<HTMLDivElement | null>, dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  // ---- Actions ------------------------------------------------------------
  const goToSection = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const navH = navRef.current?.offsetHeight ?? 56;
      const offset = fixedChromeHeight(navH);
      const top = el.getBoundingClientRect().top + window.scrollY - offset - 10;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    },
    [fixedChromeHeight],
  );

  /** Fixed-departures row → sync booking card + mobile book bar without scroll jump. */
  const pickDeparture = useCallback((batch: TrekBatch, opts?: { scrollToBooking?: boolean; silent?: boolean }) => {
    if (batch.status === 'sold-out') return;
    setMonth(batch.monthLabel);
    setBatchId(batch.id);

    if (!opts?.silent) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setDateToast(`${batch.weekday}, ${batch.label}`);
      toastTimerRef.current = setTimeout(() => setDateToast(null), 3400);
    }

    if (opts?.scrollToBooking) {
      goToSection('booking-form');
    }
  }, [goToSection]);

  const bookingHref = () => {
    const params = new URLSearchParams({ pkg: tierName });
    if (selectedBatch) params.set('date', selectedBatch.startDate);
    params.set('persons', String(persons));
    params.set('men', String(men));
    params.set('women', String(women));
    params.set('pickup', pickup);
    if (pickupSurcharge) params.set('pickupFee', String(pickupSurcharge));
    if (picked.size) params.set('addons', [...picked].join(','));
    if (gearLines.length) params.set('gear', encodeGearQuery(gearLines));
    params.set('total', String(total));
    return `/booking/${trek.id}?${params.toString()}`;
  };

  const enquire = () => {
    const lines = [
      `Hi Indian Treks! I'd like details for ${trek.title} (${trek.duration}).`,
      `Occupancy: ${occupancyLabel(tierName)}`,
      selectedBatch ? `Preferred date: ${selectedBatch.label}` : '',
      `Travellers: ${persons} (Men ${men}, Women ${women})`,
      `Pickup: ${pickup}`,
      picked.size
        ? `Add-ons: ${addOns.filter((a) => picked.has(a.id)).map((a) => `${a.name} (₹${(a.price * persons).toLocaleString()})`).join(', ')}`
        : '',
      gearLines.length ? `Rental gear: ${formatGearLines(gearLines)} (${inr(gearTotal)})` : '',
    ].filter(Boolean);
    window.open(whatsappUrl(lines.join('\n')), '_blank', 'noopener,noreferrer');
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: trek.title, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      if (shareToastTimerRef.current) clearTimeout(shareToastTimerRef.current);
      shareToastTimerRef.current = setTimeout(() => setShareToast(false), 2800);
    } catch {
      /* dismissed or blocked */
    }
  };

  const toggleDay = (day: number) => {
    setRouteSelection(day);
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const focusDayOnMap = useCallback(
    (day: number) => {
      setRouteSelection(day);
      setOpenDays((prev) => new Set(prev).add(day));
      goToSection('route-map');
    },
    [goToSection],
  );

  // Keep itinerary accordion in sync when map / altitude day changes.
  useEffect(() => {
    if (typeof routeSelection === 'number') {
      setOpenDays((prev) => {
        if (prev.has(routeSelection)) return prev;
        return new Set(prev).add(routeSelection);
      });
    }
  }, [routeSelection]);

  const toggleAddOn = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onAddonPointerDown = (id: string, e: React.PointerEvent<HTMLButtonElement>) => {
    addonTapRef.current = { id, x: e.clientX, y: e.clientY };
  };

  const onAddonPointerUp = (id: string, e: React.PointerEvent<HTMLButtonElement>) => {
    const start = addonTapRef.current;
    addonTapRef.current = null;
    if (!start || start.id !== id) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx > 12 || dy > 12) return;
    toggleAddOn(id);
  };

  const removeGearFromBooking = (gearId: string) => {
    removeGearLine(gearId, trek.id);
  };

  const highlightSpecs = useMemo(
    () => buildHighlightSpecs(trek, kindLabel, extended),
    [trek, kindLabel, extended],
  );

  const faqs = trek.faq.filter((f) => {
    const q = faqQuery.trim().toLowerCase();
    if (!q) return true;
    return `${f.q} ${f.a}`.toLowerCase().includes(q);
  });

  const cancellationPolicySection = extended?.cancellationPolicySection;
  const policyRows =
    policyTab === 'booking'
      ? extended?.bookingPolicyRows ?? bookingPolicyRows
      : extended?.cancellationPolicyRows ?? cancellationPolicyRows;
  const policyHead =
    policyTab === 'booking' ? ['Policy Point', 'Details'] : ['Cancellation Window', 'Charge / Refund'];

  return (
    <div className="kg-page">
      <div className="kg-wrap">
        <nav className="kg-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <i className="fa-solid fa-chevron-right" aria-hidden />
          <Link href={listHref}>{isYatra ? 'Yatras' : 'Treks'}</Link>
          <i className="fa-solid fa-chevron-right" aria-hidden />
          <span>{trek.title}</span>
        </nav>

        {/* Desktop gallery */}
        <section className="kg-gallery">
          <div
            className="kg-main"
            role="button"
            tabIndex={0}
            onClick={() => setLightbox(0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLightbox(0);
              }
            }}
          >
            <Image
              src={heroImage}
              alt={trek.title}
              fill
              priority
              sizes="(max-width:900px) 100vw, 65vw"
              placeholder="blur"
              blurDataURL={STOREFRONT_BLUR_DATA_URL}
              referrerPolicy="no-referrer"
              className="object-cover"
            />
            <div className="kg-overlay-top">
              <div className="kg-tags">
                <span className="kg-tag">
                  <i className="fa-regular fa-star" aria-hidden /> {trek.badge || 'Best Rated'}
                </span>
                <span className="kg-tag">{trek.difficulty}</span>
              </div>
              <button
                type="button"
                className="kg-share"
                aria-label="Share this trek"
                onClick={(e) => {
                  e.stopPropagation();
                  void share();
                }}
              >
                <i className="fa-solid fa-share-from-square" aria-hidden />
              </button>
            </div>
            <div className="kg-overlay-bottom">
              <span className="kg-view-btn">
                <i className="fa-regular fa-images" aria-hidden /> View Photos
              </span>
            </div>
          </div>

          <div className="kg-side">
            <button type="button" className="kg-side-card" onClick={() => setLightbox(1)}>
              <Image
                src={sideImageA}
                alt={`${trek.title} photo 2`}
                fill
                sizes="(max-width:900px) 50vw, 35vw"
                placeholder="blur"
                blurDataURL={STOREFRONT_BLUR_DATA_URL}
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </button>
            <button type="button" className="kg-side-card" onClick={() => setLightbox(2)}>
              <Image
                src={sideImageB}
                alt={`${trek.title} photo 3`}
                fill
                sizes="(max-width:900px) 50vw, 35vw"
                placeholder="blur"
                blurDataURL={STOREFRONT_BLUR_DATA_URL}
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              {images.length > 3 && <span className="kg-more-overlay">+{images.length - 3} More</span>}
            </button>
          </div>
        </section>

        {/* Mobile gallery */}
        <div className="kg-mobile">
          <div className="kg-mobile-stage">
            <div className="kg-mobile-track" ref={mobileTrackRef} onScroll={onMobileScroll}>
              {images.map((src, i) => (
                <div className="kg-mobile-slide" key={`kg-slide-${i}`}>
                  <button type="button" className="kg-main" onClick={() => setLightbox(i)}>
                    <Image
                      src={src}
                      alt={`${trek.title} photo ${i + 1}`}
                      fill
                      priority={i === 0}
                      sizes="100vw"
                      placeholder="blur"
                      blurDataURL={STOREFRONT_BLUR_DATA_URL}
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="kg-mobile-thumbs">
              {images.slice(0, 4).map((src, i) => (
                <button
                  type="button"
                  key={`kg-thumb-${i}`}
                  className={`kg-mobile-thumb${slide === i ? ' is-active' : ''}`}
                  aria-label={`Go to photo ${i + 1}`}
                  onClick={() => goToSlide(i)}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="72px"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  {i === 3 && images.length > 4 && (
                    <span className="kg-mobile-thumb-more">+{images.length - 4}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="kg-mobile-dots">
              {images.map((_, i) => (
                <button
                  type="button"
                  key={`kg-dot-${i}`}
                  className={`kg-mobile-dot${slide === i ? ' is-active' : ''}`}
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => goToSlide(i)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="kg-departures" ref={departuresRef}>
          <FixedDepartures
            months={departureMonths}
            activeMonth={month}
            onMonthChange={selectMonth}
            selectedId={batchId}
            onPick={pickDeparture}
            kindLabel={kindLabel}
            enquiryHref={whatsappUrl(`Hi Indian Treks! When is the next ${trek.title} batch?`)}
          />
          <div className="kg-departures-aside">
            <BlogSidebar posts={relatedPosts} />
            <PackageReviewsSidebar packageId={trek.id} kindLabel={kindLabel} />
          </div>
        </div>
      </div>

      {/* Section nav — single scrollable row (Roopkund Heaven flow) */}
      <div className="kg-sticky-shell" ref={shellRef}>
        <nav
          className={`kg-sticky-nav${stuck ? ' is-stuck' : ''}`}
          aria-label="Sections"
          ref={navRef}
        >
          <div className="kg-sticky-panel">
            <div
              className={`kg-sticky-track-wrap${trackFade.left ? ' can-scroll-left' : ''}${trackFade.right ? ' can-scroll-right' : ''}`}
            >
              <div className="kg-sticky-track" ref={navTrackRef}>
                {navLinks.map((link) => (
                  <button
                    type="button"
                    key={link.id}
                    className={`kg-sticky-link${activeSection === link.id ? ' is-active' : ''}`}
                    onClick={() => goToSection(link.id)}
                  >
                    <i className={link.icon} aria-hidden />
                    <span>{navLinkLabel(link.id, link.label)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className="kg-main-layout">
        <article className="kg-content">
          {/* Highlight */}
          <section id="highlight" className="kg-section">
            <div className="kg-highlight-card">
              <div className="kg-highlight-head">
                <div>
                  <span className="kg-highlight-kicker">
                    <i className="fa-solid fa-bolt" aria-hidden /> {kindLabel} Highlights
                  </span>
                  <h2>Highlight</h2>
                </div>
              </div>

              <div className="kg-highlight-grid">
                {highlightSpecs.map((spec) => {
                  const valueClass = spec.href || spec.sectionId ? 'kg-highlight-value is-link' : 'kg-highlight-value';
                  const valueContent = spec.href ? (
                    <Link href={spec.href} className={valueClass}>
                      {spec.value}
                    </Link>
                  ) : spec.sectionId ? (
                    <button
                      type="button"
                      className={valueClass}
                      onClick={() => goToSection(spec.sectionId!)}
                    >
                      {spec.value}
                    </button>
                  ) : (
                    <span className={valueClass}>{spec.value}</span>
                  );

                  return (
                    <div className="kg-highlight-item" key={spec.id}>
                      <div className={`kg-highlight-icon kg-highlight-icon--${spec.tone}`} aria-hidden>
                        <HighlightIcon id={spec.id} />
                      </div>
                      <div className="kg-highlight-meta">
                        <strong>{spec.label}</strong>
                        {valueContent}
                      </div>
                    </div>
                  );
                })}
              </div>

              {extended?.departure?.notes?.length ? (
                <div className="kg-highlight-notes" aria-label="Departure notes">
                  {extended.departure.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              ) : null}

              <div className="kg-highlight-more">
                <div className="kg-highlight-more-copy">
                  {(highlightOpen ? trek.highlights : trek.highlights.slice(0, 3)).map((h) => (
                    <p key={h}>{h}</p>
                  ))}
                </div>
                {trek.highlights.length > 3 && (
                  <div className="kg-highlight-more-actions">
                    <button
                      type="button"
                      className="kg-highlight-more-btn"
                      onClick={() => setHighlightOpen((v) => !v)}
                    >
                      {highlightOpen ? 'Read Less' : 'Read More'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Overview */}
          <section id="overview" className="kg-section">
            <div className={`kg-overview-card${overviewOpen ? ' is-expanded' : ' is-collapsed'}`}>
              <div className="kg-overview-head">
                <div>
                  <span className="kg-overview-kicker">
                    <i className="fa-regular fa-file-lines" aria-hidden /> {kindLabel} Overview
                  </span>
                  <h1>{trek.title}</h1>
                  <p>{trek.subtitle}</p>
                </div>
              </div>

              <div className="kg-overview-grid">
                <div className="kg-overview-copy">
                  <div className="kg-overview-text">
                    {baseOverviewParas.map((para, index) => (
                      <p key={para} className={index === 0 ? 'kg-overview-lead' : undefined}>
                        {para}
                      </p>
                    ))}
                    {extended?.overviewExtra?.length ? (
                      <div className="kg-extended-rich">
                        <RichBlocks
                          blocks={overviewOpen ? extended.overviewExtra : collapsedOverviewBlocks}
                        />
                      </div>
                    ) : null}
                    {!extended?.overviewExtra?.length ? (
                      <>
                        <p>
                          The route runs {trek.startEndPoint}, covering {trek.distance} across{' '}
                          {trek.days} days with a highest point of {trek.maxAltitude}. It is graded{' '}
                          {trek.difficulty.toLowerCase()}, which makes it a strong fit for travellers who
                          are comfortable walking a full day but do not need prior technical experience.
                        </p>
                        <p>
                          Departures run in fixed monthly batches of {trek.groupSize}, led by certified
                          trip captains carrying a first-aid kit and oxygen on the high sections. The best
                          window is {trek.bestSeason}.
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="kg-overview-points">
                  <h3>{overviewOpen ? 'Key highlights' : 'Why travellers love it'}</h3>
                  {(overviewOpen ? trek.highlights : trek.highlights.slice(0, 4)).map((h, index) => (
                    <div className="kg-overview-point" key={h}>
                      <span className="kg-overview-point-index" aria-hidden>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kg-overview-footer">
                <div className="kg-overview-actions">
                  <button
                    type="button"
                    className="kg-overview-btn kg-overview-btn-primary"
                    onClick={() => setOverviewOpen((open) => !open)}
                  >
                    {overviewOpen ? 'Read Less' : 'Read More'}
                  </button>
                  <button
                    type="button"
                    className="kg-overview-btn kg-overview-btn-soft"
                    onClick={() => goToSection('itinerary')}
                  >
                    See Itinerary
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Itinerary */}
          <section id="itinerary" className="kg-section">
            <div className="kg-itinerary-card">
              <div className="kg-itinerary-head">
                <span className="kg-itinerary-kicker">
                  <i className="fa-solid fa-route" aria-hidden /> Itinerary
                </span>
                <h2>Day wise plan</h2>
                <div>
                  <p>
                    A complete day-wise plan for {trek.title} covering drives, trail sections,
                    altitude gain, meals, and overnight stays from start to finish.
                  </p>
                </div>
              </div>

              <div className="kg-accordion">
                {trek.itinerary.map((day) => {
                  const open = openDays.has(day.day);
                  const facts = [
                    day.distance && { icon: 'fa-solid fa-person-hiking', label: 'Distance', value: day.distance },
                    day.duration && { icon: 'fa-solid fa-compass', label: 'Duration', value: day.duration },
                    day.altitude && { icon: 'fa-solid fa-mountain', label: 'Altitude', value: day.altitude },
                    day.difficulty && { icon: 'fa-solid fa-gauge-high', label: 'Difficulty', value: day.difficulty },
                    day.drive && { icon: 'fa-solid fa-car', label: 'Drive', value: day.drive },
                    day.meals && { icon: 'fa-solid fa-utensils', label: 'Meals', value: day.meals },
                    day.overnight && { icon: 'fa-solid fa-bed', label: 'Overnight', value: day.overnight },
                    day.pickup && { icon: 'fa-solid fa-location-dot', label: 'Pickup', value: day.pickup },
                    day.dropoff && { icon: 'fa-solid fa-location-dot', label: 'Drop-off', value: day.dropoff },
                    day.departure && { icon: 'fa-solid fa-clock', label: 'Departure', value: day.departure },
                  ].filter(Boolean) as { icon: string; label: string; value: string }[];

                  return (
                    <div
                      className={`kg-acc-item${open ? ' is-open' : ''}${routeSelection === day.day ? ' is-map-active' : ''}`}
                      key={day.day}
                    >
                      <button type="button" className="kg-acc-toggle" onClick={() => toggleDay(day.day)}>
                        <span className="kg-acc-day">Day {day.day}</span>
                        <span className="kg-acc-title">
                          <strong>{day.title}</strong>
                        </span>
                        <span className="kg-acc-icon">
                          <i className="fa-solid fa-chevron-down" aria-hidden />
                        </span>
                      </button>
                      <div className="kg-acc-panel">
                        <div className="kg-acc-body">
                          <div className="kg-acc-copy">
                            <div className="kg-acc-facts">
                              {facts.map((fact) => (
                                <div className="kg-acc-fact" key={fact.label}>
                                  <i className={fact.icon} aria-hidden />
                                  <div>
                                    <strong>{fact.label}</strong>
                                    <span>{fact.value}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <ItineraryDescription text={day.description} />
                            <button
                              type="button"
                              className="kg-acc-maplink"
                              onClick={() => focusDayOnMap(day.day)}
                            >
                              <i className="fa-solid fa-map-location-dot" aria-hidden /> View on map
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Route map */}
          <section id="route-map" className="kg-section">
            <TrekRouteMapSection
              trekId={trek.id}
              profile={routeProfile}
              selection={routeSelection}
              onSelectionChange={setRouteSelection}
              kindLabel={kindLabel}
              trekTitle={trek.title}
              profileFocusKm={routeProfileFocusKm}
              onProfileFocusChange={setRouteProfileFocusKm}
            />
          </section>

          {/* Altitude chart */}
          <section id="altitude-chart" className="kg-section">
            <TrekAltitudeChartSection
              profile={routeProfile}
              selection={routeSelection}
              onSelectionChange={setRouteSelection}
              trekTitle={trek.title}
              onProfileFocusChange={setRouteProfileFocusKm}
            />
          </section>

          <div className="kg-promo">
            <Banners items={nearbyPromo} embedded />
          </div>

          {/* Inclusion & exclusion */}
          <section id="inclusion-exclusion" className="kg-section">
            <div className="kg-inc-card">
              <div className="kg-inc-head">
                <span className="kg-inc-kicker">
                  <i className="fa-solid fa-clipboard-check" aria-hidden /> What&apos;s Covered
                </span>
                <h2>Inclusion &amp; exclusion</h2>
                <div>
                  <p>
                    A detailed overview of everything included in your {trek.title} package —
                    stays, meals, permits, transport, and trek support — along with the costs you
                    should plan for separately.
                  </p>
                </div>
              </div>

              <div className="kg-inc-grid">
                <div className="kg-inc-box kg-inc-included">
                  <h3>
                    <i className="fa-solid fa-circle-check" aria-hidden /> Inclusions
                  </h3>
                  <div className="kg-inc-list">
                    {trek.inclusions.map((item) => (
                      <div className="kg-inc-item" key={item}>
                        <i className="fa-solid fa-check" aria-hidden />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="kg-inc-box kg-inc-excluded">
                  <h3>
                    <i className="fa-solid fa-circle-xmark" aria-hidden /> Exclusions
                  </h3>
                  <div className="kg-inc-list">
                    {trek.exclusions.map((item) => (
                      <div className="kg-inc-item" key={item}>
                        <i className="fa-solid fa-xmark" aria-hidden />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="kg-inc-note">
                <i className="fa-solid fa-circle-info" aria-hidden />
                <div>
                  <ul className="kg-rich-list kg-rich-list--compact">
                    <li>Bag offloading is charged at {inr(addOns[0].price)} per bag.</li>
                    <li>Maximum weight per offloaded bag should not exceed 10 kg.</li>
                    <li>All package prices are quoted before 5% GST.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {extended?.sections
            .filter((section) => ['fitness', 'safety', 'food'].includes(section.id))
            .map((section) =>
              section.id === 'fitness' ? (
                <TrekFitnessSection key={section.id} trek={trek} section={section} />
              ) : (
                <TrekRichSectionCard key={section.id} section={section} />
              ),
            )}

          {/* Best time */}
          <section id="best-time" className="kg-section">
            <div className="kg-season-card">
              <div className="kg-season-head">
                <span className="kg-season-kicker">
                  <i className="fa-regular fa-snowflake" aria-hidden /> Seasonal Guide
                </span>
                <h2>Best Time to Visit {trek.title}</h2>
                <div>
                  <p>
                    {trek.title} runs best during {trek.bestSeason}. Timing changes the trail
                    conditions, the views, and how busy the route feels, so here is what to expect
                    across the year.
                  </p>
                </div>
              </div>

              <div className="kg-season-grid">
                {seasons.map((season) => (
                  <div className="kg-season-box" key={season.title}>
                    <h3>{season.title}</h3>
                    <div className="kg-season-text">
                      <p>{season.body}</p>
                      <ul className="kg-rich-list">
                        {season.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Things to carry */}
          {extended?.packingSection ? (
            <TrekPackingSection section={extended.packingSection} />
          ) : (
            <section id="things-to-carry" className="kg-section">
              <div className="kg-carry-card">
                <div className="kg-carry-head">
                  <span className="kg-carry-kicker">
                    <i className="fa-solid fa-suitcase" aria-hidden /> Packing Guide
                  </span>
                  <h2>Things to Carry</h2>
                  <div>
                    <p>
                      Pack for two realities — warm sunshine at the base city and near-freezing nights
                      at {trek.maxAltitude}. Keep your pack under 10 kg; anything heavier compounds
                      fatigue on long trail days.
                    </p>
                  </div>
                </div>

                <div className="kg-carry-grid">
                  {carryGroups.map((group) => (
                    <div className="kg-carry-box" key={group.title}>
                      <h3>
                        <i className={group.icon} aria-hidden /> {group.title}
                      </h3>
                      <div className="kg-carry-list">
                        {group.items.map((item) => (
                          <div className="kg-carry-item" key={item}>
                            <i className="fa-solid fa-check" aria-hidden />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {extended?.noteSection ? (
            <section id="note" className="kg-section">
              <div className="kg-overview-card">
                <div className="kg-overview-head">
                  <div>
                    <span className="kg-overview-kicker">
                      <i className="fa-regular fa-sticky-note" aria-hidden />{' '}
                      {extended.noteSection.kicker}
                    </span>
                    <h2>{extended.noteSection.title}</h2>
                    {extended.noteSection.intro ? <p>{extended.noteSection.intro}</p> : null}
                  </div>
                </div>
                <CollapsibleRichBlocks
                  blocks={extended.noteSection.blocks}
                  previewCount={5}
                  className="kg-overview-text kg-extended-rich"
                />
              </div>
            </section>
          ) : null}

          <div className="kg-promo">
            <Banners items={offersPromo} embedded />
          </div>

          {/* How to reach */}
          <section id="how-to-reach" className="kg-section">
            <div className="kg-reach-card">
              <div className="kg-reach-head">
                <span className="kg-reach-kicker">
                  <i className="fa-solid fa-route" aria-hidden /> Travel Plan
                </span>
                <h2>How to Reach {trek.title} Base Camp</h2>
                <div>
                  {(
                    extended?.reachIntro
                      ? Array.isArray(extended.reachIntro)
                        ? extended.reachIntro
                        : [extended.reachIntro]
                      : [
                          `${trek.title} starts from ${baseCamp(trek)}, reached through a multi-stage journey. Plan to arrive a night before your batch reporting time.`,
                        ]
                  ).map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="kg-reach-flow">
                {reachSteps.map((step, i) => (
                  <div className="kg-reach-step" key={step.title}>
                    <div className="kg-reach-step-rail" aria-hidden>
                      <span className="kg-reach-step-badge">{i + 1}</span>
                      {i < reachSteps.length - 1 ? <span className="kg-reach-step-line" /> : null}
                    </div>
                    <div className="kg-reach-step-body">
                      <h3>{step.title}</h3>
                      <div className="kg-reach-items">
                        {step.items.map((item) => (
                          <div className="kg-reach-item" key={item.label}>
                            <span className="kg-reach-item-label">{item.label}</span>
                            <p>{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Policy */}
          <section id="policy" className="kg-section">
            <div className="kg-policy-card">
              <div className="kg-policy-head">
                <span className="kg-policy-kicker">
                  <i className="fa-solid fa-shield-halved" aria-hidden /> Terms &amp; Rules
                </span>
                <h2>Policy</h2>
                <div>
                  <p>
                    Booking, cancellation, refund, and participation terms so you know exactly where
                    you stand before joining {trek.title}.
                  </p>
                </div>
              </div>

              <div className="kg-policy-tabs">
                <button
                  type="button"
                  className={`kg-policy-tab${policyTab === 'booking' ? ' is-active' : ''}`}
                  onClick={() => setPolicyTab('booking')}
                >
                  Booking Policy
                </button>
                <button
                  type="button"
                  className={`kg-policy-tab${policyTab === 'cancellation' ? ' is-active' : ''}`}
                  onClick={() => setPolicyTab('cancellation')}
                >
                  Cancellation &amp; Refund
                </button>
              </div>

              <div className="kg-policy-panel is-active">
                {policyTab === 'cancellation' && cancellationPolicySection ? (
                  <div className="kg-policy-rich">
                    <h3 className="kg-policy-rich-title">{cancellationPolicySection.title}</h3>
                    <CollapsibleRichBlocks
                      blocks={cancellationPolicySection.blocks}
                      previewCount={6}
                      className="kg-overview-text kg-extended-rich kg-policy-rich-body"
                    />
                  </div>
                ) : (
                  <div className="kg-policy-table-wrap">
                    <table className="kg-policy-table">
                      <thead>
                        <tr>
                          <th>{policyHead[0]}</th>
                          <th>{policyHead[1]}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policyRows.map(([label, detail]) => (
                          <tr key={label}>
                            <td>{label}</td>
                            <td>{detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="kg-policy-note">
                <i className="fa-solid fa-circle-info" aria-hidden />
                <div>
                  <p>
                    Departures and route decisions remain subject to weather, road access, local
                    administration, and safety conditions. Final operational calls are always taken
                    in the interest of the group.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faqs" className="kg-section">
            <div className="kg-faq-card">
              <div className="kg-faq-head">
                <span className="kg-faq-kicker">
                  <i className="fa-regular fa-circle-question" aria-hidden /> Helpful Answers
                </span>
                <h2>FAQ&apos;s</h2>
                <div>
                  <p>
                    Common questions about {trek.title} — difficulty, altitude, fitness, permits,
                    stays, and what to expect on the trail.
                  </p>
                </div>
              </div>

              <div className="kg-faq-search">
                <i className="fa-solid fa-magnifying-glass" aria-hidden />
                <input
                  type="search"
                  value={faqQuery}
                  onChange={(e) => setFaqQuery(e.target.value)}
                  placeholder="Search a question..."
                  aria-label="Search FAQs"
                />
              </div>

              <div className="kg-faq-list">
                {faqs.map((faq, i) => (
                  <div className={`kg-faq-item${openFaq === i ? ' is-open' : ''}`} key={faq.q}>
                    <button
                      type="button"
                      className="kg-faq-toggle"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span>{faq.q}</span>
                      <span className="kg-faq-icon">
                        <i className="fa-solid fa-chevron-down" aria-hidden />
                      </span>
                    </button>
                    <div className="kg-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>

              {faqs.length === 0 && <div className="kg-faq-empty">No matching questions found.</div>}
            </div>
          </section>

          {extended?.sections
            .filter((section) => section.id === 'why-choose')
            .map((section) => (
              <TrekWhyChooseSection key={section.id} section={section} />
            ))}

          <div className="kg-promo">
            <Banners items={topRatedPromo} embedded />
          </div>

          {/* Rent a gear */}
          <section id="rent-gear" className="kg-section">
            <div className="kg-gear-card">
              <div className="kg-gear-head">
                <div>
                  <span className="kg-gear-kicker">
                    <i className="fa-solid fa-suitcase-rolling" aria-hidden /> Rent a Gear
                  </span>
                  <h2>Rental gear for this {kindLabel.toLowerCase()}</h2>
                </div>
                <div className="kg-gear-nav">
                  <Link href={`/gear-rental?trek=${trek.id}`} className="kg-gear-store-link">
                    Full store
                  </Link>
                  <button
                    type="button"
                    className="kg-gear-arrow"
                    aria-label="Previous gear"
                    onClick={() => nudge(gearRef, -1)}
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="kg-gear-arrow"
                    aria-label="Next gear"
                    onClick={() => nudge(gearRef, 1)}
                  >
                    <i className="fa-solid fa-chevron-right" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="kg-gear-frame">
                <div className="kg-gear-track" ref={gearRef}>
                  {GEAR_CATALOG.map((item) => {
                    const added = gearLines.find((line) => line.gearId === item.id);
                    return (
                      <article className={`kg-gear-item${added ? ' is-added' : ''}`} key={item.id}>
                        <div className="kg-gear-photo">
                          <img src={item.img} alt={item.name} referrerPolicy="no-referrer" />
                        </div>
                        <div className="kg-gear-content">
                          <strong>{item.name}</strong>
                          <span className="kg-gear-price">
                            <i className="fa-solid fa-indian-rupee-sign" aria-hidden /> {item.price}/trek
                          </span>
                          {added ? (
                            <div className="kg-gear-actions">
                              <button
                                type="button"
                                className="kg-gear-rent"
                                onClick={() => setPickingGear(item)}
                              >
                                {`Edit${added.size ? ` · ${added.size}` : ''}${added.qty > 1 ? ` ×${added.qty}` : ''}`}
                              </button>
                              <button
                                type="button"
                                className="kg-gear-remove"
                                aria-label={`Remove ${item.name} from booking`}
                                onClick={() => removeGearFromBooking(item.id)}
                              >
                                <i className="fa-solid fa-trash-can" aria-hidden />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="kg-gear-rent"
                              onClick={() => setPickingGear(item)}
                            >
                              Rent this
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <p className="kg-gear-note">
                {gearLines.length
                  ? `${gearLines.reduce((n, line) => n + line.qty, 0)} item${gearLines.reduce((n, line) => n + line.qty, 0) === 1 ? '' : 's'} reserved for this booking (${inr(gearTotal)}). Collect at base camp.`
                  : 'Rentals are collected at the base camp and returned at the end of the trek. Pick a size to reserve kit for this departure.'}
              </p>
            </div>
          </section>
        </article>

        {/* Booking card */}
        <aside className="kg-booking-col">
          <div className="kg-booking-sticky" ref={bookingStickyRef}>
            <div className="bk-wrap" id="booking-form">
              <div className="bk-card">
                <div className="bk-card-body">
                <div className="bk-offer-row">
                  <p className="bk-offer-label">Offer Price</p>
                  <span className="bk-gst-badge">+ 5% GST</span>
                </div>

                <div className="bk-price-row">
                  <span className="bk-price-main" id="bk-pmain">
                    {inr(unitPrice)}
                  </span>
                  {tier?.originalPrice != null && tier.originalPrice > basePrice && (
                    <span className="bk-price-old">{inr(tier.originalPrice + pickupSurcharge)}</span>
                  )}
                  {tier?.badge && <span className="bk-savings-badge">{tier.badge}</span>}
                </div>

                <hr className="bk-dashed" />

                <div className="bk-sec">Occupancy</div>
                <div className="bk-pills bk-pills--occ">
                  {trek.pricing.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      className={`bk-pill${tierName === p.name ? ' bk-active' : ''}`}
                      onClick={() => setTierName(p.name)}
                    >
                      {occupancyLabel(p.name)}
                    </button>
                  ))}
                </div>

                <div className="bk-sec">Pickup Location</div>
                <div className="bk-pills">
                  {pickupOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`bk-pill${pickup === option ? ' bk-active' : ''}`}
                      onClick={() => setPickup(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="bk-sec">Month-wise Dates</div>
                <div className="bk-dates">
                  <div className="bk-date-row">
                    <div className="bk-date-caption">Choose Month</div>
                    <div className="bk-months" ref={monthsRef}>
                      {months.map((m) => {
                        const tab = monthTabMeta(m);
                        return (
                          <button
                            type="button"
                            key={m}
                            className={`bk-month-pill${month === m ? ' bk-active' : ''}`}
                            onClick={() => selectMonth(m)}
                            aria-pressed={month === m}
                          >
                            <span className="bk-month-pill__label">{tab.short}</span>
                            {tab.year ? <span className="bk-month-pill__year">{tab.year}</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bk-date-row">
                    <div className="bk-date-caption">Choose Date</div>
                    <div className="bk-month-dates" ref={datesRef}>
                      {monthBatches.map((b) => {
                        const soldOut = b.status === 'sold-out';
                        return (
                          <button
                            type="button"
                            key={b.id}
                            disabled={soldOut}
                            className={`bk-date-pill${selectedBatch?.id === b.id ? ' bk-active' : ''}${soldOut ? ' bk-closed' : ''}`}
                            onClick={() => !soldOut && pickDeparture(b, { silent: true })}
                          >
                            <div className="bk-dd">
                              {new Date(b.startDate + 'T12:00:00').toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </div>
                            <span className={`bk-date-tag ${dateTagClass[b.status]}`.trim()}>
                              {dateTagLabel[b.status]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bk-counter-row">
                  <div className="bk-counter-box">
                    <div className="bk-c-label">
                      <i className="fa-regular fa-user" aria-hidden /> Men
                    </div>
                    <div className="bk-c-ctrl">
                      <button type="button" className="bk-c-btn" aria-label="Remove one man" onClick={() => setMen((v) => Math.max(0, v - 1))}>
                        -
                      </button>
                      <span className="bk-c-val">{men}</span>
                      <button type="button" className="bk-c-btn" aria-label="Add one man" onClick={() => setMen((v) => v + 1)}>
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bk-counter-box">
                    <div className="bk-c-label">
                      <i className="fa-regular fa-user" aria-hidden /> Women
                    </div>
                    <div className="bk-c-ctrl">
                      <button type="button" className="bk-c-btn" aria-label="Remove one woman" onClick={() => setWomen((v) => Math.max(0, v - 1))}>
                        -
                      </button>
                      <span className="bk-c-val">{women}</span>
                      <button type="button" className="bk-c-btn" aria-label="Add one woman" onClick={() => setWomen((v) => v + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bk-sec">Add ons</div>
                <div className="bk-addon-strip" role="group" aria-label="Trip add-ons">
                  {addOns.map((addon) => {
                    const active = picked.has(addon.id);
                    return (
                      <button
                        type="button"
                        key={addon.id}
                        className={`bk-addon-tab${active ? ' bk-active' : ''}`}
                        onPointerDown={(e) => onAddonPointerDown(addon.id, e)}
                        onPointerUp={(e) => onAddonPointerUp(addon.id, e)}
                        onPointerCancel={() => {
                          addonTapRef.current = null;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleAddOn(addon.id);
                          }
                        }}
                        aria-pressed={active}
                      >
                        <span className="bk-addon-tab-top">
                          <span className="bk-addon-tab-ico">
                            <i className={addon.icon} aria-hidden />
                          </span>
                          <span className="bk-addon-tab-check" aria-hidden={!active}>
                            <i className="fa-solid fa-check" aria-hidden />
                          </span>
                        </span>
                        <span className="bk-addon-name">{addon.name}</span>
                        <span className="bk-addon-price">+ {inr(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
                {gearLines.length > 0 ? (
                  <div className="bk-gear-box">
                    <div className="bk-gear-box-head">
                      <div className="bk-sec bk-sec--flush">Rental gear</div>
                      <button
                        type="button"
                        className="bk-gear-clear"
                        onClick={() => gearLines.forEach((line) => removeGearFromBooking(line.gearId))}
                      >
                        Clear all
                      </button>
                    </div>
                    <ul className="bk-gear-list">
                      {gearLines.map((line) => {
                        const item = GEAR_CATALOG.find((g) => g.id === line.gearId);
                        if (!item) return null;
                        return (
                          <li key={line.gearId}>
                            <button
                              type="button"
                              className="bk-gear-line-main"
                              onClick={() => setPickingGear(item)}
                            >
                              <span className="bk-gear-line-name">
                                {item.name}
                                {line.size ? ` · ${line.size}` : ''}
                                {line.qty > 1 ? ` ×${line.qty}` : ''}
                              </span>
                              <span className="bk-gear-line-edit">Edit</span>
                            </button>
                            <div className="bk-gear-line-end">
                              <strong>{inr(item.price * line.qty)}</strong>
                              <button
                                type="button"
                                className="bk-gear-remove"
                                aria-label={`Remove ${item.name}`}
                                onClick={() => removeGearFromBooking(line.gearId)}
                              >
                                <i className="fa-solid fa-xmark" aria-hidden />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
                </div>

                <div className="bk-card-actions">
                <div className="bk-breakdown">
                  <div className="bk-line">
                    <span>
                      Trip ({persons} × {inr(unitPrice)})
                    </span>
                    <span>{inr(unitPrice * persons)}</span>
                  </div>
                  {addOns
                    .filter((addon) => picked.has(addon.id))
                    .map((addon) => (
                      <div key={addon.id} className="bk-line bk-srow">
                        <span>{addon.name}</span>
                        <span className="bk-g">
                          + {inr(addon.price * persons)}
                        </span>
                      </div>
                    ))}
                  {gearLines.map((line) => {
                    const item = GEAR_CATALOG.find((g) => g.id === line.gearId);
                    if (!item) return null;
                    return (
                      <div key={line.gearId} className="bk-line">
                        <span>
                          {item.name}
                          {line.size ? ` · ${line.size}` : ''}
                          {line.qty > 1 ? ` ×${line.qty}` : ''}
                        </span>
                        <span>{inr(item.price * line.qty)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="bk-total">
                  <span>Total Price</span>
                  <span>{inr(total)}</span>
                </div>

                <div className="bk-cta-row">
                  <button type="button" className="bk-btn-book" onClick={() => router.push(bookingHref())}>
                    <i className="fa-solid fa-cart-shopping" aria-hidden /> Book Now
                  </button>
                  <span className="bk-or">or</span>
                  <button type="button" className="bk-btn-enq" onClick={enquire}>
                    <span className="bk-wa" aria-hidden="true">
                      <i className="fa-brands fa-whatsapp" />
                    </span>
                    Enquire Now
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Testimonials + guest review submit (trek / yatra / trip) */}
      <TrekGuestReviews
        packageId={trek.id}
        packageTitle={trek.title}
        packageHref={
          isYatra ? `/yatra/${trek.id}` : isTrip ? `/trips/${trek.id}` : trekDetailPath(trek)
        }
        packageKind={isYatra ? 'yatra' : isTrip ? 'trip' : 'trek'}
        kindLabel={kindLabel}
        curated={pageTestimonials}
      />

      {/* Related tours */}
      <section className="kg-related-shell">
        <div className="kg-related-card">
          <div className="kg-related-head">
            <div>
              <span className="kg-related-kicker">
                <i className="fa-solid fa-compass" aria-hidden /> Explore More
              </span>
              <div className="kg-related-title-row">
                <h2>Related Tours</h2>
              </div>
              <div className="kg-related-divider" />
              <p>Trips that match the same mountain mood and adventure feel.</p>
            </div>
          </div>

          <div className="kg-related-track">
            {related.map((item) => (
              <Link className="kg-r-tour" href={trekDetailPath(item)} key={item.id}>
                <Image
                  src={safeImage(item.images[0], trekPhoto(item.id))}
                  alt={item.title}
                  fill
                  sizes="220px"
                  placeholder="blur"
                  blurDataURL={STOREFRONT_BLUR_DATA_URL}
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="kg-r-badges">
                  <span className="kg-r-badge kg-r-badge-days">{item.days} Days</span>
                  <span className={`kg-r-badge kg-r-badge-level ${levelClass(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                </div>
                <div className="kg-r-content">
                  <div className="kg-r-region">
                    <i className="fa-solid fa-location-dot" aria-hidden /> {item.state}
                  </div>
                  <div className="kg-r-name">{item.title}</div>
                  <div className="kg-r-footer">
                    <div>
                      <span className="kg-r-price-label">Starts from</span>
                      <span className="kg-r-price">
                        {inr(Math.min(...item.pricing.map((p) => p.price)))}
                        <sup>/person</sup>
                      </span>
                    </div>
                    <span className="kg-r-cta">
                      <i className="fa-solid fa-arrow-right" aria-hidden /> Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <GearRentModal
        item={pickingGear}
        trekId={trek.id}
        trekTitle={trek.title}
        initial={pickingGear ? gearLines.find((line) => line.gearId === pickingGear.id) : undefined}
        onClose={() => setPickingGear(null)}
        onConfirm={({ qty, size }) => {
          if (!pickingGear) return;
          upsertGearLine({ gearId: pickingGear.id, trekId: trek.id, qty, size });
          setPickingGear(null);
        }}
        onRemove={
          pickingGear && gearLines.some((line) => line.gearId === pickingGear.id)
            ? () => {
                removeGearLine(pickingGear.id, trek.id);
                setPickingGear(null);
              }
            : undefined
        }
      />

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="kg-lightbox is-open"
          role="dialog"
          aria-modal="true"
          aria-label={`${trek.title} photos`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(null);
          }}
        >
          <button type="button" className="kg-lb-close" aria-label="Close" onClick={() => setLightbox(null)}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
          <button type="button" className="kg-lb-btn kg-lb-prev" aria-label="Previous photo" onClick={() => step(-1)}>
            <i className="fa-solid fa-chevron-left" aria-hidden />
          </button>
          <div className="kg-lightbox-stage">
            <img src={images[lightbox]} alt={`${trek.title} photo ${lightbox + 1}`} referrerPolicy="no-referrer" />
          </div>
          <button type="button" className="kg-lb-btn kg-lb-next" aria-label="Next photo" onClick={() => step(1)}>
            <i className="fa-solid fa-chevron-right" aria-hidden />
          </button>
          <div className="kg-lb-count">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}

      {/* Mobile book bar */}
      <div className="kg-mobile-bookbar">
        <button
          type="button"
          className="kg-mobile-bookbar-price"
          onClick={() => goToSection(selectedBatch ? 'departures' : 'booking-form')}
        >
          <strong>{inr(total)}</strong>
          <span>
            {occupancyLabel(tierName)}
            {persons > 0 ? ` · ${persons} traveller${persons === 1 ? '' : 's'}` : ''}
            {selectedBatch ? ` · ${selectedBatch.label}` : ''}
          </span>
        </button>
        <button type="button" className="kg-mobile-bookbar-book" onClick={() => router.push(bookingHref())}>
          <i className="fa-solid fa-cart-shopping" aria-hidden /> Book Now
        </button>
        <button type="button" className="kg-mobile-bookbar-wa" aria-label="Enquire on WhatsApp" onClick={enquire}>
          <i className="fa-brands fa-whatsapp" aria-hidden />
        </button>
      </div>

      {dateToast && (
        <div className="fd-toast" role="status" aria-live="polite">
          <i className="fa-solid fa-circle-check fd-toast__icon" aria-hidden />
          <span className="fd-toast__copy">
            <strong>{dateToast}</strong> saved — keep browsing or book when ready.
          </span>
          <button
            type="button"
            className="fd-toast__action"
            onClick={() => {
              setDateToast(null);
              goToSection('booking-form');
            }}
          >
            View booking
          </button>
        </div>
      )}

      {shareToast && (
        <div className="fd-toast fd-toast--share" role="status" aria-live="polite">
          <i className="fa-solid fa-link fd-toast__icon" aria-hidden />
          <span className="fd-toast__copy">
            <strong>Link copied</strong> — paste anywhere to share this trek.
          </span>
        </div>
      )}
    </div>
  );
}
