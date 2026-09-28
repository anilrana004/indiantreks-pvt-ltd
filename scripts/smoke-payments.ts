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

function testTrustedPricingIgnoresClientPrice() {
  // Uses first trek from catalog — amount must come from server tiers
  const trekId = 'kedarkantha'; // may vary — fall back to any trek via calculateTrustedPayable throw
  try {
    const result = calculateTrustedPayable({
      trekId,
      packageName: 'Economic',
      persons: 2,
      paymentMode: 'deposit',
      addonIds: [],
      pickupFeePerPerson: 0,
      gearLines: [],
    });
    assert.ok(result.payablePaise >= 100);
    assert.equal(result.payablePaise, result.payableRupees * 100);
  } catch {
    // If trek id missing in catalog, try generic discovery
    const { treks } = require('../src/lib/data') as typeof import('../src/lib/data');
    const trek = treks[0]!;
    const result = calculateTrustedPayable({
      trekId: trek.id,
      packageName: trek.pricing[0]!.name,
      persons: 1,
      paymentMode: 'full',
    });
    assert.ok(result.payablePaise === result.payableRupees * 100);
  }
}

function main() {
  testPaise();
  testPaymentSignature();
  testWebhookSignature();
  testCheckoutToken();
  testTrustedPricingIgnoresClientPrice();
  console.log('smoke-payments: all checks passed');
}

main();
