'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  CalendarCheck,
  CalendarDays,
  Compass,
  Heart,
  LogOut,
  Mountain,
  UserRound,
} from 'lucide-react';
import type { PublicUser } from '@/lib/user-auth/types';
import { USER_TOKEN_STORAGE_KEY } from '@/lib/user-auth/constants';

const NAV = [
  { href: '/user-dashboard', label: 'Overview', icon: Compass },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/user-dashboard/upcoming-treks', label: 'Upcoming treks', icon: CalendarDays },
  { href: '/user-dashboard/past-treks', label: 'Past treks', icon: Mountain },
  { href: '/user-dashboard/profile', label: 'Profile', icon: UserRound },
] as const;

async function clearStaleSession() {
  try {
    await fetch('/api/user/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // ignore — hard redirect still lands on login
  }
  try {
    sessionStorage.removeItem(USER_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const fromRef = useRef(pathname);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fromRef.current = pathname;

    (async () => {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch('/api/user/auth/me', {
            credentials: 'include',
            cache: 'no-store',
          });
          if (cancelled) return;

          // True unauthenticated / revoked session — clear cookie so LoginForm's
          // JWT-only /session peek cannot bounce us straight back into a loop.
          if (res.status === 401) {
            await clearStaleSession();
            if (cancelled) return;
            window.location.replace(
              `/login?from=${encodeURIComponent(fromRef.current || '/user-dashboard')}`,
            );
            return;
          }

          // Infra / transient — retry; never treat as logged-out.
          if (!res.ok) {
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 350 * attempt));
              continue;
            }
            setLoadError('Unable to load your account right now. Please refresh and try again.');
            setReady(true);
            return;
          }

          const body = (await res.json()) as { user: PublicUser };
          if (!cancelled) {
            setUser(body.user);
            setLoadError('');
            setReady(true);
          }
          return;
        } catch {
          if (cancelled) return;
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 350 * attempt));
            continue;
          }
          setLoadError('Unable to connect. Please refresh and try again.');
          setReady(true);
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Auth once per mount — re-fetching on every dashboard nav caused flaky bounce-outs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only gate
  }, []);

  const logout = async () => {
    await clearStaleSession();
    window.location.replace('/login');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ih-bg)] pt-20">
        <p className="text-sm text-slate-500">Loading your dashboard…</p>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--ih-bg)] px-4 pt-20">
        <p className="max-w-md text-center text-sm text-slate-600">
          {loadError || 'Unable to load your account.'}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15803d]"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7f4] pt-20 lg:pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#16a34a]">Member area</p>
            <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="h-fit rounded-2xl border border-[#d8e8dc] bg-white p-3">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/user-dashboard'
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`mb-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition last:mb-0 ${
                    active
                      ? 'bg-[#16a34a] text-white'
                      : 'text-slate-700 hover:bg-[#f0fdf4] hover:text-[#15803d]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
