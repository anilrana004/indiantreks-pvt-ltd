'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const FA_HREF =
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
const FA_ATTR = 'data-it-font-awesome';

/**
 * Load Font Awesome only on storefront pages that need legacy FA icons.
 * Booking checkout skips it to avoid ~100–160 KB webfonts on the pay path.
 */
export default function ConditionalFontAwesome() {
  const pathname = usePathname() ?? '';
  const isCheckout = pathname === '/booking' || pathname.startsWith('/booking/');

  useEffect(() => {
    const existing = document.querySelector<HTMLLinkElement>(`link[${FA_ATTR}]`);
    if (isCheckout) {
      existing?.remove();
      return;
    }
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FA_HREF;
    link.crossOrigin = 'anonymous';
    link.referrerPolicy = 'no-referrer';
    link.setAttribute(FA_ATTR, '1');
    document.head.appendChild(link);
  }, [isCheckout]);

  return null;
}
