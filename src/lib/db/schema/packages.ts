import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Authoritative package pricing. Checkout must load prices from here (not the browser).
 * Catalog code remains a seed/fallback source until admin overrides rows.
 */
export const trekPackages = pgTable('trek_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  trekId: text('trek_id').notNull(),
  packageKey: text('package_key').notNull(),
  name: text('name').notNull(),
  priceInr: integer('price_inr').notNull(),
  originalPriceInr: integer('original_price_inr'),
  depositInr: integer('deposit_inr').notNull(),
  badge: text('badge').notNull().default(''),
  inclusionsJson: text('inclusions_json').notNull().default('[]'),
  exclusionsJson: text('exclusions_json').notNull().default('[]'),
  status: text('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
