import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '@indiantreks/db';
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
} from './types.js';

const { bookings, contacts, giftCards, newsletterSubscribers, siteUsers } = schema;

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

function toSiteUser(row: typeof siteUsers.$inferSelect): SiteUser {
  const hasGoogle = Boolean(row.googleSub);
  const hasPassword = Boolean(row.passwordHash);
  const authProvider: SiteUser['authProvider'] =
    hasGoogle && hasPassword ? 'both' : hasGoogle ? 'google' : hasPassword ? 'password' : 'unknown';
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
    authProvider,
    hasGoogle,
    hasPassword,
    lastLoginAt: null,
    updatedAt: row.updatedAt?.toISOString?.() ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listBookings(): Promise<Booking[]> {
  const rows = await requireDb().select().from(bookings).orderBy(desc(bookings.createdAt));
  return rows.map(toBooking);
}

export async function createBooking(_input: CreateBookingInput): Promise<Booking> {
  // P0: client-priced creates are permanently disabled. Use trusted checkout on the storefront.
  throw new Error('LEGACY_BOOKING_DISABLED: use /api/bookings/checkout');
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

export async function listSiteUsers(): Promise<SiteUser[]> {
  const rows = await requireDb().select().from(siteUsers).orderBy(desc(siteUsers.createdAt));
  return rows.map(toSiteUser);
}

export function generateGiftCardCode(): string {
  return `TR${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}
