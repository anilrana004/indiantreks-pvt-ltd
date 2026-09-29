import { and, count, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import type {
  Booking,
  BookingStatus,
  Contact,
  ContactStatus,
  CreateBookingInput,
  CreateContactInput,
  CreateGiftCardInput,
  GiftCard,
  GiftCardStatus,
  NewsletterSubscriber,
  SiteUser,
} from '@/lib/operations/types';

const { bookings, contacts, giftCards, newsletterSubscribers, siteUsers, authAuditEvents } = schema;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

function toBooking(row: typeof bookings.$inferSelect): Booking {
  return {
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
    status: row.status as BookingStatus,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    userId: row.userId,
    referenceCode: row.referenceCode,
    city: row.city,
    participantsJson: row.participantsJson,
    pricingSnapshot: row.pricingSnapshot,
    payablePaise: row.payablePaise,
    totalPaise: row.totalPaise,
    currency: row.currency,
    paymentStatus: row.paymentStatus as Booking['paymentStatus'],
    holdExpiresAt: row.holdExpiresAt?.toISOString() ?? null,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    emailStatus: row.emailStatus,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

function toContact(row: typeof contacts.$inferSelect): Contact {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    message: row.message,
    status: row.status as ContactStatus,
    createdAt: row.createdAt.toISOString(),
  };
}

function toGiftCard(row: typeof giftCards.$inferSelect): GiftCard {
  return {
    id: row.id,
    code: row.code,
    amount: row.amount,
    balance: row.balance,
    recipientName: row.recipientName,
    recipientEmail: row.recipientEmail,
    message: row.message ?? undefined,
    status: row.status as GiftCardStatus,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

function toSubscriber(row: typeof newsletterSubscribers.$inferSelect): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    subscribedAt: row.subscribedAt.toISOString(),
    active: row.active,
  };
}

function authProviderFor(row: typeof siteUsers.$inferSelect): SiteUser['authProvider'] {
  const hasGoogle = Boolean(row.googleSub);
  const hasPassword = Boolean(row.passwordHash);
  if (hasGoogle && hasPassword) return 'both';
  if (hasGoogle) return 'google';
  if (hasPassword) return 'password';
  return 'unknown';
}

function toSiteUser(
  row: typeof siteUsers.$inferSelect,
  lastLoginAt: string | null = null,
): SiteUser {
  const hasGoogle = Boolean(row.googleSub);
  const hasPassword = Boolean(row.passwordHash);
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
    role: row.role as SiteUser['role'],
    bookings: row.bookingsCount,
    emailVerified: row.emailVerified,
    avatarUrl: row.avatarUrl ?? undefined,
    authProvider: authProviderFor(row),
    hasGoogle,
    hasPassword,
    lastLoginAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listBookings(): Promise<Booking[]> {
  const rows = await requireDb().select().from(bookings).orderBy(desc(bookings.createdAt));
  return rows.map(toBooking);
}

export async function getOperationsDashboardCounts(): Promise<{
  bookings: number;
  contacts: number;
  subscribers: number;
  giftCards: number;
  users: number;
}> {
  const db = requireDb();
  const [[b], [c], [s], [g], [u]] = await Promise.all([
    db.select({ value: count() }).from(bookings),
    db.select({ value: count() }).from(contacts),
    db.select({ value: count() }).from(newsletterSubscribers),
    db.select({ value: count() }).from(giftCards),
    db.select({ value: count() }).from(siteUsers),
  ]);
  return {
    bookings: Number(b?.value || 0),
    contacts: Number(c?.value || 0),
    subscribers: Number(s?.value || 0),
    giftCards: Number(g?.value || 0),
    users: Number(u?.value || 0),
  };
}

export type BookingsPageResult = {
  bookings: Booking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listBookingsPage(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}): Promise<BookingsPageResult> {
  const db = requireDb();
  const page = Math.max(1, Math.floor(opts?.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts?.pageSize || 25)));
  const q = opts?.q?.trim() || '';
  const status = opts?.status?.trim() || '';

  const filters = [];
  if (q) {
    const pattern = `%${q}%`;
    filters.push(
      or(
        ilike(bookings.name, pattern),
        ilike(bookings.trekTitle, pattern),
        ilike(bookings.email, pattern),
        ilike(bookings.phone, pattern),
        ilike(bookings.referenceCode, pattern),
      )!,
    );
  }
  if (status) {
    filters.push(eq(bookings.status, status));
  }
  const where = filters.length ? and(...filters) : undefined;

  const [totalRow] = await db
    .select({ value: count() })
    .from(bookings)
    .where(where);

  const total = Number(totalRow?.value || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = await db
    .select()
    .from(bookings)
    .where(where)
    .orderBy(desc(bookings.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    bookings: rows.map(toBooking),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function createBooking(_input: CreateBookingInput): Promise<Booking> {
  // P0: client-priced creates are permanently disabled. Use createCheckoutBooking.
  throw new Error('LEGACY_BOOKING_DISABLED: use /api/bookings/checkout');
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking | null> {
  try {
    const { applyBookingTransition } = await import('@/lib/bookings/transitions');
    const row = await applyBookingTransition({
      bookingId: id,
      toStatus: status,
      reason: 'admin_status_update',
      actor: 'admin',
    });
    return row ? toBooking(row) : null;
  } catch (err) {
    throw err;
  }
}

export async function listContacts(): Promise<Contact[]> {
  const rows = await requireDb().select().from(contacts).orderBy(desc(contacts.createdAt));
  return rows.map(toContact);
}

export type ContactsPageResult = {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listContactsPage(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<ContactsPageResult> {
  const db = requireDb();
  const page = Math.max(1, Math.floor(opts?.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts?.pageSize || 25)));
  const q = opts?.q?.trim() || '';

  const where = q
    ? or(
        ilike(contacts.name, `%${q}%`),
        ilike(contacts.email, `%${q}%`),
        ilike(contacts.phone, `%${q}%`),
        ilike(contacts.message, `%${q}%`),
      )
    : undefined;

  const [totalRow] = await db.select({ value: count() }).from(contacts).where(where);
  const total = Number(totalRow?.value || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = await db
    .select()
    .from(contacts)
    .where(where)
    .orderBy(desc(contacts.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    contacts: rows.map(toContact),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const [row] = await requireDb()
    .insert(contacts)
    .values({
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      status: input.status ?? 'new',
    })
    .returning();
  return toContact(row!);
}

export async function updateContactStatus(id: string, status: ContactStatus): Promise<Contact | null> {
  const [row] = await requireDb()
    .update(contacts)
    .set({ status })
    .where(eq(contacts.id, id))
    .returning();
  return row ? toContact(row) : null;
}

export async function listGiftCards(): Promise<GiftCard[]> {
  const rows = await requireDb().select().from(giftCards).orderBy(desc(giftCards.createdAt));
  return rows.map(toGiftCard);
}

export async function createGiftCard(input: CreateGiftCardInput): Promise<GiftCard> {
  const [row] = await requireDb()
    .insert(giftCards)
    .values({
      code: input.code,
      amount: input.amount,
      balance: input.balance,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      message: input.message,
      status: input.status ?? 'active',
      expiresAt: new Date(input.expiresAt),
    })
    .returning();
  return toGiftCard(row!);
}

export async function listSubscribers(): Promise<NewsletterSubscriber[]> {
  const rows = await requireDb()
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.subscribedAt));
  return rows.map(toSubscriber);
}

export async function addSubscriber(email: string): Promise<NewsletterSubscriber | null> {
  const normalized = email.trim().toLowerCase();
  const db = requireDb();
  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalized))
    .limit(1);

  if (existing.length > 0) return null;

  const [row] = await db
    .insert(newsletterSubscribers)
    .values({ email: normalized, active: true })
    .returning();
  return toSubscriber(row!);
}

export async function removeSubscriber(id: string): Promise<boolean> {
  const result = await requireDb()
    .delete(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .returning({ id: newsletterSubscribers.id });
  return result.length > 0;
}

export async function listSiteUsers(opts?: { search?: string }): Promise<SiteUser[]> {
  const result = await listSiteUsersPage({
    page: 1,
    pageSize: 10_000,
    q: opts?.search,
  });
  return result.users;
}

export type SiteUsersPageResult = {
  users: SiteUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listSiteUsersPage(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<SiteUsersPageResult> {
  const db = requireDb();
  const page = Math.max(1, Math.floor(opts?.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts?.pageSize || 25)));
  const search = opts?.q?.trim() || '';

  const where = search
    ? or(
        ilike(siteUsers.name, `%${search}%`),
        ilike(siteUsers.email, `%${search}%`),
        ilike(siteUsers.phone, `%${search}%`),
        ilike(siteUsers.firstName, `%${search}%`),
        ilike(siteUsers.lastName, `%${search}%`),
      )
    : undefined;

  const [totalRow] = await db.select({ value: count() }).from(siteUsers).where(where);
  const total = Number(totalRow?.value || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = await db
    .select()
    .from(siteUsers)
    .where(where)
    .orderBy(desc(siteUsers.createdAt))
    .limit(pageSize)
    .offset(offset);

  const lastLoginByUser = new Map<string, string>();
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const loginEvents = await db
      .select({
        userId: authAuditEvents.userId,
        createdAt: authAuditEvents.createdAt,
      })
      .from(authAuditEvents)
      .where(
        and(
          inArray(authAuditEvents.userId, ids),
          inArray(authAuditEvents.event, ['login_success', 'google_login_success']),
        ),
      )
      .orderBy(desc(authAuditEvents.createdAt));

    for (const event of loginEvents) {
      if (!event.userId || lastLoginByUser.has(event.userId)) continue;
      lastLoginByUser.set(event.userId, event.createdAt.toISOString());
    }
  }

  return {
    users: rows.map((row) => toSiteUser(row, lastLoginByUser.get(row.id) ?? null)),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function siteUsersToCsv(rows: SiteUser[]): string {
  const headers = [
    'id',
    'name',
    'firstName',
    'lastName',
    'email',
    'phoneCountryCode',
    'phone',
    'dateOfBirth',
    'gender',
    'nationality',
    'role',
    'authProvider',
    'emailVerified',
    'bookings',
    'avatarUrl',
    'lastLoginAt',
    'createdAt',
    'updatedAt',
  ];

  const escape = (value: unknown) => {
    const raw = value == null ? '' : String(value);
    if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.name,
        row.firstName ?? '',
        row.lastName ?? '',
        row.email,
        row.phoneCountryCode ?? '',
        row.phone ?? '',
        row.dateOfBirth ?? '',
        row.gender ?? '',
        row.nationality ?? '',
        row.role,
        row.authProvider,
        row.emailVerified,
        row.bookings,
        row.avatarUrl ?? '',
        row.lastLoginAt ?? '',
        row.createdAt,
        row.updatedAt ?? '',
      ]
        .map(escape)
        .join(','),
    );
  }
  return lines.join('\n');
}

export function generateGiftCardCode(): string {
  return `TR${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}
