import { NextResponse } from 'next/server';
import { AuthInfraError, getCurrentUser, unauthorizedUserResponse } from '@/lib/user-auth/auth';
import { isGoogleAuthConfigured } from '@/lib/user-auth/google';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedUserResponse();
    return NextResponse.json({
      user,
      providers: { google: isGoogleAuthConfigured() },
    });
  } catch (err) {
    // Infra failures must not look like "logged out" — that causes login loops.
    if (err instanceof AuthInfraError) {
      return NextResponse.json(
        { error: err.message, code: `DB_${err.kind}` },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    console.error('[user-auth/me]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Unable to load account right now.', code: 'AUTH_ME_FAILED' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
