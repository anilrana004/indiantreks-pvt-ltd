import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { isDbConfigured } from '../src/lib/db';
import { ensureTrekBatch, reserveInventory, releaseHold } from '../src/lib/inventory/service';
import { adminHasPermission, resolveAdminRole } from '../src/lib/admin/rbac';

/**
 * Phase D ops smoke:
 * - RBAC permission matrix (offline)
 * - Optional DB concurrency: capacity=1, N parallel reserves → exactly 1 win
 *
 * Run: npx tsx scripts/smoke-ops-hardening.ts
 */

function testRbac() {
  assert.equal(adminHasPermission('SUPER_ADMIN', 'refunds.write'), true);
  assert.equal(adminHasPermission('FINANCE', 'refunds.write'), true);
  assert.equal(adminHasPermission('CONTENT_EDITOR', 'refunds.write'), false);
  assert.equal(adminHasPermission('SUPPORT', 'bookings.write'), false);
  assert.equal(adminHasPermission('OPERATIONS', 'bookings.write'), true);
  // Default env role resolves without throw
  resolveAdminRole();
}

async function testInventoryConcurrency() {
  if (!isDbConfigured()) {
    console.log('smoke-ops-hardening: skip concurrency (no DATABASE_URL)');
    return;
  }

  const trekId = 'kedarkantha';
  const startDate = '2099-12-01'; // far-future synthetic batch
  const batch = await ensureTrekBatch({
    trekId,
    startDate,
    endDate: '2099-12-05',
    capacity: 1,
  });

  // Reset capacity to 1 for the race (admin-style update via ensure already set)
  const { getDb, schema } = await import('../src/lib/db');
  const db = getDb()!;
  await db
    .update(schema.trekBatches)
    .set({ capacity: 1, confirmedSeats: 0, status: 'active', updatedAt: new Date() })
    .where((await import('drizzle-orm')).eq(schema.trekBatches.id, batch.id));

  // Clear active holds on this batch
  await db
    .update(schema.bookingHolds)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where((await import('drizzle-orm')).eq(schema.bookingHolds.batchId, batch.id));

  const attempts = 10;
  const results = await Promise.allSettled(
    Array.from({ length: attempts }, () =>
      reserveInventory({
        trekId,
        batchId: batch.id,
        quantity: 1,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      }),
    ),
  );

  const wins = results.filter((r) => r.status === 'fulfilled');
  const losses = results.filter((r) => r.status === 'rejected');

  assert.equal(wins.length, 1, `expected exactly 1 reservation, got ${wins.length}`);
  assert.equal(losses.length, attempts - 1);

  // Cleanup winning hold
  const holdId = (wins[0] as PromiseFulfilledResult<{ holdId: string }>).value.holdId;
  await releaseHold(holdId, 'cancelled');

  console.log(
    JSON.stringify({
      concurrency: 'ok',
      wins: wins.length,
      losses: losses.length,
      batchId: batch.id,
    }),
  );
}

async function main() {
  testRbac();
  await testInventoryConcurrency();
  console.log('smoke-ops-hardening: all checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
