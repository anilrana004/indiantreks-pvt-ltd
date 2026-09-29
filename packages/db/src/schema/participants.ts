import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bookings } from './operations.js';

export const bookingParticipants = pgTable('booking_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  age: text('age').notNull().default(''),
  gender: text('gender').notNull().default(''),
  phone: text('phone').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookingStatusHistory = pgTable('booking_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  fromPaymentStatus: text('from_payment_status'),
  toPaymentStatus: text('to_payment_status'),
  reason: text('reason').notNull().default(''),
  actor: text('actor').notNull().default('system'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
