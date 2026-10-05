import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { abandonUnpaidCheckout } from '@/lib/payments/service';
import {
  PROTECTED_MUTATION_IP_ABUSE_LIMIT,
  checkIpAbuseLimit,
  clientIp,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';
import { getCurrentUser, unauthorizedUserResponse } from '@/lib/user-auth/auth';

export const runtime = 'nodejs';

/** Release a warmed unpaid checkout when the user changes pay-critical fields. */
export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const [abuse, user] = await Promise.all([
    checkIpAbuseLimit(PROTECTED_MUTATION_IP_ABUSE_LIMIT, clientIp(req)),
    getCurrentUser(),
  ]);
  if (!abuse.allowed) return rateLimitedResponse(abuse.retryAfterSec);
  if (!user) return unauthorizedUserResponse();

  try {
    const body = await req.json();
    const bookingId = String(body.bookingId || '');
    const checkoutToken = String(body.checkoutToken || '');
    if (!bookingId || !checkoutToken) {
      return NextResponse.json({ error: 'Missing bookingId or checkoutToken' }, { status: 400 });
    }

    const result = await abandonUnpaidCheckout({
      bookingId,
      checkoutToken,
      userId: user.id,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to abandon checkout';
    const status =
      typeof err === 'object' && err && 'status' in err
        ? Number((err as { status: number }).status)
        : 400;
    return NextResponse.json(
      { error: message },
      { status: Number.isFinite(status) ? status : 400 },
    );
  }
}
