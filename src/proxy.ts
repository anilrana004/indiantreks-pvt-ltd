import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_PREFIX } from '@/lib/admin/constants';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin/auth';
import { getAppRole, isBlockedForRole, isAdminUiPath } from '@/lib/deploy/role';
import { USER_COOKIE, USER_DASHBOARD_PREFIX } from '@/lib/user-auth/constants';
import { verifyUserSessionToken } from '@/lib/user-auth/session';

function isUserDashboardPath(pathname: string): boolean {
  return pathname === USER_DASHBOARD_PREFIX || pathname.startsWith(`${USER_DASHBOARD_PREFIX}/`);
}

function isPrivateApiPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/user') ||
    pathname.startsWith('/api/bookings') ||
    pathname.startsWith('/api/payments') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cron')
  );
}

function isMutating(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

/**
 * SameSite=lax cookies still benefit from Origin checks on state-changing APIs.
 * Allows same-origin and configured production hosts; skips webhooks/cron (no cookies).
 */
function csrfOriginAllowed(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/webhooks/') || pathname.startsWith('/api/cron/')) {
    return true;
  }
  if (!isMutating(request.method)) return true;
  if (!pathname.startsWith('/api/')) return true;

  const origin = request.headers.get('origin');
  const isMoneyPath =
    pathname.startsWith('/api/bookings') || pathname.startsWith('/api/payments');

  if (!origin) {
    // Cookie-authenticated money APIs: fail closed without Origin.
    if (isMoneyPath) return false;
    // Same-origin navigations / some native clients omit Origin; allow without Origin
    // only for non-cross-site cookie posts when Sec-Fetch-Site is present.
    const site = request.headers.get('sec-fetch-site');
    if (!site || site === 'same-origin' || site === 'none') return true;
    return false;
  }

  try {
    const originHost = new URL(origin).host;
    const reqHost = request.headers.get('host') || request.nextUrl.host;
    if (originHost === reqHost) return true;

    const allowed = new Set(
      [
        'indiantreks.in',
        'www.indiantreks.in',
        process.env.NEXT_PUBLIC_SITE_URL
          ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
          : '',
      ].filter(Boolean),
    );
    return allowed.has(originHost);
  } catch {
    return false;
  }
}

async function isUserAuthenticatedFromRequest(request: NextRequest): Promise<boolean> {
  return Boolean(await verifyUserSessionToken(request.cookies.get(USER_COOKIE)?.value));
}

export async function proxy(request: NextRequest) {
  const requestId =
    request.headers.get('x-request-id')?.trim() ||
    request.headers.get('cf-ray')?.trim() ||
    `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

  const { pathname } = request.nextUrl;
  const role = getAppRole();

  const withMeta = (res: NextResponse) => {
    res.headers.set('x-request-id', requestId);
    if (isPrivateApiPath(pathname)) {
      res.headers.set('Cache-Control', 'no-store, private');
    }
    return res;
  };

  if (!csrfOriginAllowed(request)) {
    return withMeta(NextResponse.json({ error: 'Invalid origin', code: 'CSRF_ORIGIN' }, { status: 403 }));
  }

  if (isBlockedForRole(pathname, role)) {
    if (role === 'admin' && pathname === '/') {
      return withMeta(NextResponse.redirect(new URL(`${ADMIN_PREFIX}/login`, request.url)));
    }
    return withMeta(NextResponse.json({ error: 'Not found' }, { status: 404 }));
  }

  if (isUserDashboardPath(pathname)) {
    if (!(await isUserAuthenticatedFromRequest(request))) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return withMeta(NextResponse.redirect(loginUrl));
    }
    return withMeta(NextResponse.next());
  }

  if (!isAdminUiPath(pathname) && !pathname.startsWith('/api/admin')) {
    return withMeta(NextResponse.next());
  }

  if (pathname.startsWith('/api/admin')) {
    if (!(await isAdminAuthenticatedFromRequest(request))) {
      return withMeta(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }
    return withMeta(NextResponse.next());
  }

  if (pathname.startsWith(`${ADMIN_PREFIX}/login`)) {
    return withMeta(NextResponse.next());
  }

  if (!(await isAdminAuthenticatedFromRequest(request))) {
    const loginUrl = new URL(`${ADMIN_PREFIX}/login`, request.url);
    loginUrl.searchParams.set('from', pathname);
    return withMeta(NextResponse.redirect(loginUrl));
  }

  return withMeta(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
