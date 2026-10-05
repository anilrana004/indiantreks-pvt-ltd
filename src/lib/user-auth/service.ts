import fs from 'node:fs';
import path from 'node:path';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { getDb, isDbConfigured, schema } from '@/lib/db';
import { PASSWORD_RESET_TTL_MS } from '@/lib/user-auth/constants';
import { generateRawToken, hashPassword, hashToken, verifyPassword } from '@/lib/user-auth/password';
import type { AuthUserRecord, PublicUser, RegisterUserInput } from '@/lib/user-auth/types';
import type { Booking } from '@/lib/operations/types';

/** Same Postgres as blog/CMS (`DATABASE_URL` → `getDb()`). JSON file is local-dev fallback only. */
const { siteUsers, passwordResetTokens, authAuditEvents, bookings } = schema;

const LOCAL_STORE_PATH = path.join(process.cwd(), 'data', 'customer-auth.json');

type LocalStore = {
  users: Array<{
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    phoneCountryCode: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    nationality: string | null;
    role: string;
    bookingsCount: number;
    passwordHash: string | null;
    googleSub: string | null;
    emailVerified: boolean;
    avatarUrl: string | null;
    sessionVersion: number;
    createdAt: string;
    updatedAt: string;
  }>;
  resetTokens: Array<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    usedAt: string | null;
    createdAt: string;
  }>;
  audit: Array<{
    id: string;
    userId: string | null;
    email: string | null;
    event: string;
    ip: string | null;
    userAgent: string | null;
    meta: string;
    createdAt: string;
  }>;
  bookings: Booking[];
};

function emptyStore(): LocalStore {
  return { users: [], resetTokens: [], audit: [], bookings: [] };
}

function readLocalStore(): LocalStore {
  try {
    if (!fs.existsSync(LOCAL_STORE_PATH)) return emptyStore();
    const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as LocalStore;
    return {
      users: Array.isArray(parsed.users)
        ? parsed.users.map((u) => ({
            ...u,
            firstName: u.firstName ?? null,
            lastName: u.lastName ?? null,
            phoneCountryCode: u.phoneCountryCode ?? '+91',
            dateOfBirth: u.dateOfBirth ?? null,
            gender: u.gender ?? null,
            nationality: u.nationality ?? null,
            sessionVersion: typeof u.sessionVersion === 'number' ? u.sessionVersion : 0,
          }))
        : [],
      resetTokens: Array.isArray(parsed.resetTokens) ? parsed.resetTokens : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeLocalStore(store: LocalStore) {
  const dir = path.dirname(LOCAL_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${LOCAL_STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, LOCAL_STORE_PATH);
}

function toPublic(user: AuthUserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    phoneCountryCode: user.phoneCountryCode,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    nationality: user.nationality,
    role: user.role,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    bookingsCount: user.bookingsCount,
    createdAt: user.createdAt,
  };
}

function rowToAuth(row: typeof siteUsers.$inferSelect): AuthUserRecord {
  return {
    id: row.id,
    name: row.name,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    email: row.email,
    phone: row.phone ?? undefined,
    phoneCountryCode: row.phoneCountryCode ?? undefined,
    dateOfBirth: row.dateOfBirth ?? undefined,
    gender: row.gender ?? undefined,
    nationality: row.nationality ?? undefined,
    role: (row.role === 'admin' ? 'admin' : 'user') as AuthUserRecord['role'],
    emailVerified: row.emailVerified,
    avatarUrl: row.avatarUrl ?? undefined,
    bookingsCount: row.bookingsCount,
    createdAt: row.createdAt.toISOString(),
    passwordHash: row.passwordHash,
    googleSub: row.googleSub,
    sessionVersion: row.sessionVersion ?? 0,
  };
}

function localToAuth(row: LocalStore['users'][number]): AuthUserRecord {
  return {
    id: row.id,
    name: row.name,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    email: row.email,
    phone: row.phone ?? undefined,
    phoneCountryCode: row.phoneCountryCode ?? undefined,
    dateOfBirth: row.dateOfBirth ?? undefined,
    gender: row.gender ?? undefined,
    nationality: row.nationality ?? undefined,
    role: (row.role === 'admin' ? 'admin' : 'user') as AuthUserRecord['role'],
    emailVerified: row.emailVerified,
    avatarUrl: row.avatarUrl ?? undefined,
    bookingsCount: row.bookingsCount,
    createdAt: row.createdAt,
    passwordHash: row.passwordHash,
    googleSub: row.googleSub,
    sessionVersion: row.sessionVersion ?? 0,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isCustomerAuthStoreReady(): boolean {
  return isDbConfigured() || process.env.NODE_ENV !== 'production';
}

export async function findAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const normalized = normalizeEmail(email);
  if (isDbConfigured()) {
    const db = getDb()!;
    const [row] = await db.select().from(siteUsers).where(eq(siteUsers.email, normalized)).limit(1);
    return row ? rowToAuth(row) : null;
  }
  const store = readLocalStore();
  const row = store.users.find((u) => u.email === normalized);
  return row ? localToAuth(row) : null;
}

export async function findAuthUserById(id: string): Promise<AuthUserRecord | null> {
  if (isDbConfigured()) {
    const db = getDb()!;
    const [row] = await db.select().from(siteUsers).where(eq(siteUsers.id, id)).limit(1);
    return row ? rowToAuth(row) : null;
  }
  const store = readLocalStore();
  const row = store.users.find((u) => u.id === id);
  return row ? localToAuth(row) : null;
}

export async function findAuthUserByGoogleSub(sub: string): Promise<AuthUserRecord | null> {
  if (isDbConfigured()) {
    const db = getDb()!;
    const [row] = await db.select().from(siteUsers).where(eq(siteUsers.googleSub, sub)).limit(1);
    return row ? rowToAuth(row) : null;
  }
  const store = readLocalStore();
  const row = store.users.find((u) => u.googleSub === sub);
  return row ? localToAuth(row) : null;
}

export async function registerUser(
  input: RegisterUserInput,
): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const email = normalizeEmail(input.email);
  const existing = await findAuthUserByEmail(email);
  if (existing) return { error: 'An account with this email already exists.', status: 409 };

  const passwordHash = await hashPassword(input.password);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const name = `${firstName} ${lastName}`.trim();
  const phone = input.phone.trim();
  const phoneCountryCode = input.phoneCountryCode.trim() || '+91';
  const dateOfBirth = input.dateOfBirth.trim();
  const gender = input.gender.trim();
  const nationality = input.nationality.trim();

  if (isDbConfigured()) {
    const db = getDb()!;
    const [row] = await db
      .insert(siteUsers)
      .values({
        name,
        firstName,
        lastName,
        email,
        phone,
        phoneCountryCode,
        dateOfBirth,
        gender,
        nationality,
        role: 'user',
        passwordHash,
        emailVerified: false,
        bookingsCount: 0,
      })
      .returning();
    return { user: toPublic(rowToAuth(row!)) };
  }

  const store = readLocalStore();
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    name,
    firstName,
    lastName,
    email,
    phone,
    phoneCountryCode,
    dateOfBirth,
    gender,
    nationality,
    role: 'user',
    bookingsCount: 0,
    passwordHash,
    googleSub: null,
    emailVerified: false,
    avatarUrl: null,
    sessionVersion: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.users.push(user);
  writeLocalStore(store);
  return { user: toPublic(localToAuth(user)) };
}

export async function authenticateWithPassword(
  email: string,
  password: string,
): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const user = await findAuthUserByEmail(email);
  if (!user || !user.passwordHash) {
    return { error: 'Invalid email or password.', status: 401 };
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: 'Invalid email or password.', status: 401 };
  return { user: toPublic(user) };
}

export async function upsertGoogleUser(input: {
  googleSub: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  const bySub = await findAuthUserByGoogleSub(input.googleSub);
  if (bySub) return toPublic(bySub);

  const byEmail = await findAuthUserByEmail(email);
  if (byEmail) {
    if (isDbConfigured()) {
      const db = getDb()!;
      const [row] = await db
        .update(siteUsers)
        .set({
          googleSub: input.googleSub,
          emailVerified: true,
          avatarUrl: input.avatarUrl ?? byEmail.avatarUrl ?? null,
          updatedAt: new Date(),
        })
        .where(eq(siteUsers.id, byEmail.id))
        .returning();
      return toPublic(rowToAuth(row!));
    }
    const store = readLocalStore();
    const idx = store.users.findIndex((u) => u.id === byEmail.id);
    if (idx >= 0) {
      store.users[idx] = {
        ...store.users[idx]!,
        googleSub: input.googleSub,
        emailVerified: true,
        avatarUrl: input.avatarUrl ?? store.users[idx]!.avatarUrl,
        updatedAt: new Date().toISOString(),
      };
      writeLocalStore(store);
      return toPublic(localToAuth(store.users[idx]!));
    }
  }

  if (isDbConfigured()) {
    const db = getDb()!;
    const fullName = input.name.trim() || email.split('@')[0]!;
    const [first, ...rest] = fullName.split(/\s+/);
    const [row] = await db
      .insert(siteUsers)
      .values({
        name: fullName,
        firstName: first || fullName,
        lastName: rest.join(' ') || null,
        email,
        role: 'user',
        googleSub: input.googleSub,
        emailVerified: true,
        avatarUrl: input.avatarUrl ?? null,
        bookingsCount: 0,
      })
      .returning();
    return toPublic(rowToAuth(row!));
  }

  const store = readLocalStore();
  const now = new Date().toISOString();
  const fullName = input.name.trim() || email.split('@')[0]!;
  const [first, ...rest] = fullName.split(/\s+/);
  const user = {
    id: crypto.randomUUID(),
    name: fullName,
    firstName: first || fullName,
    lastName: rest.join(' ') || null,
    email,
    phone: null,
    phoneCountryCode: '+91',
    dateOfBirth: null,
    gender: null,
    nationality: null,
    role: 'user',
    bookingsCount: 0,
    passwordHash: null,
    googleSub: input.googleSub,
    emailVerified: true,
    avatarUrl: input.avatarUrl ?? null,
    sessionVersion: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.users.push(user);
  writeLocalStore(store);
  return toPublic(localToAuth(user));
}

export async function createPasswordResetToken(email: string): Promise<{ rawToken: string; userId: string } | null> {
  const user = await findAuthUserByEmail(email);
  if (!user) return null;

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  if (isDbConfigured()) {
    const db = getDb()!;
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
  } else {
    const store = readLocalStore();
    store.resetTokens.push({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
      createdAt: new Date().toISOString(),
    });
    writeLocalStore(store);
  }

  return { rawToken, userId: user.id };
}

/** Invalidate all existing signed cookies for this account (logout / password change). */
export async function bumpUserSessionVersion(userId: string): Promise<void> {
  if (!userId) return;

  if (isDbConfigured()) {
    const db = getDb()!;
    await db
      .update(siteUsers)
      .set({
        sessionVersion: sql`${siteUsers.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(siteUsers.id, userId));
    return;
  }

  const store = readLocalStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx < 0) return;
  store.users[idx] = {
    ...store.users[idx]!,
    sessionVersion: (store.users[idx]!.sessionVersion ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  writeLocalStore(store);
}

export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string; status: number }> {
  const tokenHash = hashToken(rawToken);

  if (isDbConfigured()) {
    const db = getDb()!;
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) return { error: 'Reset link is invalid or expired.', status: 400 };

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(siteUsers)
      .set({
        passwordHash,
        sessionVersion: sql`${siteUsers.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(siteUsers.id, row.userId));
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id));
    return { ok: true };
  }

  const store = readLocalStore();
  const token = store.resetTokens.find(
    (t) => t.tokenHash === tokenHash && !t.usedAt && new Date(t.expiresAt).getTime() > Date.now(),
  );
  if (!token) return { error: 'Reset link is invalid or expired.', status: 400 };

  const idx = store.users.findIndex((u) => u.id === token.userId);
  if (idx < 0) return { error: 'Reset link is invalid or expired.', status: 400 };

  store.users[idx] = {
    ...store.users[idx]!,
    passwordHash: await hashPassword(newPassword),
    sessionVersion: (store.users[idx]!.sessionVersion ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  token.usedAt = new Date().toISOString();
  writeLocalStore(store);
  return { ok: true };
}

export async function updateUserProfile(
  userId: string,
  input: { name?: string; phone?: string },
): Promise<PublicUser | null> {
  const name = input.name?.trim();
  const phone = input.phone?.trim();

  if (isDbConfigured()) {
    const db = getDb()!;
    const [row] = await db
      .update(siteUsers)
      .set({
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(siteUsers.id, userId))
      .returning();
    return row ? toPublic(rowToAuth(row)) : null;
  }

  const store = readLocalStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx < 0) return null;
  store.users[idx] = {
    ...store.users[idx]!,
    ...(name ? { name } : {}),
    ...(phone !== undefined ? { phone: phone || null } : {}),
    updatedAt: new Date().toISOString(),
  };
  writeLocalStore(store);
  return toPublic(localToAuth(store.users[idx]!));
}

export async function listBookingsForUserId(userId: string): Promise<Booking[]> {
  if (!userId) return [];

  if (isDbConfigured()) {
    const db = getDb()!;
    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
    return rows.map((row) => ({
      id: row.id,
      trekId: row.trekId,
      trekTitle: row.trekTitle,
      name: row.name,
      email: row.email,
      phone: row.phone,
      package: row.package,
      persons: row.persons,
      date: row.date,
      payment: row.payment as Booking['payment'],
      amount: row.amount,
      status: row.status as Booking['status'],
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  // Local fallback has no userId on bookings — do not leak cross-account by email.
  return [];
}

/** @deprecated Prefer listBookingsForUserId — email listing enables PII IDOR. */
export async function listBookingsForEmail(email: string): Promise<Booking[]> {
  const normalized = normalizeEmail(email);
  if (isDbConfigured()) {
    // Intentionally empty for security — callers must use userId.
    void normalized;
    return [];
  }
  return [];
}

export async function recordAuthEvent(input: {
  userId?: string | null;
  email?: string | null;
  event: string;
  ip?: string | null;
  userAgent?: string | null;
  meta?: string;
}) {
  if (isDbConfigured()) {
    const db = getDb()!;
    await db.insert(authAuditEvents).values({
      userId: input.userId ?? null,
      email: input.email ?? null,
      event: input.event,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      meta: input.meta ?? '',
    });
    return;
  }

  const store = readLocalStore();
  store.audit.push({
    id: crypto.randomUUID(),
    userId: input.userId ?? null,
    email: input.email ?? null,
    event: input.event,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    meta: input.meta ?? '',
    createdAt: new Date().toISOString(),
  });
  writeLocalStore(store);
}

/** Export auth data for backup (password hashes included for restore; keep file private). */
export async function exportCustomerAuthBackup(): Promise<{
  exportedAt: string;
  source: 'postgres' | 'local-file';
  users: PublicUser[];
  userCount: number;
}> {
  if (isDbConfigured()) {
    const db = getDb()!;
    const rows = await db.select().from(siteUsers).orderBy(desc(siteUsers.createdAt));
    const users = rows.map((r) => toPublic(rowToAuth(r)));
    return { exportedAt: new Date().toISOString(), source: 'postgres', users, userCount: users.length };
  }
  const store = readLocalStore();
  const users = store.users.map((u) => toPublic(localToAuth(u)));
  return { exportedAt: new Date().toISOString(), source: 'local-file', users, userCount: users.length };
}

export { toPublic };
