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

export async function GET(req: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json(
      { error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
      { status: 503 },
    );
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
