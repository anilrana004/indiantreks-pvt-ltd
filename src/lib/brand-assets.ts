/** Indian Treks wordmark — primary Cloudinary asset (jum1mpl0). */
export const SITE_LOGO_URL =
  'https://res.cloudinary.com/jum1mpl0/image/upload/f_auto,q_auto/v1790616615/l.png';

/**
 * Header/checkout wordmark — width-capped so UI never downloads the ~175KB full PNG.
 * Keep SITE_LOGO_URL for OG/metadata where a larger asset is fine.
 */
export const SITE_LOGO_UI_URL =
  'https://res.cloudinary.com/jum1mpl0/image/upload/f_auto,q_auto,w_360,c_limit/v1790616615/l.png';

/** Mark shown in the Razorpay Checkout header logo slot. */
export const RAZORPAY_LOGO_URL =
  'https://res.cloudinary.com/jum1mpl0/image/upload/f_auto,q_auto,w_128,c_limit/v1790616799/r.png';

/** Square brand mark for favicon / Google Search / PWA icons (same asset as checkout). */
export const SITE_ICON_URL = RAZORPAY_LOGO_URL;
