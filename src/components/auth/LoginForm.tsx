'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { DEFAULT_SAFE_RETURN_PATH, safeReturnPath } from '@/lib/security/urls';

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: 'Google sign-in was cancelled.',
  google_state: 'Google sign-in expired. Please try again.',
  google_failed: 'Google sign-in failed. Please try email login.',
  google_token:
    'Google could not verify this app redirect URL. In Google Cloud Console, add your current Vercel URL callback (https://YOUR-PROJECT.vercel.app/api/user/auth/google/callback), and set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET on Vercel.',
  google_store:
    'Sign-in storage is unavailable. On Vercel → Project → Settings → Environment Variables, set DATABASE_URL (or POSTGRES_URL) for Production, then Redeploy.',
  google_unverified: 'Your Google email is not verified. Use a verified Google account or email login.',
};

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleRedirectUri, setGoogleRedirectUri] = useState('');
  const [returnTo, setReturnTo] = useState(DEFAULT_SAFE_RETURN_PATH);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || params.get('returnTo');
    const safeFrom = safeReturnPath(from);
    setReturnTo(safeFrom);
    const err = params.get('error');
    if (err && ERROR_MESSAGES[err]) setError(ERROR_MESSAGES[err]);
    if (params.get('reset') === '1') setResetNotice(true);

    // Fast session peek — bounce signed-in users back instantly (no DB /me).
    fetch('/api/user/auth/session', { credentials: 'include', cache: 'default' })
      .then(async (res) => {
        if (res.ok) {
          window.location.replace(safeFrom);
        }
      })
      .catch(() => undefined);

    fetch('/api/user/auth/providers')
      .then(async (res) => {
        if (!res.ok) return;
        const body = (await res.json()) as { google?: boolean; redirectUri?: string };
        setGoogleReady(Boolean(body.google));
        if (body.redirectUri) setGoogleRedirectUri(body.redirectUri);
      })
      .catch(() => setGoogleReady(false));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/user/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as {
        error?: string;
        fieldErrors?: Record<string, string>;
        token?: string;
      };
      if (!res.ok) {
        if (body.fieldErrors) setFieldErrors(body.fieldErrors);
        setError(body.error || 'Unable to sign in.');
        return;
      }
      // Session is httpOnly cookie only — do not store tokens in sessionStorage.
      // Hard return is faster than soft router.push + refresh after auth cookie set.
      window.location.assign(returnTo);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Already a member? Sign in"
      subtitle="Access your upcoming treks, bookings, and profile."
      footer={
        <>
          New to Indian Treks?{' '}
          <Link
            href={
              returnTo !== DEFAULT_SAFE_RETURN_PATH
                ? `/signup?from=${encodeURIComponent(returnTo)}`
                : '/signup'
            }
            className="font-semibold text-[#16a34a] hover:text-[#15803d]"
          >
            Register here
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {resetNotice ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Password updated. Sign in with your new password.
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#16a34a]"
            placeholder="you@example.com"
            required
          />
          {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-[#16a34a] hover:text-[#15803d]">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-[#16a34a]"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <a
        href={googleReady ? `/api/user/auth/google?returnTo=${encodeURIComponent(returnTo)}` : undefined}
        aria-disabled={!googleReady}
        onClick={(e) => {
          if (!googleReady) {
            e.preventDefault();
            setError('Google sign-in is not configured yet. Use email/password, or set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
          }
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        Continue with Google
      </a>

      {process.env.NODE_ENV !== 'production' && googleReady && googleRedirectUri ? (
        <p className="mt-3 break-all rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          If Google shows <span className="font-semibold">redirect_uri_mismatch</span>, add this exact URI under
          Authorized redirect URIs in Google Cloud Console, then Save (wait ~1–2 min):
          <br />
          <code className="mt-1 inline-block font-mono text-[11px] text-slate-800">{googleRedirectUri}</code>
        </p>
      ) : null}
    </AuthShell>
  );
}
