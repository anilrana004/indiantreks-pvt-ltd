import { NextResponse } from 'next/server';
import { USER_COOKIE } from '@/lib/user-auth/constants';
import {
  isCustomerAuthStoreReady,
  recordAuthEvent,
  registerUser,
} from '@/lib/user-auth/service';
import { createUserSessionToken, userSessionCookieOptions } from '@/lib/user-auth/session';
import { validateRegisterBody } from '@/lib/user-auth/validation';

function clientMeta(req: Request) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
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
    const parsed = validateRegisterBody(body);
    if (parsed.fieldErrors) {
      return NextResponse.json({ error: 'Validation failed', fieldErrors: parsed.fieldErrors }, { status: 400 });
    }

    const result = await registerUser(parsed.data!);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const token = await createUserSessionToken(result.user.id, result.user.email);
    const response = NextResponse.json({ success: true, user: result.user, token }, { status: 201 });
    response.cookies.set(USER_COOKIE, token, userSessionCookieOptions());

    await recordAuthEvent({
      userId: result.user.id,
      email: result.user.email,
      event: 'register_success',
      ...clientMeta(req),
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('SESSION_SECRET') || message.includes('production')) {
      return NextResponse.json(
        { error: 'Authentication is not configured for production' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
