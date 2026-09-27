'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Phone, Search, ChevronDown, Sparkles, Star, Mail, Mountain } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { CONTACT, mailtoUrl, SOCIAL_LINKS, telUrl, whatsappUrl } from '@/lib/contact';
import { DESK_HEADER_H, DESK_MAIN_H, DESK_TOP_H, CHROME_HIDDEN_CLASS } from '@/lib/layout';
import { isSupportHubPath } from '@/lib/support-hub-nav';
import { isBlogPath } from '@/lib/blog-nav';
import { isCorporateHubPath } from '@/lib/corporate-hub-nav';
import { isSpecialProgramsHubPath } from '@/lib/special-programs-hub-nav';
import { STOREFRONT_BLUR_DATA_URL } from '@/lib/cloudinary';
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
import RichNavDropdown from '@/components/nav/RichNavDropdown';
import HeaderAuthControls from '@/components/HeaderAuthControls';
import HeaderSearch from '@/components/HeaderSearch';
import {
  headerSearchFallbackHref,
  searchHeaderContent,
} from '@/lib/header-search';

const TOP_STRIP_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faqs' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Gear Rental', href: '/gear-rental' },
  { label: 'Payment Policy', href: '/payment-policy' },
  { label: 'Blogs', href: '/blog' },
] as const;

type NavItem = {
  label: string;
  href: string;
  richMenu?: RichNavItem[];
  sale?: boolean;
  star?: boolean;
  shortLabel?: string;
};

const navItems: NavItem[] = [
  {
    label: 'Group Trips',
    shortLabel: 'Group',
    href: '/group-trips',
    richMenu: GROUP_TRIPS_RICH,
  },
  {
    label: 'Customized',
    href: '#',
    richMenu: CUSTOMIZED_RICH,
  },
  { label: 'Bucket List Sale', shortLabel: 'Sale', href: '/bucket-list-sale', sale: true },
  {
    label: 'Trending',
    href: '/trending',
    richMenu: TRENDING_RICH,
  },
  {
    label: 'Sacred Yatra',
    shortLabel: 'Yatra',
    href: '/yatra',
    richMenu: YATRA_RICH,
  },
  {
    label: 'Learning Programs',
    shortLabel: 'Learning',
    href: '/corporate',
    richMenu: LEARNING_RICH,
  },
  {
    label: 'Special Programs',
    shortLabel: 'Special',
    href: '/special-programs',
    richMenu: SPECIAL_RICH,
    star: true,
  },
  {
    label: 'More',
    href: '#',
    richMenu: MORE_RICH,
  },
];

/** Extra mobile accordion — keep empty of anything already in primary navItems. */
const mobileLinkSections: { title: string; links: { l: string; h: string }[] }[] = [];

const deskNavLink =
  'inline-flex h-7 items-center gap-0.5 whitespace-nowrap rounded-md px-1.5 text-[11px] font-medium text-white/95 transition-colors hover:bg-white/10 hover:text-white xl:gap-0.5 xl:px-2 xl:text-[11.5px] 2xl:px-2.5 2xl:text-[12px]';

function NavLabel({
  label,
  shortLabel,
  star,
}: {
  label: string;
  shortLabel?: string;
  star?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" title={shortLabel ? label : undefined}>
      {shortLabel ? (
        <>
          <span className="min-[1760px]:hidden">{shortLabel}</span>
          <span className="hidden min-[1760px]:inline">{label}</span>
        </>
      ) : (
        label
      )}
      {star ? (
        <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
      ) : null}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const isSupportHub = isSupportHubPath(pathname);
  const isBlog = isBlogPath(pathname);
  const isCorporateHub = isCorporateHubPath(pathname);
  const isSpecialProgramsHub = isSpecialProgramsHubPath(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string[]>([]);
  const [mobileAccordion, setMobileAccordion] = useState<number | null>(null);
  /** 0 = in-flow green chrome, 1 = sticky bar visible (homepage only) */
  const [navSolid, setNavSolid] = useState(0);
  /** Homepage scroll — drives sticky header wash → white blend */
  const [homeScrollY, setHomeScrollY] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isHome = pathname === '/';

  useEffect(() => {
    if (!isHome) {
      setHomeScrollY(0);
      setNavSolid(1);
      return;
    }

    const CHROME_SHOW = 12;
    const update = () => {
      const y = window.scrollY;
      setHomeScrollY(y);
      setNavSolid(y > CHROME_SHOW ? 1 : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [isHome]);

  /** Sticky mobile header bg tracks scroll — green when over wash, white over white zone */
  const mobileHeaderWash = useMemo(() => {
    if (!isHome) return 1;
    const chrome = 56;
    const fadeEnd = 172;
    return Math.min(1, Math.max(0, (homeScrollY - chrome) / (fadeEnd - chrome)));
  }, [isHome, homeScrollY]);

  /** Hide chrome while scrolling down; reveal on scroll up (Roopkund Heaven pattern). */
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle(CHROME_HIDDEN_CLASS, hidden);
    return () => document.documentElement.classList.remove(CHROME_HIDDEN_CLASS);
  }, [hidden]);

  const [mobSearch, setMobSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIdx, setSearchIdx] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchListRef = useRef<HTMLDivElement>(null);

  // Hero in-flow bar dispatches these (IndiaHikes: logo/menu live in the brand wash)
  useEffect(() => {
    const openMenu = () => setIsOpen(true);
    const openSearch = () => setMobSearch(true);
    window.addEventListener('indiantreks:open-menu', openMenu);
    window.addEventListener('indiantreks:open-search', openSearch);
    return () => {
      window.removeEventListener('indiantreks:open-menu', openMenu);
      window.removeEventListener('indiantreks:open-search', openSearch);
    };
  }, []);

  const blockHide = isOpen || mobSearch || openDropdown !== null;

  useEffect(() => {
    if (blockHide) {
      setHidden(false);
      return;
    }

    const HIDE_AFTER = 72;
    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const current = Math.max(0, window.scrollY);
      const delta = current - last;

      // Always show near the top of the page
      if (current <= HIDE_AFTER) {
        setHidden(false);
      } else if (delta > 4) {
        // Scrolling down → hide (Roopkund Heaven / industry standard)
        setHidden(true);
        setOpenDropdown(null);
      } else if (delta < -4) {
        // Scrolling up → show
        setHidden(false);
      }

      last = current;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [blockHide]);

  /** Homepage mobile: hide fixed bar until scroll (green hero chrome shows instead). Other pages: always solid white. */
  const showFixedMobile = !isHome || navSolid > 0 || isOpen;

  const mobileHeaderBg = isHome
    ? `color-mix(in srgb, var(--ih-wash) ${Math.round((1 - mobileHeaderWash) * 100)}%, #ffffff ${Math.round(mobileHeaderWash * 100)}%)`
    : '#ffffff';
  const mobileHeaderShadow =
    mobileHeaderWash > 0.55 ? '0 1px 10px rgba(16, 24, 20, 0.08)' : 'none';
  const mobileHeaderBorder =
    mobileHeaderWash > 0.55 ? '1px solid #e8ece9' : '1px solid transparent';

  const searchResults = useMemo(
    () => searchHeaderContent(searchQuery, 20),
    [searchQuery],
  );

  const goSearch = (href: string) => {
    setMobSearch(false);
    setSearchQuery('');
    setSearchIdx(-1);
    router.push(href);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIdx((i) => Math.min(i + 1, searchResults.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchIdx >= 0 && searchResults[searchIdx]) {
        goSearch(searchResults[searchIdx].href);
      } else if (searchResults[0]) {
        goSearch(searchResults[0].href);
      } else {
        goSearch(headerSearchFallbackHref(searchQuery));
      }
    }
    if (e.key === 'Escape') {
      setMobSearch(false);
      setSearchQuery('');
      setSearchIdx(-1);
    }
  };

  useEffect(() => {
    if (searchIdx >= 0 && searchListRef.current) {
      const el = searchListRef.current.children[searchIdx] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [searchIdx]);

  useEffect(() => {
    if (!mobSearch) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [mobSearch]);

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);

  const handleMouseEnter = useCallback((label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(label);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 150);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenDropdown(null); setIsOpen(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const closeMobile = useCallback(() => { setIsOpen(false); setMobileOpen([]); }, []);

  const toggleMobileSubmenu = useCallback((label: string) => {
    setMobileOpen(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  }, []);

  /** Support / corporate hub pages use their own dedicated headers */
  if (isSupportHub || isCorporateHub || isSpecialProgramsHub || isBlog) {
    return null;
  }

  return (
    <div ref={headerRef}>
      {/* Desktop: compact dark-green chrome. Fixed + reserved spacer = no overlap.
          Hide on scroll-down / show on scroll-up (Roopkund Heaven pattern). */}
      <header
        className="fixed left-0 top-0 z-50 hidden w-full overflow-visible lg:block"
        style={{
          height: DESK_HEADER_H,
          transform: hidden ? 'translateY(-110%)' : 'translateY(0)',
          transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        {/* Top utility strip — contact left, quick links right */}
        <div
          className="flex items-center justify-between gap-6 px-5 xl:px-8 2xl:px-12"
          style={{ height: DESK_TOP_H, background: '#062816' }}
          aria-label="Utility links"
        >
          <div className="flex min-w-0 items-center gap-2.5 text-[11px] font-medium text-white xl:gap-3 xl:text-[12px]">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-85"
              aria-label={`WhatsApp ${CONTACT.phoneDisplay}`}
            >
              <i className="fa-brands fa-whatsapp text-[13px] text-[#25D366]" aria-hidden />
              <span className="whitespace-nowrap">{CONTACT.phoneDisplay}</span>
            </a>
            <span className="text-white/35 select-none" aria-hidden>
              |
            </span>
            <a
              href={mailtoUrl()}
              className="inline-flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-85"
            >
              <Mail className="h-3 w-3 shrink-0 text-white/90" aria-hidden />
              <span className="truncate">{CONTACT.email}</span>
            </a>
          </div>

          <nav
            className="hidden items-center gap-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-white sm:flex xl:text-[11px]"
            aria-label="Quick links"
          >
            {TOP_STRIP_LINKS.map((item, i) => (
              <span key={item.href} className="inline-flex items-center">
                {i > 0 ? (
                  <span className="mx-2 text-white/35 select-none xl:mx-2.5" aria-hidden>
                    |
                  </span>
                ) : null}
                <Link
                  href={item.href}
                  className="whitespace-nowrap transition-opacity hover:opacity-80"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>

        {/* Main nav bar */}
        <div
          className="grid items-stretch overflow-visible"
          style={{
            height: DESK_MAIN_H,
            background: 'linear-gradient(180deg, #0b4a28 0%, #0a3d22 100%)',
            gridTemplateColumns: 'auto minmax(0, 1fr) auto',
          }}
        >
          <Link
            href="/"
            className="relative z-20 flex h-full shrink-0 items-center bg-white px-3 shadow-[4px_0_12px_rgba(0,0,0,0.12)] xl:px-4"
            aria-label="Indian Treks home"
          >
            <BrandLogo className="h-6 w-auto max-w-[124px] object-contain object-left xl:h-7 xl:max-w-[148px] min-[1760px]:max-w-[168px]" />
          </Link>

          {/*
            Center nav — keep overflow visible so rich dropdown panels can extend
            below the bar; compact labels + search sizing prevent horizontal crowding.
          */}
          <nav
            className={`relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center overflow-visible px-1 xl:px-1.5 min-[1760px]:px-2 ${openDropdown ? 'z-30' : 'z-10'}`}
            aria-label="Primary"
          >
            <div aria-hidden="true" />
            <div className="flex max-w-full items-center justify-center gap-0 xl:gap-0.5">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative shrink-0"
                onMouseEnter={() => item.richMenu && handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                {item.sale ? (
                  <Link
                    href={item.href}
                    className="mx-0.5 inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full bg-[#16a34a] px-2.5 text-[11px] font-bold text-white shadow-md shadow-black/20 transition-colors hover:bg-[#15803d] xl:mx-1 xl:px-3 xl:text-[11.5px] min-[1760px]:text-[12px]"
                    title={item.label}
                  >
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span className="min-[1760px]:hidden">{item.shortLabel ?? item.label}</span>
                    <span className="hidden min-[1760px]:inline">{item.label}</span>
                  </Link>
                ) : item.richMenu ? (
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    aria-expanded={openDropdown === item.label}
                    aria-haspopup="true"
                    className={deskNavLink}
                  >
                    <NavLabel label={item.label} shortLabel={item.shortLabel} star={item.star} />
                    <ChevronDown
                      className={`h-3 w-3 shrink-0 text-white/80 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link href={item.href} className={deskNavLink}>
                    <NavLabel label={item.label} shortLabel={item.shortLabel} star={item.star} />
                  </Link>
                )}
                {item.richMenu && openDropdown === item.label && (
                  <div
                    className={`absolute top-full z-[100] pt-1 ${item.label === 'More' || item.label === 'Special Programs' ? 'right-0' : 'left-0'}`}
                    onMouseEnter={() => {
                      if (closeTimer.current) clearTimeout(closeTimer.current);
                      setOpenDropdown(item.label);
                    }}
                    onMouseLeave={handleMouseLeave}
                  >
                    <RichNavDropdown
                      items={item.richMenu}
                      onClose={closeDropdown}
                      align={
                        item.label === 'More' || item.label === 'Special Programs'
                          ? 'right'
                          : 'left'
                      }
                    />
                  </div>
                )}
              </div>
            ))}
            </div>
            <div aria-hidden="true" />
          </nav>

          <div
            className="relative z-20 flex shrink-0 items-center gap-1.5 px-2 xl:gap-2 xl:px-3 min-[1760px]:gap-2.5 min-[1760px]:px-4"
            style={{ background: 'linear-gradient(180deg, #0b4a28 0%, #0a3d22 100%)' }}
          >
            <HeaderSearch onNavigate={() => setOpenDropdown(null)} />

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${CONTACT.phoneDisplay}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#bbf7d0] bg-white text-[#25D366] shadow-sm transition-colors hover:bg-[#f0fdf4]"
            >
              <i className="fa-brands fa-whatsapp text-[15px]" aria-hidden />
            </a>

            <HeaderAuthControls variant="desktop" />
          </div>
        </div>
      </header>

      {/* Homepage desktop: reserve space under fixed header (no overlap; no jump when chrome hides) */}
      {isHome && (
        <div
          aria-hidden
          className="hidden shrink-0 lg:block"
          style={{ height: DESK_HEADER_H }}
        />
      )}

      {/*
        Mobile header (IndiaHikes flow):
        - Homepage top: hidden — logo/menu live in the green hero wash (document flow)
        - After scroll (and all other pages): solid white sticky bar
      */}
      <header
        className={`fixed left-0 top-0 w-full lg:hidden ${isOpen ? 'z-[70]' : 'z-50'}`}
        style={{
          backgroundColor: showFixedMobile ? mobileHeaderBg : 'transparent',
          boxShadow: showFixedMobile ? mobileHeaderShadow : 'none',
          borderBottom: showFixedMobile ? mobileHeaderBorder : 'none',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          transform: showFixedMobile && !hidden ? 'translateY(0)' : 'translateY(-110%)',
          opacity: showFixedMobile && !hidden ? 1 : 0,
          pointerEvents: showFixedMobile && !hidden ? 'auto' : 'none',
          transition:
            'transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease, background-color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        }}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" onClick={() => { if (isOpen) setIsOpen(false); }}>
            <BrandLogo className="h-7 w-auto max-w-[156px] object-contain object-left" />
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setMobSearch(true);
                setSearchIdx(-1);
              }}
              aria-label="Search treks"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-colors hover:bg-black/5 active:scale-95"
            >
              <Search className="h-5 w-5" aria-hidden />
            </button>
            <a
              href={telUrl(CONTACT.phones.booking[0].tel)}
              aria-label={`Call booking line ${CONTACT.phones.booking[0].display}`}
              title={`Call ${CONTACT.phones.booking[0].display}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-900 transition-colors hover:bg-black/5 active:scale-95"
            >
              <Phone className="h-5 w-5" aria-hidden />
            </a>
            <button type="button" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? 'Close menu' : 'Open menu'} aria-expanded={isOpen} className="p-2 text-gray-900">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Non-home pages: reserve space under fixed mobile header */}
      {!isHome && (
        <div
          aria-hidden
          className="lg:hidden"
          style={{ height: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
        />
      )}

      {/* Mobile Drawer */}
      {isOpen && (
        <div role="dialog" aria-modal="true" aria-label="Mobile navigation" className="fixed inset-x-0 top-0 bottom-0 z-[60] bg-white lg:hidden flex flex-col">
          <div className="h-14 flex items-center justify-end px-4 border-b border-gray-100">
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close menu" className="p-2 text-gray-700 hover:text-gray-900">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-8">
            <div className="p-4 space-y-0.5">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.richMenu ? (
                    <div>
                      <button type="button" onClick={() => toggleMobileSubmenu(item.label)}
                        aria-expanded={mobileOpen.includes(item.label)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-gray-800 rounded-xl hover:bg-gray-50 transition-colors">
                        <NavLabel label={item.label} star={item.star} />
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileOpen.includes(item.label) ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileOpen.includes(item.label) && (
                        <div className="mt-1 mb-2 space-y-0.5 rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
                          {item.richMenu.map((sub) => {
                            const Icon = sub.Icon;
                            return (
                              <Link
                                key={sub.id}
                                href={sub.href}
                                onClick={closeMobile}
                                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50"
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${sub.iconTile}`}
                                >
                                  <Icon className={`h-3.5 w-3.5 ${sub.iconColor}`} aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-1">
                                    <span className="text-[12px] font-semibold leading-tight text-gray-900">
                                      {sub.title}
                                    </span>
                                    {sub.live ? (
                                      <span className="rounded bg-red-500 px-1 py-px text-[7px] font-bold uppercase leading-none tracking-wide text-white">
                                        Live!
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="mt-px block text-[10px] leading-snug text-gray-500">
                                    {sub.subtitle}
                                  </span>
                                </span>
                                <ChevronDown className="h-3 w-3 shrink-0 -rotate-90 text-gray-400" aria-hidden />
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : item.sale ? (
                    <Link href={item.href} onClick={closeMobile}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-white bg-[#16a34a] rounded-full mx-4 my-2 shadow-lg shadow-[#16a34a]/25">
                      <Sparkles className="w-4 h-4" /> {item.label}
                    </Link>
                  ) : (
                    <Link href={item.href} onClick={closeMobile}
                      className="block px-4 py-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">
                      <NavLabel label={item.label} star={item.star} />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 mt-2">
              <div className="bg-[#f0fdf4] rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Contact Us</p>
                {CONTACT.offices.map((office) => (
                  <div key={office.id} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{office.label}</p>
                      <p className="text-xs text-gray-500">{office.line1}, {office.line2}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-700">Booking</p>
                    {CONTACT.phones.booking.map((phone) => (
                      <a key={phone.tel} href={telUrl(phone.tel)} className="block text-xs text-gray-600 hover:text-[#16a34a]">{phone.display}</a>
                    ))}
                    <p className="text-xs font-semibold text-gray-700 pt-1">Support</p>
                    <a href={telUrl(CONTACT.phones.support.tel)} className="block text-xs text-gray-600 hover:text-[#16a34a]">{CONTACT.phones.support.display}</a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <div className="space-y-1">
                    <a href={mailtoUrl(undefined, undefined, CONTACT.emails.primary)} className="block text-xs text-gray-600 hover:text-[#16a34a]">{CONTACT.emails.primary}</a>
                    <a href={mailtoUrl(undefined, undefined, CONTACT.emails.vivek)} className="block text-xs text-gray-600 hover:text-[#16a34a]">{CONTACT.emails.vivek}</a>
                  </div>
                </div>
              </div>
            </div>

            {mobileLinkSections.length > 0 ? (
              <div className="px-4 mt-4 space-y-0.5">
                {mobileLinkSections.map((s, i) => (
                  <div key={s.title} className="border-b border-gray-100">
                    <button type="button" onClick={() => setMobileAccordion(mobileAccordion === i ? null : i)}
                      aria-expanded={mobileAccordion === i}
                      className="w-full flex items-center justify-between py-3.5 px-1 text-sm font-semibold text-gray-800">
                      {s.title}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileAccordion === i ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileAccordion === i && (
                      <div className="pb-3 space-y-1 px-1">
                        {s.links.map(l => (
                          <Link key={l.l} href={l.h} onClick={closeMobile}
                            className="block text-sm text-gray-500 hover:text-[#16a34a] py-1.5">
                            {l.l}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="px-4 mt-6 mb-4">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {SOCIAL_LINKS.map((link) => (
                  <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#16a34a] text-[10px] font-bold uppercase text-white">
                    {link.label.slice(0, 2)}
                  </a>
                ))}
              </div>
            </div>

            <div className="px-4 mt-4 space-y-3">
              <div className="rounded-full overflow-hidden border border-[#16a34a]">
                <HeaderAuthControls variant="mobile" onNavigate={closeMobile} />
              </div>
              <a href={telUrl()}
                className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-full w-full">
                <Phone className="w-4 h-4" /> {CONTACT.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay — desktop + mobile */}
      {mobSearch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search treks and yatras"
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[12vh] backdrop-blur-sm lg:pt-[18vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobSearch(false);
              setSearchQuery('');
              setSearchIdx(-1);
            }
          }}
        >
          <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30 lg:max-w-xl">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-[#16a34a]" />
              <input
                ref={searchRef}
                type="text"
                autoComplete="off"
                aria-label="Search treks & yatras"
                placeholder="Search treks, yatras, destinations..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchIdx(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 bg-transparent text-base text-gray-800 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => {
                  setMobSearch(false);
                  setSearchQuery('');
                  setSearchIdx(-1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div ref={searchListRef} className="max-h-[50vh] overflow-y-auto lg:max-h-[55vh]">
              {searchQuery.trim() && searchResults.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Search className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    No results found for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-gray-300">Try a different search term</p>
                  <button
                    type="button"
                    onClick={() => goSearch(headerSearchFallbackHref(searchQuery))}
                    className="mt-4 rounded-full bg-[#16a34a] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Browse all treks
                  </button>
                </div>
              )}
              {!searchQuery.trim() && (
                <div className="px-5 py-8 text-center">
                  <Mountain className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">Type to search treks, lists &amp; destinations</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {[
                      'Kedarkantha',
                      'September',
                      'Uttarakhand',
                      'Kashmir',
                      'Everest',
                      'Kedarnath',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag);
                          setSearchIdx(-1);
                          searchRef.current?.focus();
                        }}
                        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-[#16a34a]/10 hover:text-[#166534]"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="border-b border-gray-100 px-5 py-2.5 text-sm text-gray-500">
                  Search results for{' '}
                  <span className="font-medium text-gray-700">{searchQuery.trim()}</span>
                </div>
              )}
              {searchResults.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goSearch(s.href)}
                  onMouseEnter={() => setSearchIdx(i)}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3 text-left last:border-b-0 transition-colors ${i === searchIdx ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  <span className="relative h-12 w-[3.75rem] shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="60px"
                      placeholder="blur"
                      blurDataURL={STOREFRONT_BLUR_DATA_URL}
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-800">{s.title}</div>
                    <div className="mt-0.5 truncate text-xs text-gray-400">{s.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
