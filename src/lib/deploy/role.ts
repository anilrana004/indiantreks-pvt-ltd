import { ADMIN_PREFIX } from '@/lib/admin/constants';

export type AppRole = 'storefront' | 'admin' | 'full';

/** Which surface this Vercel deployment serves. Default `full` = local dev (both). */
export function getAppRole(): AppRole {
  const role = process.env.APP_ROLE?.trim().toLowerCase();
  if (role === 'storefront' || role === 'admin') return role;
  return 'full';
}

/** Admin-only Vercel deploy — skip storefront static generation at build time. */
export function isAdminOnlyDeploy(): boolean {
  return getAppRole() === 'admin';
}

export function isAdminUiPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

export function isAdminApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/admin') || pathname.startsWith('/api/auth');
}

/** Storefront write/read APIs — live on the public site deployment. */
export function isStorefrontApiPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/contacts') ||
    pathname.startsWith('/api/newsletter') ||
    pathname.startsWith('/api/bookings') ||
    pathname.startsWith('/api/payments') ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/assistant') ||
    pathname.startsWith('/api/public/') ||
    pathname.startsWith('/api/user/')
  );
}

export function isNextInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt')
  );
}

/** True when this path should be blocked on the current deployment role. */
export function isBlockedForRole(pathname: string, role: AppRole): boolean {
  if (role === 'full' || isNextInternalPath(pathname)) return false;

  if (role === 'storefront') {
    return isAdminUiPath(pathname) || isAdminApiPath(pathname);
  }

  if (role === 'admin') {
    if (isAdminUiPath(pathname) || isAdminApiPath(pathname)) return false;
    if (pathname.startsWith('/api/')) return !isAdminApiPath(pathname);
    return !isAdminUiPath(pathname);
  }

  return false;
}
