import assert from 'node:assert/strict';
import {
  assertBookingStatusTransition,
  assertPaymentStatusTransition,
  assertPaymentTxTransition,
  canTransitionBooking,
  IllegalStateTransitionError,
} from '../src/lib/bookings/state-machine';
import { normalizeParticipantsInput } from '../src/lib/bookings/participants';

/**
 * Offline Phase C smoke tests (no DB).
 * Run: npx tsx scripts/smoke-booking-state.ts
 */

function testBookingTransitions() {
  assertBookingStatusTransition('pending_payment', 'payment_processing');
  assertBookingStatusTransition('payment_processing', 'confirmed');
  assertBookingStatusTransition('confirmed', 'cancelled');
  assertBookingStatusTransition('confirmed', 'confirmed'); // idempotent

  assert.equal(canTransitionBooking('confirmed', 'pending_payment'), false);
  assert.throws(
    () => assertBookingStatusTransition('cancelled', 'confirmed'),
    (err: unknown) => err instanceof IllegalStateTransitionError,
  );
}

function testPaymentTransitions() {
  assertPaymentStatusTransition('awaiting_payment', 'processing');
  assertPaymentStatusTransition('processing', 'paid');
  assertPaymentStatusTransition('paid', 'refund_pending');
  assertPaymentStatusTransition('refund_pending', 'refunded');
  assert.throws(
    () => assertPaymentStatusTransition('refunded', 'paid'),
    (err: unknown) => err instanceof IllegalStateTransitionError,
  );
}

function testTxTransitions() {
  assertPaymentTxTransition('created', 'captured');
  assertPaymentTxTransition('captured', 'refund_pending');
  assertPaymentTxTransition('refund_pending', 'partially_refunded');
}

function testParticipantsNormalize() {
  const out = normalizeParticipantsInput(
    [
      { name: '  Anil  ', age: '30', gender: 'male', phone: '999' },
      { name: '', age: '1' },
      { name: 'Ram' },
    ],
    2,
  );
  assert.equal(out.length, 2);
  assert.equal(out[0]!.name, 'Anil');
  assert.equal(out[1]!.name, 'Ram');
}

function main() {
  testBookingTransitions();
  testPaymentTransitions();
  testTxTransitions();
  testParticipantsNormalize();
  console.log('smoke-booking-state: all checks passed');
}

main();
