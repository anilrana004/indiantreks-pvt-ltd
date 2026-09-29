import { NextResponse } from 'next/server';
import { databaseUrlSource, isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { isTransactionalEmailConfigured } from '@/lib/email/brevo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Liveness — process is up. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'indiantreks-storefront',
    ts: new Date().toISOString(),
  });
}
