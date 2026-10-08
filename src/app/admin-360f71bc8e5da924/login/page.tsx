'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, Mountain, ShieldCheck } from 'lucide-react';
import { ADMIN_PREFIX } from '@/lib/admin/constants';
import { clearStoredAdminToken, resolveApiPath, setStoredAdminToken, unwrapApiJson } from '@/lib/api/client';
import { isExternalApiEnabled } from '@/lib/env/api-url';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setFrom(new URLSearchParams(window.location.search).get('from'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loginPath = isExternalApiEnabled() ? resolveApiPath('/api/auth') : '/api/auth';
      const res = await fetch(loginPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      if (res.ok) {
        if (isExternalApiEnabled()) {
          const body = unwrapApiJson<{ token?: string }>(await res.json());
          if (body.token) setStoredAdminToken(body.token);
        }
        const destination =
          from && from.startsWith(ADMIN_PREFIX) && !from.startsWith(`${ADMIN_PREFIX}/login`)
            ? from
            : ADMIN_PREFIX;
        router.push(destination);
      } else {
        let message = 'Invalid email or password. Please try again.';
        try {
          const body = unwrapApiJson<{ error?: string }>(await res.json());
          if (body.error?.trim()) message = body.error.trim();
        } catch {
          // keep default message
        }
        setError(message);
      }
    } catch {
      setError('Unable to connect. Check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[45%] overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(22,163,74,0.25)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(22,102,217,0.15)_0%,_transparent_50%)]" />
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-900/50">
              <Mountain className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Indian Treks</p>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Admin Console</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6 p-10">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
            Manage treks, bookings, and content from one place.
          </h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure signed sessions
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" /> Role-protected admin routes
            </li>
          </ul>
        </div>
        <p className="relative z-10 p-10 text-xs text-slate-500">© Indian Treks · Internal use only</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f8fafc] px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
              <Mountain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Indian Treks Admin Console</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to your admin account</p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="admin@indiantreks.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/" className="font-medium text-emerald-600 hover:text-emerald-700">
              ← Back to website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
