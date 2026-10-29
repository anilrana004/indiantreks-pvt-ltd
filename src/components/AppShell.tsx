'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ADMIN_PREFIX } from '@/lib/admin/constants';
import StorefrontChrome from '@/components/storefront/StorefrontChrome';
import { resetBodyScrollLock } from '@/lib/dom/scroll-lock';

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

  return <StorefrontChrome>{children}</StorefrontChrome>;
}
