import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { isDbConfigured } from '@indiantreks/db';
import {
  createBooking,
  createContact,
  addSubscriber,
  listBookings,
  listContacts,
  listSubscribers,
  listGiftCards,
  createGiftCard,
  listSiteUsers,
  updateBookingStatus,
  updateContactStatus,
  removeSubscriber,
  generateGiftCardCode,
} from '@indiantreks/operations';
import type { BookingStatus, ContactStatus } from '@indiantreks/operations/types';
import { apiError, apiSuccess } from '@indiantreks/shared';
import {
  createAdminSessionToken,
  sessionCookieOptions,
  ADMIN_COOKIE,
} from '../lib/session.js';
import type { AdminVariables } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { knowledgeRoutes } from './v1/admin/knowledge.js';

const v1 = new Hono();

function dbGuard() {
  if (!isDbConfigured()) {
    return apiError('DB_UNAVAILABLE', 'Database not configured', 503);
  }
  return null;
}

// --- Public ---

v1.post('/bookings', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  try {
    const body = await c.req.json();
    const { trekId, trekTitle, name, email, phone, package: pkg, persons, date, payment, amount, notes } = body;

    if (!name || !email || !phone || !trekId) {
      return apiError('VALIDATION_ERROR', 'Missing required fields: name, email, phone, trekId', 400);
    }

    const booking = await createBooking({
      trekId,
      trekTitle: trekTitle ?? trekId,
      name,
      email,
      phone,
      package: pkg || 'Standard',
      persons: persons || 1,
      date: date || '',
      payment: payment || 'deposit',
      amount: amount || 0,
      notes: notes || '',
    });

    return apiSuccess(booking, 201);
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid booking request', 400);
  }
});

v1.post('/contacts', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  try {
    const body = await c.req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return apiError('VALIDATION_ERROR', 'Missing required fields: name, email, message', 400);
    }

    const contact = await createContact({ name, email, phone, message });
    return apiSuccess(contact, 201);
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid contact request', 400);
  }
});

v1.post('/newsletter', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  try {
    const body = await c.req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return apiError('VALIDATION_ERROR', 'Email is required', 400);
    }

    const subscriber = await addSubscriber(email);
    if (!subscriber) {
      return apiError('VALIDATION_ERROR', 'Email already subscribed', 409);
    }

    return apiSuccess(subscriber, 201);
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid newsletter request', 400);
  }
});

// --- Auth ---

v1.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return apiError('INTERNAL_ERROR', 'Admin credentials not configured', 503);
    }

    if (
      process.env.NODE_ENV === 'production' &&
      (adminPassword === 'admin123' || adminPassword.length < 12)
    ) {
      return apiError('INTERNAL_ERROR', 'Admin credentials are not configured for production', 503);
    }

    if (!email || !password) {
      return apiError('VALIDATION_ERROR', 'Email and password required', 400);
    }

    if (email !== adminEmail || password !== adminPassword) {
      return apiError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    const token = await createAdminSessionToken(email);
    const secure = process.env.NODE_ENV === 'production';
    setCookie(c, ADMIN_COOKIE, token, sessionCookieOptions(secure));

    return apiSuccess({ email, name: 'Admin', role: 'admin' as const, token });
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid login request', 400);
  }
});

v1.post('/auth/logout', (c) => {
  const secure = process.env.NODE_ENV === 'production';
  deleteCookie(c, ADMIN_COOKIE, { path: '/', secure, sameSite: 'Lax' });
  return apiSuccess({ loggedOut: true });
});

// --- Admin (protected) ---

const admin = new Hono<{ Variables: AdminVariables }>();
admin.use('*', requireAdmin);

admin.get('/dashboard', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  const [bookingList, contactList, subscriberList, giftCardList, userList] = await Promise.all([
    listBookings(),
    listContacts(),
    listSubscribers(),
    listGiftCards(),
    listSiteUsers(),
  ]);

  return apiSuccess({
    counts: {
      bookings: bookingList.length,
      contacts: contactList.length,
      subscribers: subscriberList.filter((s) => s.active).length,
      giftCards: giftCardList.length,
      users: userList.length,
    },
    recentBookings: bookingList.slice(0, 5),
  });
});

admin.get('/bookings', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;
  return apiSuccess(await listBookings());
});

admin.patch('/bookings/:id', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  const body = await c.req.json();
  const status = body.status as BookingStatus;
  if (!status) return apiError('VALIDATION_ERROR', 'status is required', 400);

  const updated = await updateBookingStatus(c.req.param('id'), status);
  if (!updated) return apiError('NOT_FOUND', 'Booking not found', 404);
  return apiSuccess(updated);
});

admin.get('/contacts', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;
  return apiSuccess(await listContacts());
});

admin.patch('/contacts/:id', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  const body = await c.req.json();
  const status = body.status as ContactStatus;
  if (!status) return apiError('VALIDATION_ERROR', 'status is required', 400);

  const updated = await updateContactStatus(c.req.param('id'), status);
  if (!updated) return apiError('NOT_FOUND', 'Contact not found', 404);
  return apiSuccess(updated);
});

admin.get('/newsletter', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;
  return apiSuccess(await listSubscribers());
});

admin.post('/newsletter', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  try {
    const body = await c.req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email) return apiError('VALIDATION_ERROR', 'Email is required', 400);

    const subscriber = await addSubscriber(email);
    if (!subscriber) return apiError('VALIDATION_ERROR', 'Already subscribed', 409);
    return apiSuccess(subscriber, 201);
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid newsletter request', 400);
  }
});

admin.delete('/newsletter/:id', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  const removed = await removeSubscriber(c.req.param('id'));
  if (!removed) return apiError('NOT_FOUND', 'Subscriber not found', 404);
  return apiSuccess({ removed: true });
});

admin.get('/gift-cards', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;
  return apiSuccess(await listGiftCards());
});

admin.post('/gift-cards', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;

  const body = await c.req.json();
  const card = await createGiftCard({
    code: body.code || generateGiftCardCode(),
    amount: body.amount,
    balance: body.balance ?? body.amount,
    recipientName: body.recipientName,
    recipientEmail: body.recipientEmail,
    message: body.message,
    expiresAt: body.expiresAt,
  });
  return apiSuccess(card, 201);
});

admin.get('/users', async (c) => {
  const blocked = dbGuard();
  if (blocked) return blocked;
  return apiSuccess(await listSiteUsers());
});

admin.route('/', knowledgeRoutes);

v1.route('/admin', admin);

export { v1 };
