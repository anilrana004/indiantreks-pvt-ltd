import { NextResponse } from 'next/server';
import {
  buildGoogleAuthorizeUrl,
  createOAuthState,
  createPkcePair,
  googleRedirectUri,
  isGoogleAuthConfigured,
  resolveRequestOrigin,
} from '@/lib/user-auth/google';
import { safeReturnPath } from '@/lib/security/urls';
import {
  AUTH_GOOGLE_START_LIMIT,
  clientIp,
  consumeRateLimit,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';

export async function GET(req: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
      { status: 503 },
    );
  }

  // Separate bucket from password login so OAuth retries do not collide with AUTH_LOGIN_LIMIT.
  const limited = await consumeRateLimit(AUTH_GOOGLE_START_LIMIT, `ip:${clientIp(req)}`, {
    failClosed: false,
  });
  if (!limited.allowed) {
    return rateLimitedResponse(limited.retryAfterSec);
  }

  const origin = resolveRequestOrigin(req);
  const url = new URL(req.url);
  const returnTo = safeReturnPath(url.searchParams.get('returnTo'));
  const state = createOAuthState();
  const { verifier, challenge } = createPkcePair();
  const redirectUri = googleRedirectUri(origin);

  const response = NextResponse.redirect(
    buildGoogleAuthorizeUrl({ redirectUri, state, codeChallenge: challenge }),
  );

  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600,
  };

  response.cookies.set('google_oauth_state', state, cookieBase);
  response.cookies.set('google_oauth_verifier', verifier, cookieBase);
  response.cookies.set('google_oauth_redirect', redirectUri, cookieBase);
  response.cookies.set('google_oauth_return', returnTo, cookieBase);

  return response;
}
