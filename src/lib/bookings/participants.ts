import { asc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import type { CheckoutParticipant } from '@/lib/payments/pricing';

const { bookingParticipants } = schema;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

export type NormalizedParticipant = {
  id?: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  sortOrder: number;
};

const MAX_PARTICIPANTS = 20;
const MAX_NAME = 120;
const MAX_PHONE = 32;
const MAX_AGE = 16;
const MAX_GENDER = 24;

/** Validate + normalize participant payloads from the client (untrusted). */
export function normalizeParticipantsInput(
  raw: CheckoutParticipant[] | undefined,
  persons: number,
): NormalizedParticipant[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: NormalizedParticipant[] = [];

  for (const p of list) {
    const name = String(p?.name || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, MAX_NAME);
    if (!name) continue;
    out.push({
      name,
      age: String(p?.age || '')
        .trim()
        .slice(0, MAX_AGE),
      gender: String(p?.gender || '')
        .trim()
        .slice(0, MAX_GENDER),
      phone: String(p?.phone || '')
        .trim()
        .slice(0, MAX_PHONE),
      sortOrder: out.length,
    });
    if (out.length >= Math.min(MAX_PARTICIPANTS, Math.max(persons, 1))) break;
  }

  return out;
}

/** Replace all participants for a booking (idempotent rewrite). */
export async function replaceBookingParticipants(
  bookingId: string,
  participants: NormalizedParticipant[],
): Promise<void> {
  const db = requireDb();
  await db.delete(bookingParticipants).where(eq(bookingParticipants.bookingId, bookingId));
  if (!participants.length) return;

  await db.insert(bookingParticipants).values(
    participants.map((p, i) => ({
      bookingId,
      fullName: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      sortOrder: p.sortOrder ?? i,
      updatedAt: new Date(),
    })),
  );
}

export async function listBookingParticipants(bookingId: string): Promise<NormalizedParticipant[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(bookingParticipants)
    .where(eq(bookingParticipants.bookingId, bookingId))
    .orderBy(asc(bookingParticipants.sortOrder));

  return rows.map((r) => ({
    id: r.id,
    name: r.fullName,
    age: r.age,
    gender: r.gender,
    phone: r.phone,
    sortOrder: r.sortOrder,
  }));
}

/** Backfill rows from legacy participants_json when the normalized table is empty. */
export async function ensureParticipantsFromJson(
  bookingId: string,
  participantsJson: string | null | undefined,
): Promise<NormalizedParticipant[]> {
  const existing = await listBookingParticipants(bookingId);
  if (existing.length) return existing;

  let parsed: CheckoutParticipant[] = [];
  try {
    const raw = JSON.parse(participantsJson || '[]');
    if (Array.isArray(raw)) parsed = raw;
  } catch {
    parsed = [];
  }
  const normalized = normalizeParticipantsInput(parsed, parsed.length || 1);
  if (normalized.length) {
    await replaceBookingParticipants(bookingId, normalized);
  }
  return normalized;
}
