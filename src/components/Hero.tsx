'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search, Star,
  ArrowRight, Phone,
  Mountain, SunMedium, X, Menu,
} from 'lucide-react';
import { treks } from '@/lib/data';
import BrandLogo from '@/components/BrandLogo';
import { CONTACT, telUrl } from '@/lib/contact';
import { DESK_HEADER_H } from '@/lib/layout';
import {
  HERO_MOB_BANNERS,
  HERO_SEARCH_DESTINATIONS,
  getHeroDeskSlides,
} from '@/lib/content/home-hero';
import { HOME_EXPLORE_BANNERS } from '@/lib/content/home-banners';
import { HERO_COLLAB_ITEMS } from '@/lib/content/home-hero-collab';
import { HERO_COLLAB_LUCIDE_ICONS } from '@/lib/icons/lucide-content-icons';
import Banners from '@/components/Banners';
import CategoryScroller from '@/components/home/CategoryScroller';
import { HOME_EXPLORE_CATEGORIES } from '@/lib/content/home-explore-categories';
import '@/components/home/hero-mobile-banner.css';

const mobBanners = HERO_MOB_BANNERS;
/** Same designed strip as desktop — never a separate phone-only promo list. */
const explorePromos = HOME_EXPLORE_BANNERS;
const collabItems = HERO_COLLAB_ITEMS;
const destinations = HERO_SEARCH_DESTINATIONS;
const catItems = HOME_EXPLORE_CATEGORIES;

type SearchCategory = 'all' | 'trek' | 'yatra' | 'international';

export default function Hero() {
  const router = useRouter();
  /* Resolve slides inside the component so HMR / season flips always refresh. */
  const deskSlides = useMemo(() => getHeroDeskSlides(), []);
  /* -- shared state -- */
  const [mobSlide, setMobSlide] = useState(0);
  const [collabIdx, setCollabIdx] = useState(0);
  const [collabFade, setCollabFade] = useState(true);
  const [deskSlide, setDeskSlide] = useState(0);
  const [destSlide, setDestSlide] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIdx, setSearchIdx] = useState(-1);
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const searchRef = useRef<HTMLInputElement>(null);
  const searchListRef = useRef<HTMLDivElement>(null);

  const searchItems = useMemo(() =>
    treks.map(t => ({
      id: t.id,
      title: t.title,
      type: t.type,
      sub: t.subtitle,
      region: t.region,
      image: t.cardImage || t.images[0],
    })), []);

  const searchResults = useMemo(() => {
    let items = searchItems;
    if (searchCategory === 'international') items = items.filter(s => s.region === 'nepal');
    else if (searchCategory !== 'all') items = items.filter(s => s.type === searchCategory);
    const q = searchQuery.toLowerCase().trim();
    if (q) items = items.filter(s => s.title.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q));
    return items.slice(0, 12);
  }, [searchQuery, searchItems, searchCategory]);

  const goSearch = useCallback((id: string, type: string) => {
    setShowSearch(false);
    setSearchQuery('');
    router.push(`/${type === 'yatra' ? 'yatra' : 'treks'}/${id}`);
  }, [router]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIdx(i => Math.min(i + 1, searchResults.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && searchResults.length > 0) {
      const idx = searchIdx >= 0 ? searchIdx : 0;
      goSearch(searchResults[idx].id, searchResults[idx].type);
    }
    if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); }
  }, [searchResults, searchIdx, goSearch]);

  /* scroll active search result into view */
  useEffect(() => {
    if (searchIdx < 0 || !searchListRef.current) return;
    const el = searchListRef.current.children[searchIdx] as HTMLElement;
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [searchIdx]);

  /* focus input when overlay opens */
  useEffect(() => { if (showSearch) setTimeout(() => searchRef.current?.focus(), 100); }, [showSearch]);

  const bannerTouchX = useRef(0);
  const bannerTouchY = useRef(0);
  const bannerTouchAt = useRef(0);
  const bannerPaused = useRef(false);
  const bannerSwiped = useRef(false);
  const MOB_VIDEO_MAX_SEC = 15;
  const [mobVideoReady, setMobVideoReady] = useState(false);

  const goMobBanner = useCallback((next: number | ((prev: number) => number), pauseMs = 8000) => {
    bannerPaused.current = true;
    window.setTimeout(() => { bannerPaused.current = false; }, pauseMs);
    setMobVideoReady(false);
    setMobSlide(next);
  }, []);

  const onBannerPointerDown = useCallback((x: number, y: number) => {
    bannerTouchX.current = x;
    bannerTouchY.current = y;
    bannerTouchAt.current = Date.now();
    bannerSwiped.current = false;
  }, []);

  const onBannerPointerUp = useCallback((x: number, y: number) => {
    const dx = x - bannerTouchX.current;
    const dy = y - bannerTouchY.current;
    const dt = Math.max(1, Date.now() - bannerTouchAt.current);
    // Prefer horizontal intent: ignore mostly-vertical scrolls.
    if (Math.abs(dx) < 28 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    const velocity = Math.abs(dx) / dt;
    if (Math.abs(dx) < 48 && velocity < 0.35) return;
    bannerSwiped.current = true;
    // Swipe left → next; swipe right → previous.
    goMobBanner((p) =>
      dx < 0
        ? (p + 1) % mobBanners.length
        : (p - 1 + mobBanners.length) % mobBanners.length,
    );
  }, [goMobBanner]);

  useEffect(() => {
    const t = setInterval(() => {
      setCollabFade(false);
      setTimeout(() => { setCollabIdx(p => (p + 1) % collabItems.length); setCollabFade(true); }, 200);
    }, 3000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
      const t = setInterval(() => setDeskSlide(p => (p + 1) % deskSlides.length), 5000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setDestSlide(p => (p + 1) % destinations.length), 2500);
    return () => clearInterval(t);
  }, []);

  /* ======================== DESKTOP LAYOUT ======================== */
  const slide = deskSlides[deskSlide];
  const href = `/${slide.t === 'yatra' ? 'yatra' : 'treks'}/${slide.id}`;

  const desktop = (
    <section
      className="relative flex min-h-[560px] w-full flex-col overflow-hidden lg:min-h-[640px]"
      style={{ height: `min(calc(100dvh - ${DESK_HEADER_H}px), 820px)` }}
    >
      {/* Background image layer */}
      {deskSlides.map((s, i) => (
        <div key={`${s.id}-${s.img}`}
          className={`absolute inset-0 transition-all duration-1000 ${i === deskSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
          <Image
            src={s.img}
            alt={s.name}
            fill
            priority={i === 0}
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover object-center"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />

      {/* Main content — centered after feature photo removal */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center py-4">
        <div className="container mx-auto w-full px-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center" key={slide.id}>
            <span className="mb-3 inline-block rounded-full border border-[#4ade80]/30 bg-[#16a34a]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4ade80]">
              {slide.t === 'yatra' ? 'Sacred Yatra' : 'Himalayan Trek'}
            </span>

            <p className="mb-1 text-sm font-medium tracking-wide text-white/80 xl:text-lg">
              Book your trip to
            </p>
            <h1 className="mb-2.5 whitespace-nowrap text-4xl font-bold leading-[1.1] text-[#4ade80] drop-shadow-[0_2px_12px_rgba(22,163,74,0.35)] xl:text-5xl">
              {slide.name}
            </h1>

            <p className="mb-6 max-w-xl text-sm leading-relaxed text-white/50 xl:text-base">
              {slide.sub}
            </p>

            <div className="flex items-center justify-center gap-3">
              <Link href={href}
                className="it-retro-btn it-retro-btn--primary it-retro-btn--pill it-retro-btn--md">
                View Full Details
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={`/booking/${slide.id}`}
                className="it-retro-btn it-retro-btn--glass it-retro-btn--pill it-retro-btn--md">
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="relative z-10 flex shrink-0 items-center justify-center px-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {deskSlides.map((_, i) => (
              <button key={i} onClick={() => setDeskSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === deskSlide ? 'bg-[#4ade80] w-6' : 'bg-white/30 hover:bg-white/50 w-1.5'}`} />
            ))}
          </div>
          <span className="hidden text-xs font-medium tracking-wide text-white/40 xl:block">{slide.name}</span>
        </div>
      </div>
    </section>
  );

  /* ======================== MOBILE LAYOUT ======================== */
  const mobile = (
    <section
      id="home-mobile-hero"
      className="relative overflow-hidden bg-white"
      style={{ background: 'var(--ih-mobile-hero-gradient)' }}
    >
      {/* In-flow top bar - part of the yellow page (no overlap). Sticky bar appears on scroll via Header. */}
      <div
        className="relative z-10 flex items-center justify-between px-4"
        style={{
          height: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <Link href="/" className="flex items-center">
          <BrandLogo className="h-9 w-auto max-w-[168px] object-contain object-left" />
        </Link>
        <div className="flex items-center gap-1">
          <a
            href={telUrl(CONTACT.phones.booking[0].tel)}
            aria-label={`Call booking line ${CONTACT.phones.booking[0].display}`}
            title={`Call ${CONTACT.phones.booking[0].display}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-colors hover:bg-white/40 active:scale-95"
          >
            <Phone className="h-5 w-5" aria-hidden />
          </a>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => window.dispatchEvent(new Event('indiantreks:open-menu'))}
            className="p-2 text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="relative z-0 px-4 pb-8 pt-1">

        <button type="button" onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-3 bg-white rounded-full px-3 py-2.5 shadow-[0_6px_20px_rgba(22,163,74,0.10)] border border-[#dcfce7] active:scale-[0.99] transition-transform">
          <div className="w-10 h-10 rounded-full bg-[#f0fdf4] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-[#16a34a]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[15px] font-bold text-gray-900 leading-tight">Where to?</div>
            <div className="text-[11px] text-gray-400 truncate">Destinations – Treks – Yatras</div>
          </div>
          <span className="text-[13px] font-semibold text-[#166534] bg-[#dcfce7] px-4 py-2 rounded-full shrink-0">Search</span>
        </button>

        {/* 2. Rating (left) + Rotating collab (right) */}
        <div className="flex items-center gap-2 mt-3.5">
          <Link href="/reviews"
            className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 active:scale-95 transition-transform shrink-0 shadow-sm">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
            </div>
            <span className="text-sm font-bold text-gray-800">4.8</span>
            <span className="text-[11px] text-gray-500 font-medium">(10k+)</span>
          </Link>

          <div className="flex-1 min-w-0 flex justify-end">
            {(() => {
              const c = collabItems[collabIdx];
              const Icon = HERO_COLLAB_LUCIDE_ICONS[c.icon];
              return (
                <Link key={c.id} href={c.href}
                  className={`flex items-center gap-1.5 bg-white border border-[#dcfce7] rounded-full px-3 py-1.5 shadow-sm active:scale-95 transition-all duration-200 ${collabFade ? 'opacity-100' : 'opacity-0'}`}>
                  <Icon className="w-3.5 h-3.5 text-[#16a34a]" />
                  <span className="text-[11px] font-semibold text-gray-700">{c.label}</span>
                </Link>
              );
            })()}
          </div>
        </div>

        <div
          className="relative mt-3 select-none overflow-hidden rounded-[22px] bg-[#14532d] shadow-[0_10px_28px_rgba(20,83,45,0.28)] touch-pan-y"
          onTouchStart={(e) => {
            const t = e.touches[0];
            onBannerPointerDown(t.clientX, t.clientY);
          }}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            onBannerPointerUp(t.clientX, t.clientY);
          }}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse') onBannerPointerDown(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            if (e.pointerType === 'mouse') onBannerPointerUp(e.clientX, e.clientY);
          }}
        >
          <div className="relative h-[188px]">
            {mobBanners.map((slide, i) => (
              <Link
                key={`${slide.href}-${slide.title}-${i}`}
                href={slide.href}
                draggable={false}
                className={`absolute inset-0 block transition-opacity duration-300 ease-out ${i === mobSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                onClick={(e) => {
                  if (bannerSwiped.current) {
                    e.preventDefault();
                    bannerSwiped.current = false;
                  }
                }}
                tabIndex={i === mobSlide ? 0 : -1}
              >
                {i === mobSlide ? (
                  <video
                    key={`mob-vid-${i}`}
                    className={`pointer-events-none absolute inset-0 h-full w-full object-cover bg-[#14532d] transition-opacity duration-200 ${mobVideoReady ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    poster=""
                    aria-label={slide.title}
                    onPlaying={() => setMobVideoReady(true)}
                    onTimeUpdate={(e) => {
                      if (e.currentTarget.currentTime < MOB_VIDEO_MAX_SEC) return;
                      e.currentTarget.pause();
                      goMobBanner((p) => (p + 1) % mobBanners.length, 500);
                    }}
                    onEnded={() => goMobBanner((p) => (p + 1) % mobBanners.length, 500)}
                  >
                    <source src={slide.video} type="video/mp4" />
                  </video>
                ) : (
                  <div className="absolute inset-0 bg-[#14532d]" aria-hidden />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/70 via-black/20 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[58%] flex-col items-end justify-end px-3.5 pb-3.5 pt-8 text-right">
                  <h2 className="text-[14px] font-semibold tracking-[-0.01em] leading-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                    {slide.title}
                  </h2>
                  <p className="mt-0.5 text-[10px] font-medium leading-snug text-white/80">
                    {slide.subtitle}
                  </p>
                  <span className="it-hero-mob-cta mt-1.5">
                    {slide.cta}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <CategoryScroller items={catItems} variant="mobile" />

        <div className="mt-4">
          <Banners items={explorePromos} embedded priorityFirst />
        </div>
      </div>
    </section>
  );

  return (
    <>
      <div className="lg:hidden">{mobile}</div>
      <div className="hidden lg:block">{desktop}</div>

      {/* -- Search Overlay -- */}
      {showSearch && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) { setShowSearch(false); setSearchQuery(''); } }}>
          <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Search className="w-5 h-5 text-[#16a34a] shrink-0" />
              <input ref={searchRef} type="text" autoComplete="off" aria-label="Search treks & yatras"
                placeholder="Search treks, yatras, destinations..."
                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchIdx(-1); }}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 bg-transparent outline-none text-base text-gray-800 placeholder:text-gray-400" />
              <button type="button" onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-1.5 px-4 py-2 border-b border-gray-100 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'trek', label: 'Treks' },
                { key: 'yatra', label: 'Yatras' },
                { key: 'international', label: 'International' },
              ].map(c => (
                <button key={c.key} type="button" onClick={() => { setSearchCategory(c.key as SearchCategory); setSearchIdx(-1); }}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${searchCategory === c.key ? 'bg-[#16a34a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div ref={searchListRef} className="max-h-[55vh] overflow-y-auto py-2">
              {searchQuery.trim() && searchResults.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No results found for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-xs text-gray-300 mt-1">Try a different search term</p>
                </div>
              )}
              {!searchQuery.trim() && searchCategory === 'all' && (
                <div className="px-5 py-8 text-center">
                  <Mountain className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Type to search or select a category below</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                    {destinations.map(tag => (
                      <button key={tag} type="button" onClick={() => { setSearchQuery(tag); setSearchIdx(-1); searchRef.current?.focus(); }}
                        className="text-xs bg-gray-100 hover:bg-[#16a34a]/10 hover:text-[#166534] text-gray-500 px-3 py-1.5 rounded-full transition-colors">
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Browse mode: show grid of cards when a category is selected with no search query */}
              {!searchQuery.trim() && searchCategory !== 'all' && (
                <div className="px-3 py-1">
                  <p className="text-xs text-gray-400 font-medium px-1 mb-2 uppercase tracking-wider">
                    {searchCategory === 'trek' ? 'All Treks' : searchCategory === 'yatra' ? 'All Yatras' : 'International Adventures'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {treks
                      .filter(t => searchCategory === 'international' ? t.region === 'nepal' : t.type === searchCategory)
                      .slice(0, 12)
                      .map(t => (
                        <Link key={t.id} href={`/${t.type === 'yatra' ? 'yatra' : 'treks'}/${t.id}`}
                          onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                          className="group relative rounded-xl overflow-hidden aspect-[4/5]">
                          <Image
                            src={t.images[0]}
                            alt={t.title}
                            fill
                            sizes="120px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute top-2 left-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.type === 'yatra' ? 'bg-[#16a34a] text-white' : 'bg-emerald-500/80 text-white'}`}>
                              {t.type === 'yatra' ? 'Yatra' : 'Trek'}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <h4 className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{t.title}</h4>
                            <div className="flex items-center gap-1 text-[10px] text-white/60 mt-0.5">
                              <span>{t.duration}</span>
                              <span className="text-white/30">-</span>
                              <span>₹{Math.min(...t.pricing.map(p => p.price)).toLocaleString()}</span>
                            </div>
                          </div>
                        </Link>
                    ))}
                  </div>
                  <Link href={searchCategory === 'yatra' ? '/yatra' : '/treks'}
                    onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                    className="block text-center text-xs text-[#16a34a] font-semibold py-3 hover:underline">
                    View All {searchCategory === 'trek' ? 'Treks' : searchCategory === 'yatra' ? 'Yatras' : 'International'} ?
                  </Link>
                </div>
              )}
              {searchQuery.trim() && searchResults.length > 0 && searchResults.map((s, i) => (
                <button key={s.id} type="button" onClick={() => goSearch(s.id, s.type)}
                  onMouseEnter={() => setSearchIdx(i)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${i === searchIdx ? 'bg-[#16a34a]/10' : 'hover:bg-gray-50'}`}>
                  <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{s.title}</div>
                    <div className="text-xs text-gray-400 truncate">{s.sub}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.type === 'yatra' ? 'bg-[#166534] text-white' : 'bg-[#dcfce7] text-[#166534]'}`}>
                      {s.type === 'yatra' ? 'Yatra' : 'Trek'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
