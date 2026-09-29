import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  trekId: text('trek_id').notNull(),
  trekTitle: text('trek_title').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  package: text('package').notNull().default('Standard'),
  persons: integer('persons').notNull().default(1),
  date: text('date').notNull().default(''),
  payment: text('payment').notNull().default('deposit'),
  /** Display amount in whole INR (payable now). */
  amount: integer('amount').notNull().default(0),
  status: text('status').notNull().default('pending_payment'),
  notes: text('notes').notNull().default(''),
  userId: uuid('user_id'),
  referenceCode: text('reference_code'),
  city: text('city').notNull().default(''),
  participantsJson: text('participants_json').notNull().default('[]'),
  pricingSnapshot: text('pricing_snapshot').notNull().default('{}'),
  payablePaise: integer('payable_paise').notNull().default(0),
  totalPaise: integer('total_paise').notNull().default(0),
  currency: text('currency').notNull().default('INR'),
  checkoutTokenHash: text('checkout_token_hash'),
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  emailStatus: text('email_status').notNull().default('not_configured'),
  batchId: uuid('batch_id'),
  holdId: uuid('hold_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  razorpayOrderId: text('razorpay_order_id').notNull().unique(),
  razorpayPaymentId: text('razorpay_payment_id').unique(),
  amountPaise: integer('amount_paise').notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('created'),
  method: text('method'),
  signatureVerified: boolean('signature_verified').notNull().default(false),
  idempotencyKey: text('idempotency_key').unique(),
  failureReason: text('failure_reason'),
  rawStatus: text('raw_status'),
  capturedAt: timestamp('captured_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const paymentWebhookEvents = pgTable('payment_webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  payloadHash: text('payload_hash').notNull(),
  processed: boolean('processed').notNull().default(false),
  processingError: text('processing_error'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const paymentRefunds = pgTable('payment_refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentTransactionId: uuid('payment_transaction_id')
    .notNull()
    .references(() => paymentTransactions.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  razorpayRefundId: text('razorpay_refund_id').unique(),
  amountPaise: integer('amount_paise').notNull(),
  status: text('status').notNull().default('requested'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message').notNull(),
  status: text('status').notNull().default('new'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const giftCards = pgTable('gift_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  amount: integer('amount').notNull(),
  balance: integer('balance').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  message: text('message').default(''),
  status: text('status').notNull().default('active'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  active: boolean('active').notNull().default(true),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const siteUsers = pgTable('site_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  phoneCountryCode: text('phone_country_code').default('+91'),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  nationality: text('nationality'),
  role: text('role').notNull().default('user'),
  bookingsCount: integer('bookings_count').notNull().default(0),
  passwordHash: text('password_hash'),
  googleSub: text('google_sub'),
  emailVerified: boolean('email_verified').notNull().default(false),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => siteUsers.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const authAuditEvents = pgTable('auth_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => siteUsers.id, { onDelete: 'set null' }),
  email: text('email'),
  event: text('event').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  meta: text('meta').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
