'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Tag } from 'lucide-react';
import { photos } from '@/lib/media';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

export interface BannerItem {
  src: string;
  href: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  discount?: string;
  desktopSrc?: string;
  /**
   * Designed creative: art already includes title/CTA — skip HTML overlays.
   */
  designed?: boolean;
  /** Optional override; frame defaults to 3840×764. */
  aspectRatio?: string;
  /** CSS object-position when the strip needs a vertical nudge. */
  objectPosition?: string;
}

/** Canonical promo strip size — every banner box is exactly this ratio. */
const BANNER_W = 3840;
const BANNER_H = 764;
const BANNER_ASPECT = `${BANNER_W} / ${BANNER_H}`;

const defaultBanners: BannerItem[] = [
  { src: photos.vof, href: '/treks/valley-of-flowers', title: 'Valley of Flowers Trek', subtitle: 'UNESCO Himalayan Paradise - 6D/5N', badge: 'Best Seller', discount: '₹8,999' },
  { src: photos.kedarkantha, href: '/treks/kedarkantha', title: 'Kedarkantha Winter Trek', subtitle: "India's #1 winter trek - 5D/4N", badge: 'Winter Special', discount: '₹6,999' },
  { src: photos.hampta, href: '/treks/hampta-pass', title: 'Hampta Pass - Valley Crossing', subtitle: 'Lush Kullu meets barren Spiti - 5D/4N', badge: 'Adventure', discount: '₹8,499' },
  { src: photos.ebc, href: '/treks/everest-base-camp', title: 'Everest Base Camp', subtitle: 'The trek of a lifetime - 13D/12N', badge: 'Bucket List', discount: '₹74,999' },
  { src: photos.yatra, href: '/yatra/kedarnath-yatra', title: 'Kedarnath Yatra', subtitle: 'Sacred pilgrimage - 6D/5N', badge: 'Yatra', discount: '₹9,999' },
];

function SlideImage({
  src,
  desktopSrc,
  alt,
  objectPosition,
  priority = false,
}: {
  src: string;
  desktopSrc?: string;
  alt: string;
  objectPosition?: string;
  /** Eager-load the LCP slide only. */
  priority?: boolean;
}) {
  const desk = desktopSrc || src;
  /** Slight zoom gives object-position room to nudge framing on exact-ratio art. */
  const positionStyle = objectPosition
    ? { objectPosition, transform: 'scale(1.06)' }
    : undefined;
  const sizes = '(max-width: 1024px) 100vw, min(1200px, 100vw)';

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        blurDataURL={STOREFRONT_BLUR_DATA_URL}
        referrerPolicy="no-referrer"
        style={positionStyle}
        className={`h-full w-full object-cover lg:hidden ${objectPosition ? 'origin-center' : 'object-center'}`}
      />
      <Image
        src={desk}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        blurDataURL={STOREFRONT_BLUR_DATA_URL}
        referrerPolicy="no-referrer"
        style={positionStyle}
        className={`hidden h-full w-full object-cover lg:block ${objectPosition ? 'origin-center' : 'object-center'}`}
      />
    </>
  );
}

/**
 * Promo slider — every slide uses a fixed 3840×764 frame.
 */
export default function Banners({
  items = defaultBanners,
  embedded = false,
  priorityFirst = false,
}: {
  items?: BannerItem[];
  /** When true, sits inside another page section without outer white band */
  embedded?: boolean;
  /** Eager-load slide 0 (use once near the top of the page for LCP). */
  priorityFirst?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [autoplayReady, setAutoplayReady] = useState(false);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = items.length;
  const touchX = useRef(0);
  const swiped = useRef(false);

  const goTo = useCallback((i: number) => {
    setIndex(((i % count) + count) % count);
  }, [count]);

  // Defer autoplay until after hydration so SSR HTML always matches the first client paint.
  useEffect(() => {
    setAutoplayReady(true);
  }, []);

  useEffect(() => {
    if (!autoplayReady || count < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % count);
    }, 4000);

    return () => window.clearInterval(id);
  }, [autoplayReady, count]);

  // Reset to first slide when the slide set identity changes (not on every parent render).
  const itemsKey = items.map((b) => b.href).join('|');
  useEffect(() => {
    setIndex(0);
  }, [itemsKey]);

  const pause = () => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, 5000);
  };

  if (!count) return null;

  const designedActive = Boolean(items[index]?.designed);

  const dots = count > 1 ? (
    <div
      className={
        designedActive
          ? 'relative z-20 mt-2.5 flex items-center justify-center gap-1.5'
          : 'absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 lg:bottom-3.5 lg:right-3.5'
      }
    >
      {items.map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Show banner ${i + 1}`}
          onClick={() => { pause(); goTo(i); }}
          className={`h-1.5 rounded-full transition-all ${
            i === index
              ? 'bg-[#16a34a] w-5'
              : designedActive
                ? 'bg-black/30 w-1.5 hover:bg-black/50'
                : 'bg-white/55 w-1.5 hover:bg-white/80'
          }`}
        />
      ))}
    </div>
  ) : null;

  const slider = (
    <div
      className={`relative w-full ${designedActive ? '' : 'overflow-hidden rounded-[18px] shadow-sm bg-[#1f2937]'}`}
      onPointerDown={pause}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; pause(); }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) < 40) return;
        swiped.current = true;
        if (dx < 0) goTo(index + 1);
        else goTo(index - 1);
      }}
    >
      {/* Fixed 3840×764 frame for every slide. */}
      <div
        className={`relative w-full shrink-0 overflow-hidden ${
          designedActive ? 'rounded-[18px] shadow-sm bg-[#f4f2ec]' : ''
        }`}
        style={{ aspectRatio: BANNER_ASPECT }}
      >
        {items.map((b, i) => {
          const active = i === index;
          return (
            <Link
              key={`${b.href}-${b.title ?? i}-${i}`}
              href={b.href}
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
              onClick={e => {
                if (swiped.current) {
                  e.preventDefault();
                  swiped.current = false;
                }
              }}
              className={`absolute inset-0 block overflow-hidden transition-opacity duration-700 ease-out ${
                active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <SlideImage
                src={b.src}
                desktopSrc={b.desktopSrc}
                alt={b.title || 'Promo'}
                objectPosition={b.objectPosition}
                priority={priorityFirst && i === 0}
              />

              {!b.designed && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/78 via-black/42 to-black/15" />

                  {b.badge && (
                    <div className="absolute top-2.5 left-2.5 z-[1] lg:top-4 lg:left-4 flex items-center gap-1 bg-[#16a34a]/95 text-white text-[10px] lg:text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      <Tag className="w-3 h-3" />
                      {b.badge}
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 z-[1] p-3 sm:p-4 lg:p-5 max-w-2xl">
                    {b.title && (
                      <h3 className="text-white font-bold text-sm sm:text-base lg:text-xl drop-shadow-sm leading-tight">
                        {b.title}
                      </h3>
                    )}
                    {b.subtitle && (
                      <p className="text-white/85 text-[10px] sm:text-xs lg:text-sm mt-0.5 leading-relaxed line-clamp-1 sm:line-clamp-2">
                        {b.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 lg:mt-2">
                      <span className="text-[#4ade80] text-[11px] lg:text-xs font-semibold">
                        {b.discount}
                      </span>
                      <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white/70" />
                    </div>
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>

      {dots}
    </div>
  );

  if (embedded) {
    return <div className="w-full">{slider}</div>;
  }

  return (
    <section className="py-4 lg:py-6 bg-white">
      <div className="container mx-auto">
        {slider}
      </div>
    </section>
  );
}
