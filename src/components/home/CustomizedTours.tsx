'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { treks } from '@/lib/data';
import { isInternational, isYatra, trekCover, trekPrice } from '@/lib/catalog';
import { ensureCldAuto, STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';

type DestCard = { name: string; count: number; price: number; img: string; href: string };

/** Customise-section destination tiles only — does not change trek listing cards. */
const UTTARAKHAND_CUSTOMISE_COVER = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791139005/Uttarakhand_Vintage_Travel_Stamp_1.png',
);
const HIMACHAL_CUSTOMISE_COVER = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791139183/Himachal_Pradesh_Vintage_Travel_Stamp.png',
);
const KASHMIR_CUSTOMISE_COVER = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791139638/Jammu_Kashmir_Vintage_Travel_Poster.png',
);
const YATRA_CUSTOMISE_COVER = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791141384/%E0%A4%AF%E0%A4%BE%E0%A4%A4%E0%A5%8D%E0%A4%B0%E0%A4%BE__Himalayan_Pilgrimage_Postcard.png',
);
const NEPAL_CUSTOMISE_COVER = ensureCldAuto(
  'https://res.cloudinary.com/jum1mpl0/image/upload/v1791142229/download_3.jpg',
);

function buildDestinations(kind: 'International' | 'India'): DestCard[] {
  if (kind === 'International') {
    const nepal = treks.filter(isInternational);
    if (!nepal.length) return [];
    return [
      {
        name: 'Nepal',
        count: nepal.length,
        price: Math.min(...nepal.map(trekPrice)),
        img: NEPAL_CUSTOMISE_COVER,
        href: '/treks?region=nepal',
      },
    ];
  }

  const groups: {
    name: string;
    match: (t: (typeof treks)[0]) => boolean;
    href: string;
    cover?: string;
  }[] = [
    {
      name: 'Uttarakhand Treks',
      match: (t) => t.region === 'uttarakhand' && t.type === 'trek',
      href: '/treks?region=uttarakhand',
      cover: UTTARAKHAND_CUSTOMISE_COVER,
    },
    {
      name: 'Himachal Treks',
      match: (t) => t.region === 'himachal' && t.type === 'trek',
      href: '/treks?region=himachal',
      cover: HIMACHAL_CUSTOMISE_COVER,
    },
    {
      name: 'Kashmir Treks',
      match: (t) => t.region === 'kashmir' && t.type === 'trek',
      href: '/treks?region=kashmir',
      cover: KASHMIR_CUSTOMISE_COVER,
    },
    {
      name: 'Yatra',
      match: isYatra,
      href: '/yatra',
      cover: YATRA_CUSTOMISE_COVER,
    },
  ];

  return groups
    .map((g) => {
      const list = treks.filter(g.match);
      if (!list.length) return null;
      const sample = list[0];
      return {
        name: g.name,
        count: list.length,
        price: Math.min(...list.map(trekPrice)),
        img: g.cover ?? trekCover(sample),
        href: g.href,
      };
    })
    .filter(Boolean) as DestCard[];
}

export default function CustomizedTours() {
  const [tab, setTab] = useState<'International' | 'India'>('India');
  const items = useMemo(() => buildDestinations(tab), [tab]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [tab]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || items.length < 2) return;

    // Desktop uses a static grid — auto-scroll is phone / tablet carousel only.
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    if (desktop) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const pause = () => {
      pausedRef.current = true;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => {
        pausedRef.current = false;
      }, 4000);
    };
    const freeze = () => {
      pausedRef.current = true;
    };
    const unfreeze = () => {
      pausedRef.current = false;
    };

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
  }, [items.length, tab]);

  return (
    <section className="py-8 lg:py-16 bg-gray-50">
      <div className="container mx-auto">
        <div className="mb-6 lg:mb-8 px-4 lg:px-0">
          <p className="text-[#16a34a] font-semibold text-xs lg:text-sm tracking-widest uppercase mb-1">
            CUSTOMISED TOURS
          </p>
          <h2 className="text-xl lg:text-3xl font-bold text-[#000000]">Get a Customised Tour Package</h2>
        </div>
        <div className="flex justify-center gap-2 mb-6 px-4 lg:px-0">
          {(['India', 'International'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-[#16a34a] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#16a34a] hover:text-[#166534]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Mobile: one large square stamp at a time + auto-scroll. Desktop: 4-up grid. */}
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 px-4 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:snap-none lg:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          aria-label="Customised tour destinations"
        >
          {items.map((d) => (
            <Link
              key={d.name}
              href={d.href}
              className="group relative aspect-square w-[82vw] max-w-[320px] shrink-0 snap-center rounded-2xl overflow-hidden bg-[#111] lg:w-auto lg:max-w-none"
            >
              <Image
                src={d.img}
                alt={d.name}
                fill
                sizes="(max-width:1024px) 82vw, 25vw"
                placeholder="blur"
                blurDataURL={STOREFRONT_BLUR_DATA_URL}
                className="object-contain group-hover:scale-[1.03] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
              <div className="absolute top-3 left-3 bg-[#16a34a] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {d.count}+ Packages
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-bold text-lg text-white group-hover:text-[#16a34a] transition-colors">
                  {d.name}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-white/70 text-xs">Starting Price</span>
                  <span className="text-[#4ade80] font-bold text-base">₹{d.price.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/customized"
            className="text-[#16a34a] text-sm font-semibold hover:text-[#15803d] transition-colors"
          >
            View All Customized Tours &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
