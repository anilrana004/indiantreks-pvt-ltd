'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  ChevronRight,
  Heart,
  HelpCircle,
  LogIn,
  LogOut,
  Phone,
  UserRound,
} from 'lucide-react';
import type { PublicUser } from '@/lib/user-auth/types';
import { USER_TOKEN_STORAGE_KEY } from '@/lib/user-auth/constants';
import { getWishlistIds } from '@/lib/wishlist';
import { CONTACT, telUrl } from '@/lib/contact';

type MenuRow = {
  href: string;
  label: string;
  description: string;
  icon: typeof CalendarCheck;
  badge?: number;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'IT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export default function ProfileHub() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [wishCount, setWishCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  const syncWishlist = useCallback(() => {
    setWishCount(getWishlistIds().length);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/user/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            setAuthChecked(true);
          }
          return;
        }
        const body = (await res.json()) as { user: PublicUser };
        if (!cancelled) {
          setUser(body.user);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setAuthChecked(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    syncWishlist();
    window.addEventListener('indiantreks:wishlist', syncWishlist);
    return () => window.removeEventListener('indiantreks:wishlist', syncWishlist);
  }, [syncWishlist]);

  const logout = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/user/auth/logout', { method: 'POST', credentials: 'include' });
      try {
        sessionStorage.removeItem(USER_TOKEN_STORAGE_KEY);
      } catch {
        // ignore
      }
      setUser(null);
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const tripRows: MenuRow[] = [
    {
      href: '/bookings',
      label: 'Bookings',
      description: 'Upcoming, past, and cancelled trips',
      icon: CalendarCheck,
    },
    {
      href: '/wishlist',
      label: 'Wishlist',
      description: 'Saved treks and yatras',
      icon: Heart,
      badge: wishCount,
    },
  ];

  const accountRows: MenuRow[] = user
    ? [
        {
          href: '/user-dashboard',
          label: 'My account',
          description: 'Dashboard, profile, and trek history',
          icon: UserRound,
        },
      ]
    : [
        {
          href: '/login?from=/profile',
          label: 'Sign in',
          description: 'Access bookings and member perks',
          icon: LogIn,
        },
      ];

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <section className="overflow-hidden rounded-2xl border border-[#d8e8dc] bg-white shadow-[0_8px_24px_-16px_rgba(15,23,42,0.22)]">
        <div className="bg-gradient-to-br from-[#0b4a28] via-[#0f6b3a] to-[#16a34a] px-5 py-6 text-white">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-bold tracking-wide ring-2 ring-white/25"
              aria-hidden
            >
              {authChecked && user ? initials(user.name) : <UserRound className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              {!authChecked ? (
                <p className="text-sm text-white/80">Loading profile…</p>
              ) : user ? (
                <>
                  <h1 className="truncate text-lg font-bold leading-tight">{user.name}</h1>
                  <p className="mt-0.5 truncate text-sm text-white/80">{user.email}</p>
                </>
              ) : (
                <>
                  <h1 className="text-lg font-bold leading-tight">Your profile</h1>
                  <p className="mt-0.5 text-sm text-white/80">
                    Bookings and wishlist live here
                  </p>
                </>
              )}
            </div>
          </div>
          {!authChecked || user ? null : (
            <Link
              href="/login?from=/profile"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b4a28] transition hover:bg-white/95"
            >
              Sign in
            </Link>
          )}
        </div>
      </section>

      <MenuGroup title="Your trips" rows={tripRows} />
      <MenuGroup title="Account" rows={accountRows} />

      <MenuGroup
        title="Help"
        rows={[
          {
            href: '/help-centre',
            label: 'Help centre',
            description: 'FAQs, safety, and trip prep',
            icon: HelpCircle,
          },
          {
            href: telUrl(CONTACT.phones.booking[0].tel),
            label: 'Call booking desk',
            description: CONTACT.phones.booking[0].display,
            icon: Phone,
          },
        ]}
      />

      {user ? (
        <button
          type="button"
          onClick={() => void logout()}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      ) : null}
    </div>
  );
}

function MenuGroup({ title, rows }: { title: string; rows: MenuRow[] }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h2>
      <ul className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {rows.map((row, index) => {
          const Icon = row.icon;
          const external = row.href.startsWith('tel:');
          const className = `flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100 ${
            index > 0 ? 'border-t border-slate-100' : ''
          }`;
          const body = (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#16a34a]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{row.label}</span>
                  {typeof row.badge === 'number' && row.badge > 0 ? (
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#16a34a] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {row.badge > 99 ? '99+' : row.badge}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{row.description}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </>
          );

          return (
            <li key={row.href}>
              {external ? (
                <a href={row.href} className={className}>
                  {body}
                </a>
              ) : (
                <Link href={row.href} className={className}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
