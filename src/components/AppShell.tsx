'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ADMIN_PREFIX } from '@/lib/admin/constants';
import { resetBodyScrollLock } from '@/lib/dom/scroll-lock';

const StorefrontChrome = dynamic(() => import('@/components/storefront/StorefrontChrome'), {
  ssr: true,
});
const CheckoutChrome = dynamic(() => import('@/components/booking/CheckoutChrome'), {
  ssr: true,
});

function isCheckoutPath(pathname: string) {
  return pathname === '/booking' || pathname.startsWith('/booking/');
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isAdmin = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);

  // Clear leftover locks when overlays unmount across client navigations.
  useEffect(() => {
    resetBodyScrollLock();
  }, [pathname]);

  if (isAdmin) {
    return <>{children}</>;
  }

  if (isCheckoutPath(pathname)) {
    return <CheckoutChrome>{children}</CheckoutChrome>;
  }

  return <StorefrontChrome>{children}</StorefrontChrome>;
}
