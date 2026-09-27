'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, MapPin } from 'lucide-react';
import { getHimalayanSeasonBuckets } from '@/lib/catalog';
import {
  HOME_HIMALAYAN_DEFAULT_SEASON,
  HOME_HIMALAYAN_SEASONS,
  HOME_HIMALAYAN_SEASON_COPY,
  HOME_HIMALAYAN_SECTION,
  type HomeHimalayanSeason,
} from '@/lib/content/home-himalayan-treks';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

const diffColors: Record<string, string> = {
  Easy: 'bg-green-500',
  'Easy to Moderate': 'bg-green-400',
  Moderate: 'bg-yellow-500',
  'Moderate-Difficult': 'bg-orange-500',
  Difficult: 'bg-red-500',
};

export default function HimalayanTreks() {
  const buckets = useMemo(() => getHimalayanSeasonBuckets(), []);
  const seasons = useMemo(
    () => HOME_HIMALAYAN_SEASONS.filter((s) => (buckets[s]?.length ?? 0) > 0),
    [buckets],
  );
  const [season, setSeason] = useState<HomeHimalayanSeason>(() =>
    seasons.includes(HOME_HIMALAYAN_DEFAULT_SEASON)
      ? HOME_HIMALAYAN_DEFAULT_SEASON
      : seasons[0] ?? 'Winter',
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const items = buckets[season] || [];
  const copy = HOME_HIMALAYAN_SEASON_COPY[season];

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [season]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || items.length < 2) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const pause = () => {
      pausedRef.current = true;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, 4000);
    };
    const freeze = () => { pausedRef.current = true; };
    const unfreeze = () => { pausedRef.current = false; };

    el.addEventListener('pointerdown', pause, { passive: true });
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('wheel', pause, { passive: true });
    el.addEventListener('mouseenter', freeze);
    el.addEventListener('mouseleave', unfreeze);

    const tick = () => {
      if (pausedRef.current || !el) return;
      const card = el.querySelector<HTMLElement>(':scope > a');
      if (!card) return;
      const styles = getComputedStyle(el);
      const gap = parseFloat(styles.columnGap || styles.gap) || 12;
      const step = card.offsetWidth + gap;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 4) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    };

    const id = window.setInterval(tick, 3200);
    return () => {
      window.clearInterval(id);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      el.removeEventListener('pointerdown', pause);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('wheel', pause);
      el.removeEventListener('mouseenter', freeze);
      el.removeEventListener('mouseleave', unfreeze);
    };
  }, [items.length, season]);

  return (
    <section className="py-8 lg:py-16 bg-gray-50">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 lg:mb-8 px-4 lg:px-0">
          <div>
            <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-widest uppercase mb-1">
              {HOME_HIMALAYAN_SECTION.kicker}
            </p>
            <h2 className="text-xl lg:text-3xl font-bold text-[#000000]">
              {copy.title}
              <span className="ml-2 text-sm lg:text-base font-medium text-gray-400">
                {copy.months}
              </span>
            </h2>
          </div>
          <Link
            href={HOME_HIMALAYAN_SECTION.viewAllHref}
            className="text-[#16a34a] text-sm font-semibold hover:text-[#15803d] whitespace-nowrap"
          >
            {HOME_HIMALAYAN_SECTION.viewAllLabel} &rarr;
          </Link>
        </div>

        <div className="flex justify-start gap-2 overflow-x-auto scrollbar-none pb-2 px-4 lg:justify-center lg:px-0 mb-6" style={{ scrollbarWidth: 'none' }}>
          {seasons.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={`shrink-0 px-5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all ${
                season === s
                  ? 'bg-[#16a34a] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#16a34a] hover:text-[#166534]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-3 lg:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 px-4 lg:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          aria-label={`${copy.title} carousel`}
        >
          {items.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="group relative aspect-[3/4] w-[72vw] max-w-[260px] sm:w-[240px] lg:w-[260px] shrink-0 snap-start rounded-xl overflow-hidden"
            >
              <Image
                src={t.img}
                alt={t.title}
                fill
                sizes="260px"
                placeholder="blur"
                blurDataURL={STOREFRONT_BLUR_DATA_URL}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className={`absolute top-3 left-3 text-[10px] lg:text-xs font-bold px-2 py-1 rounded-md text-white ${diffColors[t.difficulty] || 'bg-gray-500'}`}>
                {t.difficulty}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
                <div className="flex items-center gap-1 text-white/80 text-xs font-medium mb-1">
                  <MapPin className="w-3 h-3 text-[#16a34a] shrink-0" />
                  <span className="truncate">{t.loc}</span>
                </div>
                <h3 className="font-semibold text-sm lg:text-base text-white group-hover:text-[#16a34a] transition-colors line-clamp-2 mb-2">
                  {t.title}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] lg:text-xs text-white/70">
                    <Clock className="w-3 h-3 text-[#16a34a]" />
                    {t.dur}
                  </span>
                  <span className="text-[#16a34a] font-bold text-sm lg:text-base">₹{t.price.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
