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
  return Boolean(await verifyUserSessionToken(request.cookies.get(USER_COOKIE)?.value));
}

export async function getSessionFromRequest(request: NextRequest) {
  return verifyUserSessionToken(request.cookies.get(USER_COOKIE)?.value);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const session = await verifyUserSessionToken(cookieStore.get(USER_COOKIE)?.value);
  if (!session) return null;
  const user = await findAuthUserById(session.userId);
  if (!user) return null;
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

export async function requireUser(): Promise<PublicUser | null> {
  return getCurrentUser();
}

export async function attachUserSession(
  response: NextResponse,
  user: { id: string; email: string },
): Promise<string> {
  const token = await createUserSessionToken(user.id, user.email);
  response.cookies.set(USER_COOKIE, token, userSessionCookieOptions());
  return token;
}

export function clearUserSession(response: NextResponse) {
  response.cookies.set(USER_COOKIE, '', { ...userSessionCookieOptions(), maxAge: 0 });
}

export function unauthorizedUserResponse(message = 'Please sign in to continue.') {
  return NextResponse.json({ error: message, code: 'AUTH_REQUIRED' }, { status: 401 });
}
