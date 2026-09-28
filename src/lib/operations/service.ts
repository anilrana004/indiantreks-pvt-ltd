import { desc, eq, inArray, or, ilike } from 'drizzle-orm';
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

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const [row] = await requireDb()
    .insert(bookings)
    .values({
      trekId: input.trekId,
      trekTitle: input.trekTitle,
      name: input.name,
      email: input.email,
      phone: input.phone,
      package: input.package,
      persons: input.persons,
      date: input.date,
      payment: input.payment,
      amount: input.amount,
      status: input.status ?? 'pending_payment',
      notes: input.notes,
      userId: input.userId ?? null,
      referenceCode: input.referenceCode ?? null,
      city: input.city ?? '',
      participantsJson: input.participantsJson ?? '[]',
      pricingSnapshot: input.pricingSnapshot ?? '{}',
      payablePaise: input.payablePaise ?? input.amount * 100,
      totalPaise: input.totalPaise ?? input.amount * 100,
      currency: input.currency ?? 'INR',
      checkoutTokenHash: input.checkoutTokenHash ?? null,
      paymentStatus: input.paymentStatus ?? 'unpaid',
      updatedAt: new Date(),
    })
    .returning();
  return toBooking(row!);
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking | null> {
  const [row] = await requireDb()
    .update(bookings)
    .set({ status })
    .where(eq(bookings.id, id))
    .returning();
  return row ? toBooking(row) : null;
}

export async function listContacts(): Promise<Contact[]> {
  const rows = await requireDb().select().from(contacts).orderBy(desc(contacts.createdAt));
  return rows.map(toContact);
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
  const db = requireDb();
  const search = opts?.search?.trim();

  const rows = search
    ? await db
        .select()
        .from(siteUsers)
        .where(
          or(
            ilike(siteUsers.name, `%${search}%`),
            ilike(siteUsers.email, `%${search}%`),
            ilike(siteUsers.phone, `%${search}%`),
            ilike(siteUsers.firstName, `%${search}%`),
            ilike(siteUsers.lastName, `%${search}%`),
          ),
        )
        .orderBy(desc(siteUsers.createdAt))
    : await db.select().from(siteUsers).orderBy(desc(siteUsers.createdAt));

  const loginEvents = await db
    .select({
      userId: authAuditEvents.userId,
      createdAt: authAuditEvents.createdAt,
    })
    .from(authAuditEvents)
    .where(inArray(authAuditEvents.event, ['login_success', 'google_login_success']))
    .orderBy(desc(authAuditEvents.createdAt));

  const lastLoginByUser = new Map<string, string>();
  for (const event of loginEvents) {
    if (!event.userId || lastLoginByUser.has(event.userId)) continue;
    lastLoginByUser.set(event.userId, event.createdAt.toISOString());
  }

  return rows.map((row) => toSiteUser(row, lastLoginByUser.get(row.id) ?? null));
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
