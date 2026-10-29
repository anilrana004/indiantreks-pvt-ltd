import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { classifyDbError } from '@/lib/db/errors';
import { USER_COOKIE } from '@/lib/user-auth/constants';
import { exchangeGoogleCode, googleRedirectUri, resolveRequestOrigin } from '@/lib/user-auth/google';
import {
  isCustomerAuthStoreReady,
  recordAuthEvent,
  upsertGoogleUser,
} from '@/lib/user-auth/service';
import { createUserSessionToken, userSessionCookieOptions } from '@/lib/user-auth/session';
import { safeReturnPath } from '@/lib/security/urls';

function clearOauthCookies(response: NextResponse) {
  const clear = { httpOnly: true, path: '/', maxAge: 0 };
  response.cookies.set('google_oauth_state', '', clear);
  response.cookies.set('google_oauth_verifier', '', clear);
  response.cookies.set('google_oauth_redirect', '', clear);
  response.cookies.set('google_oauth_return', '', clear);
}

function failRedirect(origin: string, code: string) {
  const res = NextResponse.redirect(new URL(`/login?error=${code}`, origin));
  clearOauthCookies(res);
  return res;
}

export async function GET(req: Request) {
  const origin = resolveRequestOrigin(req);
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const cookieStore = await cookies();
  const expectedState = cookieStore.get('google_oauth_state')?.value;
  const verifier = cookieStore.get('google_oauth_verifier')?.value;
  const pinnedRedirect = cookieStore.get('google_oauth_redirect')?.value;
  const returnTo = safeReturnPath(cookieStore.get('google_oauth_return')?.value);
  const redirectUri = pinnedRedirect || googleRedirectUri(origin);

  if (error) {
    return failRedirect(origin, 'google_denied');
  }

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return failRedirect(origin, 'google_state');
  }

  if (!isCustomerAuthStoreReady()) {
    console.error('[google-oauth] auth store unavailable (set DATABASE_URL in production)');
    return failRedirect(origin, 'google_store');
  }

  try {
    const profile = await exchangeGoogleCode({
      redirectUri,
      code,
      codeVerifier: verifier,
    });
    const user = await upsertGoogleUser({
      googleSub: profile.sub,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    });

    const { findAuthUserById } = await import('@/lib/user-auth/service');
    const authUser = await findAuthUserById(user.id);
    const token = await createUserSessionToken(user.id, user.email, authUser?.sessionVersion ?? 0);
    const res = NextResponse.redirect(new URL(returnTo, origin));
    res.cookies.set(USER_COOKIE, token, userSessionCookieOptions());
    clearOauthCookies(res);

    // Audit must not block sign-in (password login already follows this rule).
    try {
      await recordAuthEvent({
        userId: user.id,
        email: user.email,
        event: 'google_login_success',
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: req.headers.get('user-agent'),
      });
    } catch (auditErr) {
      console.error('[google-oauth] audit event failed', {
        message: auditErr instanceof Error ? auditErr.message : String(auditErr),
      });
    }

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const dbKind = classifyDbError(err).kind;
    console.error('[google-oauth] callback failed', {
      message,
      redirectUri,
      origin,
      dbKind,
    });

    // google_store is ONLY for missing DATABASE_URL — never mislabel quota/schema/conflicts.
    let codeName = 'google_failed';
    if (message.includes('token exchange')) codeName = 'google_token';
    else if (message.includes('not verified')) codeName = 'google_unverified';
    else if (message.includes('SESSION_SECRET') || message.includes('session secret')) {
      codeName = 'google_session';
    } else if (dbKind === 'quota') codeName = 'google_db_quota';
    else if (dbKind === 'unreachable') codeName = 'google_db_down';
    else if (dbKind === 'schema') codeName = 'google_db_schema';
    else if (dbKind === 'conflict' || /already linked/i.test(message)) codeName = 'google_conflict';
    else if (/quota|unreachable|schema incomplete/i.test(message)) {
      if (/quota/i.test(message)) codeName = 'google_db_quota';
      else if (/unreachable/i.test(message)) codeName = 'google_db_down';
      else codeName = 'google_db_schema';
    }

    return failRedirect(origin, codeName);
  }
}
