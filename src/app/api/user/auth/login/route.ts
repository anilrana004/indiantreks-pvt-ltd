import { NextResponse } from 'next/server';
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

    const identity = `${clientIp(req)}:${parsed.data!.email.trim().toLowerCase()}`;
    const limited = await consumeRateLimit(AUTH_LOGIN_LIMIT, identity);
    if (!limited.allowed) {
      return rateLimitedResponse(limited.retryAfterSec);
    }

    const result = await authenticateWithPassword(parsed.data!.email, parsed.data!.password);
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

    const { findAuthUserById } = await import('@/lib/user-auth/service');
    const authUser = await findAuthUserById(result.user.id);
    const token = await createUserSessionToken(
      result.user.id,
      result.user.email,
      authUser?.sessionVersion ?? 0,
    );
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
    if (message.includes('SESSION_SECRET') || message.includes('production')) {
      return NextResponse.json(
        { error: 'Authentication is not configured for production' },
        { status: 503 },
      );
    }
    if (/session_version|Failed query|does not exist/i.test(message)) {
      return NextResponse.json(
        {
          error:
            'Auth database is missing a required column. Run migration 0013_session_version.sql then retry.',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
