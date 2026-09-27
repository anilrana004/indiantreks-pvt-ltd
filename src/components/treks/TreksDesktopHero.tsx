'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  MapPin,
  Mountain,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { photos } from '@/lib/media';
import { HERO_POPULAR_TREK_IDS } from '@/lib/treks-landing-content';
import type { ListingTrek } from '@/lib/treks-listing';

type Props = {
  year: number;
  title: string;
  lead: string;
  isDefaultHero: boolean;
  searchDraft: string;
  onSearchDraft: (value: string) => void;
  onSubmitSearch: (e?: FormEvent) => void;
  onExplore: () => void;
  trekCount: number;
  treks: ListingTrek[];
  showPopularPicks: boolean;
  headerOffset: number;
};

function seasonPill(bestSeason: string): string {
  if (/all year|year.?round|throughout/i.test(bestSeason)) return 'All Year';
  const parts = bestSeason.split(/\s*[-–]\s*/);
  if (parts.length >= 2) {
    const short = (s: string) => s.trim().slice(0, 3);
    return `${short(parts[0])} - ${short(parts[parts.length - 1])}`;
  }
  return bestSeason.length > 14 ? `${bestSeason.slice(0, 14)}…` : bestSeason;
}

export default function TreksDesktopHero({
  year,
  title,
  lead,
  isDefaultHero,
  searchDraft,
  onSearchDraft,
  onSubmitSearch,
  onExplore,
  trekCount,
  treks,
  showPopularPicks,
  headerOffset,
}: Props) {
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const marqueePaused = userPaused || hoverPaused;

  const popularTreks = useMemo(() => {
    const map = new Map(treks.map((t) => [t.id, t]));
    return HERO_POPULAR_TREK_IDS.map((id) => map.get(id)).filter(Boolean) as ListingTrek[];
  }, [treks]);

  const loopTreks = useMemo(
    () => (popularTreks.length > 0 ? [...popularTreks, ...popularTreks] : []),
    [popularTreks],
  );

  const trekStat = trekCount >= 40 ? '40+' : `${trekCount}+`;

  return (
    <section className="it-treks-hero" aria-label="Upcoming treks">
      <Image
        className="it-treks-hero__photo"
        src={photos.kedarkantha}
        alt=""
        fill
        priority
        sizes="100vw"
        referrerPolicy="no-referrer"
      />
      <div className="it-treks-hero__overlay" aria-hidden />
      <div className="it-treks-hero__glow" aria-hidden />

      <div className="it-treks-hero__inner">
        <div style={{ height: headerOffset + 28 }} aria-hidden />

        <div className="it-treks-hero__top">
          <div className="it-treks-hero__copy">
            <p className="it-treks-hero__badge">
              <Mountain className="h-3.5 w-3.5" aria-hidden />
              Plan ahead, trek better · {year}
            </p>

            {isDefaultHero ? (
              <h1 className="it-treks-hero__title it-treks-hero__title--default">
                Upcoming Treks in{' '}
                <span className="it-treks-hero__year">
                  <Sparkles className="it-treks-hero__spark" aria-hidden />
                  {year}
                </span>
              </h1>
            ) : (
              <h1 className="it-treks-hero__title">{title}</h1>
            )}

            <p className="it-treks-hero__lead">{lead}</p>

            <div className="it-treks-hero__actions">
              <form onSubmit={onSubmitSearch} className="it-treks-hero__search" role="search">
                <label className="it-treks-hero__search-field">
                  <span className="sr-only">Search treks</span>
                  <MapPin className="it-treks-hero__search-icon" aria-hidden />
                  <input
                    type="search"
                    value={searchDraft}
                    onChange={(e) => onSearchDraft(e.target.value)}
                    placeholder="Search treks, regions or months…"
                  />
                </label>
                <button type="submit" className="it-treks-hero__search-btn" aria-label="Search treks">
                  <Search className="h-[1.15rem] w-[1.15rem]" aria-hidden />
                </button>
              </form>

              <button type="button" className="it-treks-hero__explore" onClick={onExplore}>
                Explore All Treks
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <aside className="it-treks-hero__stats" aria-label="Why trek with Indian Treks">
            <div className="it-treks-hero__stat">
              <span className="it-treks-hero__stat-icon">
                <Mountain className="h-[1.15rem] w-[1.15rem]" aria-hidden />
              </span>
              <div>
                <strong>{trekStat} Treks</strong>
                <span>Himalayan routes</span>
              </div>
            </div>
            <div className="it-treks-hero__stat">
              <span className="it-treks-hero__stat-icon">
                <Calendar className="h-[1.15rem] w-[1.15rem]" aria-hidden />
              </span>
              <div>
                <strong>All Year</strong>
                <span>Departures</span>
              </div>
            </div>
            <div className="it-treks-hero__stat">
              <span className="it-treks-hero__stat-icon">
                <Users className="h-[1.15rem] w-[1.15rem]" aria-hidden />
              </span>
              <div>
                <strong>All Levels</strong>
                <span>Easy to expert</span>
              </div>
            </div>
            <div className="it-treks-hero__stat">
              <span className="it-treks-hero__stat-icon">
                <ShieldCheck className="h-[1.15rem] w-[1.15rem]" aria-hidden />
              </span>
              <div>
                <strong>Expert Guides</strong>
                <span>Certified leaders</span>
              </div>
            </div>
          </aside>
        </div>

        {showPopularPicks && popularTreks.length > 0 && (
          <div className="it-treks-hero__picks">
            <div className="it-treks-hero__picks-head">
              <p className="it-treks-hero__picks-kicker">
                <Star className="h-3.5 w-3.5" aria-hidden />
                Popular picks
              </p>
              <h2 className="it-treks-hero__picks-title">Top Treks to Watch Out for</h2>
              <button
                type="button"
                className="it-treks-hero__picks-nav"
                onClick={() => setUserPaused((v) => !v)}
                aria-label={marqueePaused ? 'Play auto-scroll' : 'Pause auto-scroll'}
                aria-pressed={userPaused}
              >
                {marqueePaused ? (
                  <Play className="h-4 w-4" aria-hidden />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>

            <div
              className={`it-treks-hero__picks-row${marqueePaused ? ' is-paused' : ''}`}
              onMouseEnter={() => setHoverPaused(true)}
              onMouseLeave={() => setHoverPaused(false)}
              onFocusCapture={() => setHoverPaused(true)}
              onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setHoverPaused(false);
                }
              }}
            >
              <div className="it-treks-hero__picks-marquee" aria-live="off">
                <div className="it-treks-hero__picks-track">
                  {loopTreks.map((trek, index) => (
                    <Link
                      key={`${trek.id}-${index}`}
                      href={trek.href}
                      className="it-treks-hero__pick-card"
                    >
                      <img src={trek.cover} alt="" referrerPolicy="no-referrer" />
                      <div className="it-treks-hero__pick-shade" aria-hidden />
                      <span className="it-treks-hero__pick-season">{seasonPill(trek.bestSeason)}</span>
                      <strong className="it-treks-hero__pick-name">{trek.title}</strong>
                    </Link>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="it-treks-hero__picks-arrow"
                onClick={() => setUserPaused((v) => !v)}
                aria-label={marqueePaused ? 'Play auto-scroll' : 'Pause auto-scroll'}
              >
                {marqueePaused ? (
                  <Play className="h-5 w-5" aria-hidden />
                ) : (
                  <ChevronRight className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
