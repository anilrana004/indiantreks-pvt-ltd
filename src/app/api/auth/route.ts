import { NextResponse } from 'next/server';
import { adminSessionCookieOptions, createAdminSessionToken } from '@/lib/admin/session';
import { isProductionRuntime } from '@/lib/env/is-production';
import {
  ADMIN_LOGIN_LIMIT,
  clientIp,
  consumeRateLimit,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';

const DEV_ADMIN_EMAIL = 'admin@indiantreks.com';
const DEV_ADMIN_PASSWORD = 'admin123';

function resolveAdminCredentials():
  | { ok: true; email: string; password: string }
  | { ok: false; status: 503; error: string } {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD ?? '';

  if (isProductionRuntime()) {
    if (!email || !password) {
      return { ok: false, status: 503, error: 'Admin credentials are not configured' };
    }
    if (password === DEV_ADMIN_PASSWORD || password.length < 12) {
      return { ok: false, status: 503, error: 'Admin credentials are not configured for production' };
    }
    return { ok: true, email, password };
  }

  return {
    ok: true,
    email: email || DEV_ADMIN_EMAIL,
    password: password || DEV_ADMIN_PASSWORD,
  };
}

export async function POST(req: Request) {
  try {
    const credentials = resolveAdminCredentials();
    if (!credentials.ok) {
      return NextResponse.json({ error: credentials.error }, { status: credentials.status });
    }

    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const limited = await consumeRateLimit(ADMIN_LOGIN_LIMIT, `${clientIp(req)}:${email.toLowerCase()}`);
    if (!limited.allowed) {
      return rateLimitedResponse(limited.retryAfterSec);
    }

    if (email === credentials.email && password === credentials.password) {
      try {
        const token = await createAdminSessionToken(email);
        const response = NextResponse.json({
          success: true,
          user: { email, name: 'Admin', role: 'admin' },
        });
        response.cookies.set('admin_token', token, adminSessionCookieOptions());
        return response;
      } catch {
        return NextResponse.json(
          { error: 'Admin session is not configured for production' },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_token', '', { ...adminSessionCookieOptions(), maxAge: 0 });
  return response;
}
