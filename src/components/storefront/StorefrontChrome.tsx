'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import '@/app/retro-buttons.css';
import '@/app/retro-button-colors.css';
import Header from '@/components/Header';
import JsonLd from '@/components/seo/JsonLd';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo/json-ld';

const Footer = dynamic(() => import('@/components/Footer'), { ssr: true });
const WhatsAppFloat = dynamic(() => import('@/components/WhatsAppFloat'), { ssr: false });
const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), { ssr: false });
const LeadCapturePopup = dynamic(() => import('@/components/LeadCapturePopup'), { ssr: false });

const AUTH_PATHS = new Set(['/login', '/signup', '/forgot-password', '/reset-password']);

/** Public storefront chrome — never rendered on admin or checkout routes. */
export default function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isAuthPage = AUTH_PATHS.has(pathname);

  if (isAuthPage) {
    return (
      <div className="it-body flex min-h-dvh flex-col">
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
        <main className="it-main relative flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="it-body flex min-h-dvh flex-col">
      <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
      <Header />
      <main className="it-main relative flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <MobileBottomNav />
      <LeadCapturePopup />
    </div>
  );
}
