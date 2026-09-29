import { NextRequest, NextResponse } from 'next/server';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { createContact } from '@/lib/operations/service';
import {
  CONTACT_LIMIT,
  clientIp,
  consumeRateLimit,
  rateLimitedResponse,
} from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const limited = await consumeRateLimit(CONTACT_LIMIT, clientIp(req));
  if (!limited.allowed) {
    return rateLimitedResponse(limited.retryAfterSec);
  }

  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const contact = await createContact({ name, email, phone, message });
    return NextResponse.json(contact, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
