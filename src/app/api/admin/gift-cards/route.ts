import { NextRequest, NextResponse } from 'next/server';
import {
  forbiddenResponse,
  requireAdminPermission,
  unauthorizedResponse,
} from '@/lib/admin/auth';
import { dbUnavailableResponse } from '@/lib/api/responses';
import { isDbConfigured } from '@/lib/db';
import { createGiftCard, generateGiftCardCode, listGiftCards } from '@/lib/operations/service';

export async function GET() {
  const gate = await requireAdminPermission('users.read');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  const giftCards = await listGiftCards();
  return NextResponse.json({ giftCards });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminPermission('packages.write');
  if (!gate.admin) return unauthorizedResponse();
  if (gate.forbidden) return forbiddenResponse();
  if (!isDbConfigured()) return dbUnavailableResponse();

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const recipientName = typeof body.recipientName === 'string' ? body.recipientName.trim().slice(0, 80) : '';
    const recipientEmail =
      typeof body.recipientEmail === 'string' ? body.recipientEmail.trim().toLowerCase().slice(0, 254) : '';
    const message = typeof body.message === 'string' ? body.message.slice(0, 500) : '';

    if (!amount || amount < 500 || !recipientName || !recipientEmail) {
      return NextResponse.json(
        { error: 'Amount (min 500), recipient name, and email are required' },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return NextResponse.json({ error: 'Valid recipient email is required' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const giftCard = await createGiftCard({
      code: generateGiftCardCode(),
      amount,
      balance: amount,
      recipientName,
      recipientEmail,
      message,
      expiresAt,
    });

    return NextResponse.json({ giftCard }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
