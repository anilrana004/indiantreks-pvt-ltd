import { SITE_NAME, SITE_URL } from '@/lib/site';

export type SendEmailInput = {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
};

export type SendEmailResult =
  | { ok: true; provider: 'brevo'; messageId?: string }
  | { ok: false; reason: 'not_configured' | 'provider_error'; detail?: string };

function sender() {
  const email = process.env.BREVO_SENDER_EMAIL?.trim() || process.env.EMAIL_FROM?.trim();
  const name = process.env.BREVO_SENDER_NAME?.trim() || SITE_NAME;
  return email ? { email, name } : null;
}

export function isTransactionalEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim() && sender());
}

/**
 * Send transactional email via Brevo SMTP API.
 * Failures must never roll back bookings/payments — caller handles status.
 */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = sender();
  if (!apiKey || !from) {
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: from,
        to: [{ email: input.toEmail, name: input.toName || undefined }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text || undefined,
        tags: input.tags,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return {
        ok: false,
        reason: 'provider_error',
        detail: `brevo_${res.status}:${detail.slice(0, 200)}`,
      };
    }

    const body = (await res.json().catch(() => ({}))) as { messageId?: string };
    return { ok: true, provider: 'brevo', messageId: body.messageId };
  } catch (err) {
    return {
      ok: false,
      reason: 'provider_error',
      detail: err instanceof Error ? err.message : 'network_error',
    };
  }
}

export function passwordResetEmailHtml(params: { name?: string; resetUrl: string }) {
  const greet = params.name ? `Hi ${params.name},` : 'Hi,';
  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
      <p>${greet}</p>
      <p>We received a request to reset your ${SITE_NAME} password.</p>
      <p><a href="${params.resetUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:600">Reset password</a></p>
      <p style="font-size:13px;color:#64748b">This link expires soon. If you did not request a reset, you can ignore this email.</p>
      <p style="font-size:12px;color:#94a3b8">${SITE_URL}</p>
    </div>
  `;
}

export function bookingConfirmationEmailHtml(params: {
  name: string;
  trekTitle: string;
  referenceCode: string;
  date: string;
  payableRupees: number;
  persons: number;
}) {
  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
      <p>Hi ${params.name},</p>
      <p>Your booking with ${SITE_NAME} is <strong>confirmed</strong>.</p>
      <ul>
        <li><strong>Trek:</strong> ${params.trekTitle}</li>
        <li><strong>Reference:</strong> ${params.referenceCode}</li>
        <li><strong>Date:</strong> ${params.date || '—'}</li>
        <li><strong>Travellers:</strong> ${params.persons}</li>
        <li><strong>Paid now:</strong> ₹${params.payableRupees.toLocaleString('en-IN')}</li>
      </ul>
      <p>You can view your trips anytime in your account.</p>
      <p><a href="${SITE_URL.replace(/\/$/, '')}/bookings" style="color:#16a34a;font-weight:600">Open My Bookings</a></p>
    </div>
  `;
}
