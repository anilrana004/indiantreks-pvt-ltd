import { NextRequest, NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { addSubscriber, listSubscribers } from '@/lib/operations/service';

export async function GET() {
  const gate = await requireAdminPermission('users.read');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  const subscribers = await listSubscribers();
  return NextResponse.json({ subscribers });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminPermission('users.read');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const subscriber = await addSubscriber(email);
    if (!subscriber) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
    }

    return NextResponse.json({ subscriber }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
