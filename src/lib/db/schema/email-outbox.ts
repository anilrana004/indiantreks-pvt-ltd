import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bookings } from './operations';

export const emailOutbox = pgTable('email_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  toEmail: text('to_email').notNull(),
  toName: text('to_name').notNull().default(''),
  subject: text('subject').notNull(),
  html: text('html').notNull(),
  text: text('text').notNull().default(''),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(8),
  lastError: text('last_error'),
  providerMessageId: text('provider_message_id'),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
