import { NextResponse } from 'next/server';
import { clearUserSession, getCurrentUser } from '@/lib/user-auth/auth';
import { bumpUserSessionVersion, recordAuthEvent } from '@/lib/user-auth/service';

export async function POST(req: Request) {
  // Always clear the cookie first so a flaky DB cannot leave a looping session.
  const response = NextResponse.json({ success: true });
  clearUserSession(response);

  try {
    const user = await getCurrentUser();
    if (user) {
      // Revoke this cookie's sessionVersion so a stolen copy cannot be reused.
      await bumpUserSessionVersion(user.id);
      await recordAuthEvent({
        userId: user.id,
        email: user.email,
        event: 'logout',
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: req.headers.get('user-agent'),
      });
    }
  } catch {
    // Infra/revoke failures must not block sign-out — cookie is already cleared.
  }

  return response;
}

export async function DELETE(req: Request) {
  return POST(req);
}
