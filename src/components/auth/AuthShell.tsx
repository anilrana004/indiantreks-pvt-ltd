'use client';

import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  titleInsideCard = false,
  tagline,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** When true, heading is rendered inside the white card (register-style). */
  titleInsideCard?: boolean;
  tagline?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--ih-bg)]">
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:py-16">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <BrandLogo className="h-10 w-auto max-w-[220px] object-contain" />
            {tagline ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-800">
                {tagline}
              </span>
            ) : null}
          </Link>
          {!titleInsideCard && title ? (
            <>
              <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">
                {title}
              </h1>
              {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
            </>
          ) : null}
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] sm:p-8">
          {titleInsideCard && title ? (
            <h1 className="mb-6 text-left text-[22px] font-bold leading-tight text-slate-900">
              {title}
            </h1>
          ) : null}
          {children}
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  );
}
