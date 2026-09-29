import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/site';
import {
  createPasswordResetToken,
  isCustomerAuthStoreReady,
  recordAuthEvent,
} from '@/lib/user-auth/service';
import { validateEmail } from '@/lib/user-auth/validation';
import {
  AUTH_FORGOT_PASSWORD_LIMIT,
  clientIp,
  consumeRateLimit,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';
import {
  isTransactionalEmailConfigured,
  passwordResetEmailHtml,
  sendTransactionalEmail,
} from '@/lib/email/brevo';

export async function POST(req: Request) {
  if (!isCustomerAuthStoreReady()) {
    return NextResponse.json({ error: 'Authentication store unavailable.' }, { status: 503 });
  }

  const ip = clientIp(req);
  const limited = await consumeRateLimit(AUTH_FORGOT_PASSWORD_LIMIT, ip);
  if (!limited.allowed) {
    return rateLimitedResponse(limited.retryAfterSec);
  }

  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email : '';
    const emailErr = validateEmail(email);
    if (emailErr) {
      return NextResponse.json({ error: emailErr, fieldErrors: { email: emailErr } }, { status: 400 });
    }

    const created = await createPasswordResetToken(email);
    const payload: { success: true; message: string; resetUrl?: string } = {
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    };

    if (created) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE_URL;
      const resetUrl = `${origin.replace(/\/$/, '')}/reset-password?token=${created.rawToken}`;

      // Dev/local: expose reset URL so flow is testable without an email provider.
      if (process.env.NODE_ENV !== 'production') {
        payload.resetUrl = resetUrl;
        console.info('[user-auth] Password reset URL:', resetUrl);
      }

      if (isTransactionalEmailConfigured()) {
        const sent = await sendTransactionalEmail({
          toEmail: email.trim().toLowerCase(),
          subject: 'Reset your Indian Treks password',
          html: passwordResetEmailHtml({ resetUrl }),
          text: `Reset your password: ${resetUrl}`,
          tags: ['password-reset'],
        });
        if (!sent.ok && process.env.NODE_ENV === 'production') {
          console.error(
            JSON.stringify({
              scope: 'user-auth',
              event: 'password_reset_email_failed',
              reason: sent.reason,
              detail: sent.detail,
            }),
          );
        }
      } else if (process.env.NODE_ENV === 'production') {
        console.error(
          JSON.stringify({
            scope: 'user-auth',
            event: 'password_reset_email_not_configured',
          }),
        );
      }

      await recordAuthEvent({
        userId: created.userId,
        email: email.trim().toLowerCase(),
        event: 'password_reset_requested',
        ip,
        userAgent: req.headers.get('user-agent'),
        meta: process.env.NODE_ENV === 'production' ? 'brevo_or_pending' : 'dev_reset_url_logged',
      });
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
