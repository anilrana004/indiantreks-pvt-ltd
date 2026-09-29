/** Customer (storefront) auth constants — separate from admin sessions. */

export const USER_COOKIE = 'user_token';
export const USER_TOKEN_STORAGE_KEY = 'indiantreks_user_token';
export const USER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export const USER_DASHBOARD_PREFIX = '/user-dashboard';
export const PUBLIC_AUTH_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
] as const;
