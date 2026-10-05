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
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json(
    { authenticated: true, email: session.email, userId: session.userId },
    {
      headers: {
        // Tiny private cache so rapid step changes don’t re-hit the edge.
        'Cache-Control': 'private, max-age=5',
      },
    },
  );
}
