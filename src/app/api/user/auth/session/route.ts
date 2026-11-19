import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { USER_COOKIE } from '@/lib/user-auth/constants';
import { verifyUserSessionToken } from '@/lib/user-auth/session';

export const runtime = 'nodejs';

/**
 * Ultra-light auth peek for UX gates (booking Pay Now).
 * Verifies the signed cookie only — no DB round-trip.
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = await verifyUserSessionToken(cookieStore.get(USER_COOKIE)?.value);
  // Always 200 — guest peeks must not spam DevTools with 401 "Failed to load resource".
  // no-store: cached peeks caused login ↔ dashboard bounce after cookie changes.
  const headers = { 'Cache-Control': 'no-store, private' };
  if (!session) {
    return NextResponse.json({ authenticated: false }, { headers });
  }
  return NextResponse.json(
    { authenticated: true, email: session.email, userId: session.userId },
    { headers },
  );
}
