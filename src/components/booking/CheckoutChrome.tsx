'use client';

import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { Lock } from 'lucide-react';

/**
 * Minimal booking chrome — no catalog search, footer, lead popup, or floats.
 * Keeps checkout payload lean and avoids storefront JS/CSS on the pay path.
 */
export default function CheckoutChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="it-body flex min-h-dvh flex-col bg-gray-50">
      <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm lg:h-16">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4 lg:px-6">
          <Link href="/" className="shrink-0" aria-label="IndianTreks home">
            <BrandLogo className="h-7 w-auto max-w-[148px] object-contain object-left lg:h-8 lg:max-w-[168px]" />
          </Link>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803d] sm:text-sm">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Secure checkout
          </p>
        </div>
      </header>
      <main className="it-main relative flex-1">{children}</main>
    </div>
  );
}
