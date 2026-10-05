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
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 32) : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : '';

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: 'Message is too short' }, { status: 400 });
    }

    await createContact({ name, email, phone, message });
    // Do not echo submitted PII back to the client.
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
