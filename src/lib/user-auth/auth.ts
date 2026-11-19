import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { classifyDbError } from '@/lib/db/errors';
import { USER_COOKIE } from '@/lib/user-auth/constants';
import { findAuthUserById } from '@/lib/user-auth/service';
import {
  createUserSessionToken,
  userSessionCookieOptions,
  verifyUserSessionToken,
} from '@/lib/user-auth/session';
import type { PublicUser } from '@/lib/user-auth/types';

/** Thrown when the auth store is down — callers must return 503, not 401. */
export class AuthInfraError extends Error {
  readonly kind: string;
  constructor(message: string, kind: string) {
    super(message);
    this.name = 'AuthInfraError';
    this.kind = kind;
  }
}

export async function isUserAuthenticatedFromRequest(request: NextRequest): Promise<boolean> {
  return Boolean(await getCurrentUserFromToken(request.cookies.get(USER_COOKIE)?.value));
}

export async function getSessionFromRequest(request: NextRequest) {
  return verifyUserSessionToken(request.cookies.get(USER_COOKIE)?.value);
}

async function getCurrentUserFromToken(token: string | undefined | null): Promise<PublicUser | null> {
  const session = await verifyUserSessionToken(token);
  if (!session) return null;

  let user;
  try {
    user = await findAuthUserById(session.userId);
  } catch (err) {
    const classified = classifyDbError(err);
    if (classified.kind !== 'unknown') {
      throw new AuthInfraError(classified.message, classified.kind);
    }
    throw err;
  }

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
  const opts = { ...userSessionCookieOptions(), maxAge: 0 };
  response.cookies.set(USER_COOKIE, '', opts);
  // Also drop any legacy host-only cookie from before Domain=.indiantreks.in.
  if (opts.domain) {
    const secure = opts.secure ? '; Secure' : '';
    response.headers.append(
      'Set-Cookie',
      `${USER_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
    );
  }
}

export function unauthorizedUserResponse(message = 'Please sign in to continue.') {
  return NextResponse.json({ error: message, code: 'AUTH_REQUIRED' }, { status: 401 });
}
