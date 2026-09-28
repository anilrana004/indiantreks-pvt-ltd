'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredAdminToken, publicApiFetch } from '@/lib/api/client';
import { isExternalApiEnabled } from '@/lib/env/api-url';
import {
  CalendarCheck,
  ChevronRight,
  ExternalLink,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Mountain,
  Star,
  Users,
  X,
} from 'lucide-react';
import { ADMIN_PREFIX } from '@/lib/admin/constants';

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: ADMIN_PREFIX, icon: LayoutDashboard }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Bookings', href: `${ADMIN_PREFIX}/bookings`, icon: CalendarCheck },
      { label: 'Reviews', href: `${ADMIN_PREFIX}/reviews`, icon: Star },
      { label: 'Contacts', href: `${ADMIN_PREFIX}/contacts`, icon: MessageSquare },
      { label: 'Customer Logins', href: `${ADMIN_PREFIX}/users`, icon: Users },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Blog & News', href: `${ADMIN_PREFIX}/blog`, icon: FileText },
      { label: 'Treks', href: `${ADMIN_PREFIX}/treks`, icon: MapPin },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Newsletter', href: `${ADMIN_PREFIX}/newsletter`, icon: Mail },
      { label: 'Gift Cards', href: `${ADMIN_PREFIX}/gift-cards`, icon: Gift },
    ],
  },
];

function pageTitle(path: string): string {
  if (path === ADMIN_PREFIX) return 'Dashboard';
  const segment = path.replace(`${ADMIN_PREFIX}/`, '').split('/')[0] ?? '';
  const map: Record<string, string> = {
    blog: 'Blog & News',
    treks: 'Treks',
    bookings: 'Bookings',
    reviews: 'Guest Reviews',
    contacts: 'Contacts',
    users: 'Customer Logins',
    newsletter: 'Newsletter',
    'gift-cards': 'Gift Cards',
  };
  return map[segment] ?? 'Admin';
}

type Props = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await publicApiFetch('/api/auth', { method: 'DELETE', credentials: 'include' });
      if (isExternalApiEnabled()) clearStoredAdminToken();
      router.push(`${ADMIN_PREFIX}/login`);
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (href: string) =>
    href === ADMIN_PREFIX ? path === ADMIN_PREFIX : path.startsWith(href);

  const sidebar = (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-slate-800/80 bg-slate-950 text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-900/40">
          <Mountain className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">Indian Treks</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-emerald-600/90 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={1.75} />
                    {item.label}
                    {active ? <ChevronRight className="ml-auto h-4 w-4 opacity-60" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.75} />
          View website
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex">{sidebar}</div>

      {/* Mobile sidebar */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{pageTitle(path)}</p>
            <p className="hidden text-xs text-slate-500 sm:block">Manage your travel platform</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live site
            </Link>
            <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                A
              </div>
              <span className="hidden text-xs font-medium text-slate-700 sm:inline">Administrator</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed right-4 top-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-lg lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
