import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { addSubscriber } from '@/lib/operations/service';
import {
  NEWSLETTER_LIMIT,
  clientIp,
  consumeRateLimit,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const limited = await consumeRateLimit(NEWSLETTER_LIMIT, clientIp(req));
  if (!limited.allowed) {
    return rateLimitedResponse(limited.retryAfterSec);
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await addSubscriber(email);
    if (!result) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
