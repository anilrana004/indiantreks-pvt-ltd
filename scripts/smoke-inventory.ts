import assert from 'node:assert/strict';
import { resolveStartDate } from '../src/lib/inventory/service';
import { INVENTORY_IS_AUTHORITATIVE } from '../src/lib/batches';

/**
 * Offline inventory helpers smoke test (no DB required).
 * Run: npx tsx scripts/smoke-inventory.ts
 */

function testResolveStartDate() {
  assert.equal(
    resolveStartDate({ trekId: 'kedarkantha', batchId: 'kedarkantha-2026-11-01' }),
    '2026-11-01',
  );
  assert.equal(
    resolveStartDate({ trekId: 'kedarkantha', date: '2026-12-15' }),
    '2026-12-15',
  );
  assert.equal(
    resolveStartDate({
      trekId: 'kedarkantha',
      batchId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    }),
    '',
  );
}

function testFlag() {
  assert.equal(INVENTORY_IS_AUTHORITATIVE, true);
}

function main() {
  testResolveStartDate();
  testFlag();
  console.log('smoke-inventory: all checks passed');
}

main();
