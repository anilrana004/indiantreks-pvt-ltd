import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import {
  hashToken,
  rupeesToPaise,
  verifyCheckoutToken,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../src/lib/payments/razorpay';
import { calculateTrustedPayable } from '../src/lib/payments/pricing';
import { resolveTrustedPickupFeeInr } from '../src/lib/payments/pickup-fees';
import { treks } from '../src/lib/data';

/**
 * Lightweight security smoke tests for payment helpers.
 * Run: npx tsx scripts/smoke-payments.ts
 *
 * Requires no network. Sets temporary env for HMAC tests.
 */

process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_do_not_use_live';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_do_not_use_live';

function testPaise() {
  assert.equal(rupeesToPaise(18669), 1866900);
  assert.equal(rupeesToPaise(5998), 599800);
}

function testPaymentSignature() {
  const orderId = 'order_test123';
  const paymentId = 'pay_test456';
  const signature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  assert.equal(
    verifyPaymentSignature({ orderId, paymentId, signature }),
    true,
  );
  assert.equal(
    verifyPaymentSignature({ orderId, paymentId, signature: 'deadbeef' }),
    false,
  );
  // Tampered order id must fail
  assert.equal(
    verifyPaymentSignature({ orderId: 'order_other', paymentId, signature }),
    false,
  );
}

function testWebhookSignature() {
  const raw = '{"event":"payment.captured","id":"evt_1"}';
  const signature = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(raw)
    .digest('hex');
  assert.equal(verifyWebhookSignature(raw, signature), true);
  assert.equal(verifyWebhookSignature(raw, '00'), false);
  assert.equal(verifyWebhookSignature('{"tampered":true}', signature), false);
}

function testCheckoutToken() {
  const token = 'abc123token';
  const hash = hashToken(token);
  assert.equal(verifyCheckoutToken(token, hash), true);
  assert.equal(verifyCheckoutToken('wrong', hash), false);
}

function testPickupFeeAllowlist() {
  assert.equal(resolveTrustedPickupFeeInr(0), 0);
  assert.equal(resolveTrustedPickupFeeInr(2000), 2000);
  assert.equal(resolveTrustedPickupFeeInr(99999), 0);
  assert.equal(resolveTrustedPickupFeeInr(-100), 0);
  assert.equal(resolveTrustedPickupFeeInr('2000'), 2000);
  assert.equal(resolveTrustedPickupFeeInr('not-a-number'), 0);
  assert.equal(resolveTrustedPickupFeeInr(1500), 0);
}

function testTrustedPricingIgnoresClientPrice() {
  const trek = treks.find((t) => t.id === 'kedarkantha') ?? treks[0]!;
  const packageName = trek.pricing[0]!.name;

  const baseline = calculateTrustedPayable({
    trekId: trek.id,
    packageName,
    persons: 2,
    paymentMode: 'full',
    addonIds: [],
    pickupFeePerPerson: 0,
    gearLines: [],
  });
  assert.ok(baseline.payablePaise >= 100);
  assert.equal(baseline.payablePaise, baseline.payableRupees * 100);
  assert.equal(baseline.snapshot.priceSource, 'catalog_fallback');

  const withAllowedPickup = calculateTrustedPayable({
    trekId: trek.id,
    packageName,
    persons: 2,
    paymentMode: 'full',
    pickupFeePerPerson: 2000,
  });
  assert.equal(
    withAllowedPickup.payableRupees,
    baseline.payableRupees + 2000 * 2,
  );

  const withInjectedPickup = calculateTrustedPayable({
    trekId: trek.id,
    packageName,
    persons: 2,
    paymentMode: 'full',
    pickupFeePerPerson: 50_000,
  });
  // Inflated client fee must be ignored (clamped to allowlist → 0).
  assert.equal(withInjectedPickup.payableRupees, baseline.payableRupees);
}

function testLegacyBookingRouteIsGone() {
  // Static guard: legacy POST /api/bookings must remain disabled (410).
  // The route file is the source of truth for this smoke (no HTTP required).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  const path = require('node:path') as typeof import('node:path');
  const routePath = path.join(__dirname, '../src/app/api/bookings/route.ts');
  const src = fs.readFileSync(routePath, 'utf8');
  assert.match(src, /410/);
  assert.match(src, /disabled|LEGACY|checkout/i);
}

function testAuthRequiredGuardsPresent() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  const path = require('node:path') as typeof import('node:path');
  const service = fs.readFileSync(
    path.join(__dirname, '../src/lib/payments/service.ts'),
    'utf8',
  );
  assert.match(service, /Authentication required/);
  assert.match(service, /status:\s*401/);

  const checkout = fs.readFileSync(
    path.join(__dirname, '../src/app/api/bookings/checkout/route.ts'),
    'utf8',
  );
  assert.match(checkout, /AUTH_REQUIRED/);

  const createOrder = fs.readFileSync(
    path.join(__dirname, '../src/app/api/payments/create-order/route.ts'),
    'utf8',
  );
  assert.match(createOrder, /AUTH_REQUIRED/);
}

function main() {
  testPaise();
  testPaymentSignature();
  testWebhookSignature();
  testCheckoutToken();
  testPickupFeeAllowlist();
  testTrustedPricingIgnoresClientPrice();
  testLegacyBookingRouteIsGone();
  testAuthRequiredGuardsPresent();
  console.log('smoke-payments: all checks passed');
}

main();
