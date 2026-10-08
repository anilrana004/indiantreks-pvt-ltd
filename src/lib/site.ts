import { SITE_ICON_URL, SITE_LOGO_URL } from '@/lib/brand-assets';

/** Canonical public site origin — override in production via env. */
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://indiantreks.in').replace(/\/$/, '');

export const SITE_NAME = 'Indian Treks';

export const SITE_DESCRIPTION =
  'Book Himalayan treks and sacred yatras in Uttarakhand, Himachal Pradesh, and Nepal. Trusted adventure travel operator.';

/** Cloudinary wordmark — same asset as site header. */
export const SITE_LOGO = SITE_LOGO_URL;

/** Square mark for search / favicon (same as Razorpay checkout). */
export const SITE_ICON = SITE_ICON_URL;

export const ORGANIZATION = {
  name: SITE_NAME,
  legalName: 'Indian Treks',
  url: SITE_URL,
  email: 'info@indiantreks.in',
  logo: SITE_ICON,
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
