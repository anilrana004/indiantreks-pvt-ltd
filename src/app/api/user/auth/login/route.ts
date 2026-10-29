import { NextResponse } from 'next/server';
import { classifyDbError } from '@/lib/db/errors';
import { USER_COOKIE } from '@/lib/user-auth/constants';
import {
  authenticateWithPassword,
  isCustomerAuthStoreReady,
  recordAuthEvent,
} from '@/lib/user-auth/service';
import { createUserSessionToken, userSessionCookieOptions } from '@/lib/user-auth/session';
import { validateLoginBody } from '@/lib/user-auth/validation';
import {
  AUTH_LOGIN_LIMIT,
  clientIp,
  consumeRateLimit,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';

function clientMeta(req: Request) {
  return {
    ip: clientIp(req),
    userAgent: req.headers.get('user-agent'),
  };
}

export async function POST(req: Request) {
  if (!isCustomerAuthStoreReady()) {
    return NextResponse.json(
      {
        error:
          'Authentication store unavailable. Set DATABASE_URL (or POSTGRES_URL) for Production on Vercel, then Redeploy.',
      },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const parsed = validateLoginBody(body);
    if (parsed.fieldErrors) {
      return NextResponse.json({ error: 'Validation failed', fieldErrors: parsed.fieldErrors }, { status: 400 });
    }

    // Password-login bucket only (never shared with Google OAuth start/callback).
    // Fail-open on DB outage/quota so infra errors are not disguised as rate limits.
    const identity = `${clientIp(req)}:${parsed.data!.email.trim().toLowerCase()}`;
    const limited = await consumeRateLimit(AUTH_LOGIN_LIMIT, identity, { failClosed: false });
    if (!limited.allowed) {
      return rateLimitedResponse(limited.retryAfterSec);
    }

    let result: Awaited<ReturnType<typeof authenticateWithPassword>>;
    try {
      result = await authenticateWithPassword(parsed.data!.email, parsed.data!.password);
    } catch (authErr) {
      const classified = classifyDbError(authErr);
      console.error('[user-auth/login] authenticate failed', classified);
      if (classified.kind !== 'unknown') {
        return NextResponse.json({ error: classified.message, code: `DB_${classified.kind}` }, { status: 503 });
      }
      return NextResponse.json({ error: 'Unable to sign in. Please try again.' }, { status: 503 });
    }
    if ('error' in result) {
      try {
        await recordAuthEvent({
          email: parsed.data!.email,
          event: 'login_failed',
          ...clientMeta(req),
        });
      } catch {
        // Audit must not block the auth response.
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    let sessionVersion = 0;
    try {
      const { findAuthUserById } = await import('@/lib/user-auth/service');
      const authUser = await findAuthUserById(result.user.id);
      sessionVersion = authUser?.sessionVersion ?? 0;
    } catch (lookupErr) {
      const classified = classifyDbError(lookupErr);
      console.error('[user-auth/login] session version lookup failed', classified);
      if (classified.kind !== 'unknown') {
        return NextResponse.json({ error: classified.message, code: `DB_${classified.kind}` }, { status: 503 });
      }
      // Proceed with sessionVersion 0 if lookup failed for a non-infra reason.
    }

    const token = await createUserSessionToken(result.user.id, result.user.email, sessionVersion);
    // Cookie-only session — never return the token to JS (XSS would steal it).
    const response = NextResponse.json({ success: true, user: result.user });
    response.cookies.set(USER_COOKIE, token, userSessionCookieOptions());

    try {
      await recordAuthEvent({
        userId: result.user.id,
        email: result.user.email,
        event: 'login_success',
        ...clientMeta(req),
      });
    } catch {
      // Audit must not block sign-in.
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    console.error('[user-auth/login]', message);

    if (message.includes('SESSION_SECRET') || /session secret/i.test(message)) {
      return NextResponse.json(
        { error: 'Authentication is not configured for production' },
        { status: 503 },
      );
    }

    const classified = classifyDbError(err);
    if (classified.kind !== 'unknown') {
      return NextResponse.json({ error: classified.message, code: `DB_${classified.kind}` }, { status: 503 });
    }

    return NextResponse.json({ error: 'Unable to sign in. Please try again.' }, { status: 503 });
  }
}
