'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, User } from 'lucide-react';
import { isSupportHubPath } from '@/lib/support-hub-nav';
import { isBlogPath } from '@/lib/blog-nav';
import { isCorporateHubPath } from '@/lib/corporate-hub-nav';
import { isSpecialProgramsHubPath } from '@/lib/special-programs-hub-nav';

const items = [
  { label: 'Home', href: '/', icon: Home, match: (path: string) => path === '/' },
  {
    label: 'Explore',
    href: '/treks',
    icon: Compass,
    match: (path: string) =>
      path.startsWith('/treks') ||
      path.startsWith('/yatra') ||
      path.startsWith('/trips') ||
      path.startsWith('/best-sellers') ||
      path.startsWith('/upcoming-trips'),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
    match: (path: string) =>
      path.startsWith('/profile') ||
      path.startsWith('/bookings') ||
      path.startsWith('/wishlist') ||
      path.startsWith('/user-dashboard') ||
      path.startsWith('/login') ||
      path.startsWith('/signup'),
  },
] as const;

/** Detail / checkout pages use their own sticky Book CTA instead of tab bar. */
function shouldHideNav(path: string) {
  if (path.startsWith('/booking/')) return true;
  if (/^\/treks\/[^/]+\/?$/.test(path)) return true;
  if (/^\/yatra\/[^/]+\/?$/.test(path)) return true;
  if (/^\/trips\/[^/]+\/?$/.test(path)) return true;
  return false;
}

export default function MobileBottomNav() {
  const path = usePathname() ?? '';
  if (
    shouldHideNav(path) ||
    isSupportHubPath(path) ||
    isCorporateHubPath(path) ||
    isSpecialProgramsHubPath(path) ||
    isBlogPath(path)
  ) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-[62px] max-w-lg items-center justify-around">
        {items.map((item) => {
          const active = item.match(path);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-[#16a34a]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {active ? (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#16a34a]" />
              ) : null}
              <item.icon className={`h-[22px] w-[22px] ${active ? 'fill-[#16a34a]/15' : ''}`} />
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
