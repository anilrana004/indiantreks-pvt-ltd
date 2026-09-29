import { NextResponse } from 'next/server';
import { databaseUrlSource, getDb, isDbConfigured } from '@/lib/db';
import { isRazorpayConfigured } from '@/lib/payments/razorpay';
import { isTransactionalEmailConfigured } from '@/lib/email/brevo';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Readiness — safe to receive traffic when DB is reachable. */
export async function GET() {
  const dbConfigured = isDbConfigured();
  let dbOk = false;
  if (dbConfigured) {
    try {
      const db = getDb();
      if (db) {
        await db.execute(sql`SELECT 1`);
        dbOk = true;
      }
    } catch {
      dbOk = false;
    }
  }

  const body = {
    ok: dbOk,
    dbConfigured,
    dbSource: databaseUrlSource(),
    dbOk,
    razorpayConfigured: isRazorpayConfigured(),
    emailConfigured: isTransactionalEmailConfigured(),
    ts: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
