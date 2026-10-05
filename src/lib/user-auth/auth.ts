import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { USER_COOKIE } from '@/lib/user-auth/constants';
import { findAuthUserById } from '@/lib/user-auth/service';
import {
  createUserSessionToken,
  userSessionCookieOptions,
  verifyUserSessionToken,
} from '@/lib/user-auth/session';
import type { PublicUser } from '@/lib/user-auth/types';

export async function isUserAuthenticatedFromRequest(request: NextRequest): Promise<boolean> {
  return Boolean(await getCurrentUserFromToken(request.cookies.get(USER_COOKIE)?.value));
}

export async function getSessionFromRequest(request: NextRequest) {
  return verifyUserSessionToken(request.cookies.get(USER_COOKIE)?.value);
}

async function getCurrentUserFromToken(token: string | undefined | null): Promise<PublicUser | null> {
  const session = await verifyUserSessionToken(token);
  if (!session) return null;
  const user = await findAuthUserById(session.userId);
  if (!user) return null;
  // Password reset / logout-everywhere bumps sessionVersion — reject stale cookies.
  if ((user.sessionVersion ?? 0) !== session.sessionVersion) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    bookingsCount: user.bookingsCount,
    createdAt: user.createdAt,
  };
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  return getCurrentUserFromToken(cookieStore.get(USER_COOKIE)?.value);
}

/**
 * Prefer getCurrentUser() for payment/booking mutations.
 * JWT-only peek is OK for UX (CTA) but must not authorize money/inventory alone.
 */
export async function getSessionIdentity(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const session = await verifyUserSessionToken(cookieStore.get(USER_COOKIE)?.value);
  if (!session) return null;
  return { userId: session.userId, email: session.email };
}

export async function requireUser(): Promise<PublicUser | null> {
  return getCurrentUser();
}

export async function attachUserSession(
  response: NextResponse,
  user: { id: string; email: string; sessionVersion?: number },
): Promise<string> {
  const token = await createUserSessionToken(user.id, user.email, user.sessionVersion ?? 0);
  response.cookies.set(USER_COOKIE, token, userSessionCookieOptions());
  return token;
}

export function clearUserSession(response: NextResponse) {
  response.cookies.set(USER_COOKIE, '', { ...userSessionCookieOptions(), maxAge: 0 });
}

export function unauthorizedUserResponse(message = 'Please sign in to continue.') {
  return NextResponse.json({ error: message, code: 'AUTH_REQUIRED' }, { status: 401 });
}
