/** Client-side fetch helpers for admin operations (bookings, contacts, etc.). */

import { adminFetch } from '@/lib/admin/admin-fetch';
import { parseApiJson, unwrapApiJson } from '@/lib/api/client';
import type {
  Booking,
  BookingStatus,
  Contact,
  ContactStatus,
  GiftCard,
  NewsletterSubscriber,
  SiteUser,
} from '@/lib/operations/types';

async function parseJson<T>(res: Response): Promise<T> {
  return parseApiJson<T>(res);
}

function asList<T>(data: T[] | Record<string, T[]>): T[] {
  if (Array.isArray(data)) return data;
  const firstKey = Object.keys(data)[0];
  return firstKey ? (data[firstKey] as T[]) : [];
}

function asOne<T>(data: unknown, key: string): T {
  if (data && typeof data === 'object' && key in data) {
    return (data as Record<string, T>)[key]!;
  }
  return data as T;
}

export async function fetchAdminBookings(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  all?: boolean;
}): Promise<{
  bookings: Booking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  if (opts?.all) params.set('all', '1');
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.pageSize) params.set('pageSize', String(opts.pageSize));
  if (opts?.q) params.set('q', opts.q);
  if (opts?.status) params.set('status', opts.status);
  const qs = params.toString();
  const res = await adminFetch(`/api/admin/bookings${qs ? `?${qs}` : ''}`);
  const data = await parseJson<
    | Booking[]
    | {
        bookings: Booking[];
        total?: number;
        page?: number;
        pageSize?: number;
        totalPages?: number;
      }
  >(res);
  if (Array.isArray(data)) {
    return {
      bookings: data,
      total: data.length,
      page: 1,
      pageSize: data.length || 25,
      totalPages: 1,
    };
  }
  const bookings = Array.isArray(data.bookings) ? data.bookings : [];
  return {
    bookings,
    total: Number(data.total ?? bookings.length),
    page: Number(data.page ?? 1),
    pageSize: Number(data.pageSize ?? (bookings.length || 25)),
    totalPages: Number(data.totalPages ?? 1),
  };
}

export async function patchBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const res = await adminFetch(`/api/admin/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await parseJson<Booking | { booking: Booking }>(res);
  return asOne(data, 'booking');
}

export async function fetchAdminContacts(opts?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<{
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.pageSize) params.set('pageSize', String(opts.pageSize));
  if (opts?.q) params.set('q', opts.q);
  const qs = params.toString();
  const res = await adminFetch(`/api/admin/contacts${qs ? `?${qs}` : ''}`);
  const data = await parseJson<
    Contact[] | {
      contacts: Contact[];
      total?: number;
      page?: number;
      pageSize?: number;
      totalPages?: number;
    }
  >(res);
  if (Array.isArray(data)) {
    return {
      contacts: data,
      total: data.length,
      page: 1,
      pageSize: data.length || 25,
      totalPages: 1,
    };
  }
  const contacts = Array.isArray(data.contacts) ? data.contacts : [];
  return {
    contacts,
    total: Number(data.total ?? contacts.length),
    page: Number(data.page ?? 1),
    pageSize: Number(data.pageSize ?? (contacts.length || 25)),
    totalPages: Number(data.totalPages ?? 1),
  };
}

export type AdminGuestReviewRow = {
  id: string;
  packageId: string;
  packageTitle: string;
  packageHref: string;
  packageKind: 'trek' | 'yatra' | 'trip';
  name: string;
  email: string;
  rating: number;
  text: string;
  avatarUrl: string | null;
  photoUrls: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  moderatedAt: string | null;
  moderatedBy: string | null;
};

export async function fetchAdminGuestReviews(opts?: {
  status?: string;
  q?: string;
}): Promise<AdminGuestReviewRow[]> {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.q) params.set('q', opts.q);
  const qs = params.toString();
  const res = await adminFetch(`/api/admin/reviews${qs ? `?${qs}` : ''}`);
  const data = await parseJson<AdminGuestReviewRow[] | { reviews: AdminGuestReviewRow[] }>(res);
  return asList(data);
}

export async function patchGuestReviewStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
): Promise<AdminGuestReviewRow> {
  const res = await adminFetch(`/api/admin/reviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await parseJson<AdminGuestReviewRow | { review: AdminGuestReviewRow }>(res);
  return asOne(data, 'review');
}

export function adminGuestReviewsExportUrl(format: 'csv' | 'json-download', opts?: {
  status?: string;
  q?: string;
}): string {
  const params = new URLSearchParams({ format });
  if (opts?.status) params.set('status', opts.status);
  if (opts?.q) params.set('q', opts.q);
  return `/api/admin/reviews?${params.toString()}`;
}

export async function patchContactStatus(id: string, status: ContactStatus): Promise<Contact> {
  const res = await adminFetch(`/api/admin/contacts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await parseJson<Contact | { contact: Contact }>(res);
  return asOne(data, 'contact');
}

export async function fetchAdminGiftCards(): Promise<GiftCard[]> {
  const res = await adminFetch('/api/admin/gift-cards');
  const data = await parseJson<GiftCard[] | { giftCards: GiftCard[] }>(res);
  return asList(data);
}

export async function createAdminGiftCard(input: {
  amount: number;
  recipientName: string;
  recipientEmail: string;
  message?: string;
}): Promise<GiftCard> {
  const res = await adminFetch('/api/admin/gift-cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parseJson<GiftCard | { giftCard: GiftCard }>(res);
  return asOne(data, 'giftCard');
}

export async function fetchAdminSubscribers(): Promise<NewsletterSubscriber[]> {
  const res = await adminFetch('/api/admin/newsletter');
  const data = await parseJson<NewsletterSubscriber[] | { subscribers: NewsletterSubscriber[] }>(res);
  return asList(data);
}

export async function createAdminSubscriber(email: string): Promise<NewsletterSubscriber> {
  const res = await adminFetch('/api/admin/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await parseJson<NewsletterSubscriber | { subscriber: NewsletterSubscriber }>(res);
  return asOne(data, 'subscriber');
}

export async function deleteAdminSubscriber(id: string): Promise<void> {
  const res = await adminFetch(`/api/admin/newsletter/${id}`, { method: 'DELETE' });
  if (!res.ok) await parseJson(res);
}

export async function fetchAdminUsers(opts?: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  users: SiteUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  if (opts?.q) params.set('q', opts.q);
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.pageSize) params.set('pageSize', String(opts.pageSize));
  const qs = params.toString();
  const res = await adminFetch(`/api/admin/users${qs ? `?${qs}` : ''}`);
  const data = await parseJson<
    SiteUser[] | {
      users: SiteUser[];
      total?: number;
      count?: number;
      page?: number;
      pageSize?: number;
      totalPages?: number;
    }
  >(res);
  if (Array.isArray(data)) {
    return {
      users: data,
      total: data.length,
      page: 1,
      pageSize: data.length || 25,
      totalPages: 1,
    };
  }
  const users = Array.isArray(data.users) ? data.users : [];
  return {
    users,
    total: Number(data.total ?? data.count ?? users.length),
    page: Number(data.page ?? 1),
    pageSize: Number(data.pageSize ?? (users.length || 25)),
    totalPages: Number(data.totalPages ?? 1),
  };
}

export function adminUsersExportUrl(
  format: 'csv' | 'json-download',
  opts?: { q?: string },
): string {
  const params = new URLSearchParams({ format });
  if (opts?.q) params.set('q', opts.q);
  return `/api/admin/users?${params.toString()}`;
}

type DashboardPayload =
  | {
      bookings: number;
      contacts: number;
      subscribers: number;
      giftCards: number;
      users: number;
      recentBookings: Booking[];
    }
  | {
      counts: {
        bookings: number;
        contacts: number;
        subscribers: number;
        giftCards?: number;
        users?: number;
      };
      recentBookings: Booking[];
    };

export async function fetchAdminDashboardStats(): Promise<{
  bookings: number;
  contacts: number;
  subscribers: number;
  giftCards: number;
  users: number;
  recentBookings: Booking[];
}> {
  const res = await adminFetch('/api/admin/dashboard');
  const data = await parseJson<DashboardPayload>(res);

  if ('counts' in data) {
    return {
      bookings: data.counts.bookings,
      contacts: data.counts.contacts,
      subscribers: data.counts.subscribers,
      giftCards: data.counts.giftCards ?? 0,
      users: data.counts.users ?? 0,
      recentBookings: data.recentBookings,
    };
  }

  return data;
}

export class OperationsDbUnavailableError extends Error {
  constructor() {
    super('Database not configured');
    this.name = 'OperationsDbUnavailableError';
  }
}

export function isDbUnavailableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes('503') ||
    err.message.includes('Database') ||
    err.message.includes('DB_UNAVAILABLE')
  );
}

// Re-export for blog-api compatibility
export { unwrapApiJson };
