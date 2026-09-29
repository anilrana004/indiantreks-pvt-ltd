'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/user/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        return;
      }
      const body = (await res.json()) as { user: PublicUser };
      if (!cancelled) {
        setUser(body.user);
        setReady(true);
      }
    })().catch(() => {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const logout = async () => {
    await fetch('/api/user/auth/logout', { method: 'POST', credentials: 'include' });
    try {
      sessionStorage.removeItem(USER_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    router.push('/login');
    router.refresh();
  };

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ih-bg)] pt-20">
        <p className="text-sm text-slate-500">Loading your dashboard…</p>
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
            onClick={logout}
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
