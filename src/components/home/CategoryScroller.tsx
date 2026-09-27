'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

export type CategoryItem = {
  n: string;
  h: string;
  img: string;
  featured?: boolean;
};

export type CategoryScrollerVariant = 'mobile' | 'desktop';

const SPEED = 32;
const RESUME_MS = 2800;

const GREEN_RING =
  'linear-gradient(145deg, #16a34a 0%, #4ade80 55%, #86efac 100%)';

/** Desktop story rings — warm analogous spectrum (JustWravel / IG color theory). */
const DESKTOP_RINGS = [
  'linear-gradient(135deg, #f09433 0%, #e6683c 35%, #dc2743 65%, #bc1888 100%)',
  'linear-gradient(135deg, #fdc830 0%, #f37335 45%, #e52e71 100%)',
  'linear-gradient(135deg, #f77737 0%, #e1306c 50%, #833ab4 100%)',
  'linear-gradient(135deg, #ff6a00 0%, #ee0979 55%, #9b2d8a 100%)',
  'linear-gradient(135deg, #f9d423 0%, #ff4e50 50%, #c44569 100%)',
  'linear-gradient(135deg, #ff9a44 0%, #fc6076 50%, #8e2de2 100%)',
] as const;

function desktopRing(index: number, featured?: boolean): string {
  if (featured) return GREEN_RING;
  return DESKTOP_RINGS[index % DESKTOP_RINGS.length];
}

function CatAvatar({
  src,
  label,
  featured,
  variant,
  index = 0,
}: {
  src: string;
  label: string;
  featured?: boolean;
  variant: CategoryScrollerVariant;
  index?: number;
}) {
  const [broken, setBroken] = useState(false);
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const isMobile = variant === 'mobile';
  const ring = isMobile ? GREEN_RING : desktopRing(index, featured);
  const sizeCls = isMobile
    ? 'h-[68px] w-[68px]'
    : 'h-14 w-14 sm:h-16 sm:w-16';
  const glow = isMobile || featured
    ? '0 2px 10px rgba(22,163,74,0.28)'
    : '0 2px 12px rgba(225,48,108,0.22)';

  return (
    <span
      className="inline-flex aspect-square shrink-0 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-[1.05]"
      style={{
        backgroundImage: ring,
        boxShadow: glow,
      }}
    >
      <span
        className={`relative inline-flex aspect-square shrink-0 overflow-hidden rounded-full bg-white p-[2px] ${sizeCls}`}
      >
        {broken ? (
          <span
            className={`flex h-full w-full items-center justify-center rounded-full text-[12px] font-bold tracking-wide text-white ${
              featured || isMobile
                ? 'bg-gradient-to-br from-[#166534] to-[#16a34a]'
                : 'bg-gradient-to-br from-[#e1306c] to-[#833ab4]'
            }`}
          >
            {initials}
          </span>
        ) : (
          <Image
            src={src}
            alt=""
            width={isMobile ? 68 : 64}
            height={isMobile ? 68 : 64}
            sizes={isMobile ? '68px' : '64px'}
            placeholder="blur"
            blurDataURL={STOREFRONT_BLUR_DATA_URL}
            referrerPolicy="no-referrer"
            draggable={false}
            onError={() => setBroken(true)}
            className="pointer-events-none !h-full !w-full rounded-full object-cover"
          />
        )}
      </span>
    </span>
  );
}

type Props = {
  items: CategoryItem[];
  variant?: CategoryScrollerVariant;
};

/**
 * mobile — original phone strip (green rings + auto-crawl), placed in Hero.
 * desktop — JustWravel story rings for the floating pill bar.
 */
export default function CategoryScroller({ items, variant = 'desktop' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const lastTs = useRef(0);
  const paused = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const moved = useRef(false);

  const isMobile = variant === 'mobile';
  const loopItems = isMobile ? [...items, ...items] : items;

  const pause = () => {
    paused.current = true;
    lastTs.current = 0;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      normalizeLoop();
      paused.current = false;
      lastTs.current = 0;
    }, RESUME_MS);
  };

  const normalizeLoop = () => {
    if (!isMobile) return;
    const el = trackRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (half <= 0) return;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    if (el.scrollLeft < 0) el.scrollLeft += half;
  };

  useEffect(() => {
    if (!isMobile) return;
    const el = trackRef.current;
    if (!el || items.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tick = (ts: number) => {
      if (!lastTs.current) lastTs.current = ts;
      const dt = Math.min(ts - lastTs.current, 48);
      lastTs.current = ts;

      if (!paused.current && !drag.current) {
        el.scrollLeft += (SPEED * dt) / 1000;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const onTouchStart = () => pause();
    const onWheel = () => pause();
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('wheel', onWheel);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [isMobile, items.length]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile || e.pointerType === 'touch') return;
    const el = trackRef.current;
    if (!el) return;
    pause();
    moved.current = false;
    drag.current = { x: e.clientX, left: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const d = drag.current;
    const el = trackRef.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) moved.current = true;
    el.scrollLeft = d.left - dx;
    normalizeLoop();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile || !drag.current) return;
    drag.current = null;
    const el = trackRef.current;
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    normalizeLoop();
  };

  if (items.length === 0) return null;

  if (isMobile) {
    return (
      <div className="-mx-4 mt-4">
        <div
          ref={trackRef}
          role="list"
          aria-label="Browse destinations"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex cursor-grab gap-3.5 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 pb-1 select-none active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          {loopItems.map((item, i) => (
            <Link
              key={`${item.n}-${i}`}
              href={item.h}
              role="listitem"
              tabIndex={i >= items.length ? -1 : 0}
              aria-hidden={i >= items.length}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onClick={(e) => {
                if (moved.current) {
                  e.preventDefault();
                  moved.current = false;
                }
              }}
              className="group flex w-[76px] shrink-0 flex-col items-center"
            >
              <CatAvatar src={item.img} label={item.n} featured={item.featured} variant="mobile" />
              <span className="mt-1.5 h-8 w-full text-center text-[10px] font-semibold leading-tight text-gray-900 line-clamp-2">
                {item.n}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Explore categories"
      className="flex w-max items-start justify-start gap-3 overscroll-x-contain sm:gap-3.5 lg:gap-4"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {items.map((item, index) => (
        <Link
          key={item.n}
          href={item.h}
          role="listitem"
          className="group flex w-[78px] shrink-0 flex-col items-center sm:w-[84px]"
        >
          <CatAvatar
            src={item.img}
            label={item.n}
            featured={item.featured}
            variant="desktop"
            index={index}
          />
          <span
            className={`mt-1.5 w-full text-center text-[11px] font-semibold leading-snug sm:text-[12px] ${
              item.featured ? 'text-[#16a34a]' : 'text-slate-700'
            }`}
          >
            {item.n}
          </span>
        </Link>
      ))}
    </div>
  );
}
