import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from '@/lib/email/brevo';

const { emailOutbox, bookings } = schema;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

function backoffMs(attempts: number): number {
  // 1m, 2m, 4m … capped at 1h
  const minutes = Math.min(60, 2 ** Math.max(0, attempts - 1));
  return minutes * 60_000;
}

export async function enqueueEmail(input: {
  kind: string;
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  bookingId?: string | null;
}): Promise<{ id: string }> {
  const db = requireDb();
  const [row] = await db
    .insert(emailOutbox)
    .values({
      kind: input.kind,
      toEmail: input.toEmail.trim().toLowerCase(),
      toName: input.toName?.trim() || '',
      subject: input.subject,
      html: input.html,
      text: input.text || '',
      bookingId: input.bookingId || null,
      status: 'pending',
      nextAttemptAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: emailOutbox.id });
  return { id: row!.id };
}

/**
 * Process due outbox rows. Safe to run from cron concurrently (SKIP LOCKED).
 */
export async function processEmailOutbox(limit = 20): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  const db = requireDb();
  if (!isTransactionalEmailConfigured()) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const due = await db.execute<{ id: string }>(sql`
    SELECT id FROM email_outbox
    WHERE status IN ('pending', 'failed')
      AND attempts < max_attempts
      AND next_attempt_at <= NOW()
    ORDER BY next_attempt_at ASC
    LIMIT ${limit}
    FOR UPDATE SKIP LOCKED
  `);
  const ids = (
    Array.isArray(due) ? due : ((due as { rows?: Array<{ id: string }> }).rows ?? [])
  ).map((r) => r.id);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const id of ids) {
    const [row] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, id)).limit(1);
    if (!row) {
      skipped += 1;
      continue;
    }

    const attempts = row.attempts + 1;
    const result = await sendTransactionalEmail({
      toEmail: row.toEmail,
      toName: row.toName || undefined,
      subject: row.subject,
      html: row.html,
      text: row.text || undefined,
      tags: [row.kind],
    });

    if (result.ok) {
      await db
        .update(emailOutbox)
        .set({
          status: 'sent',
          attempts,
          providerMessageId: result.messageId || null,
          sentAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(emailOutbox.id, id));

      if (row.bookingId && row.kind === 'booking_confirmation') {
        await db
          .update(bookings)
          .set({ emailStatus: 'sent', updatedAt: new Date() })
          .where(eq(bookings.id, row.bookingId));
      }
      sent += 1;
      continue;
    }

    const exhausted = attempts >= row.maxAttempts;
    await db
      .update(emailOutbox)
      .set({
        status: exhausted ? 'dead' : 'failed',
        attempts,
        lastError: result.detail || result.reason,
        nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
        updatedAt: new Date(),
      })
      .where(eq(emailOutbox.id, id));

    if (row.bookingId && row.kind === 'booking_confirmation') {
      await db
        .update(bookings)
        .set({
          emailStatus: result.reason === 'not_configured' ? 'not_configured' : 'failed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, row.bookingId));
    }
    failed += 1;
  }

  return { sent, failed, skipped };
}

export async function countPendingEmails(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(emailOutbox)
    .where(
      and(
        inArray(emailOutbox.status, ['pending', 'failed']),
        lte(emailOutbox.nextAttemptAt, new Date()),
      ),
    );
  return Number(row?.value || 0);
}
