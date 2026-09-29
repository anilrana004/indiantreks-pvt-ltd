import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { bookings, siteUsers } from './operations';

/**
 * Authoritative departure inventory. Capacity races are serialized with FOR UPDATE.
 * Available seats = capacity - confirmed_seats - SUM(active holds not yet expired).
 */
export const trekBatches = pgTable('trek_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  trekId: text('trek_id').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull().default(''),
  capacity: integer('capacity').notNull(),
  confirmedSeats: integer('confirmed_seats').notNull().default(0),
  status: text('status').notNull().default('active'),
  cutoffAt: timestamp('cutoff_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookingHolds = pgTable('booking_holds', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id')
    .notNull()
    .references(() => trekBatches.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => siteUsers.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull().default('active'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
