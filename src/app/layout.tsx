import type { Metadata, Viewport } from 'next';
import { Nunito, Playfair_Display, Poppins } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import { SITE_ICON_URL, SITE_LOGO_URL } from '@/lib/brand-assets';
import { ORGANIZATION, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Himalayan Treks, Yatras & Adventure Travel`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords:
    'indiantreks, indian treks, himalayan treks, uttarakhand treks, himachal treks, nepal trek, valley of flowers, kedarkantha, everest base camp, annapurna base camp, kedarnath yatra, badrinath yatra, adventure travel',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
      { url: SITE_ICON_URL, type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
    shortcut: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Himalayan Treks, Yatras & Adventure Travel`,
    description: SITE_DESCRIPTION,
    images: [{ url: SITE_LOGO_URL, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO_URL],
  },
  publisher: ORGANIZATION.name,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#16a34a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable} ${nunito.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={`${poppins.className} min-h-dvh overscroll-x-none antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
