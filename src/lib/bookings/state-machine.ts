import type {
  BookingPaymentStatus,
  BookingStatus,
  PaymentTxStatus,
} from '@/lib/operations/types';

/**
 * Legal booking status transitions. Same-status is always allowed (idempotent).
 */
const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ['pending_payment', 'payment_processing', 'cancelled', 'expired', 'payment_failed'],
  pending_payment: [
    'payment_processing',
    'confirmed',
    'payment_failed',
    'cancelled',
    'expired',
  ],
  payment_processing: ['confirmed', 'payment_failed', 'cancelled', 'expired', 'pending_payment'],
  payment_failed: ['pending_payment', 'payment_processing', 'cancelled', 'expired'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
  expired: ['pending_payment'],
};

const PAYMENT_STATUS_TRANSITIONS: Record<BookingPaymentStatus, readonly BookingPaymentStatus[]> = {
  unpaid: ['awaiting_payment', 'failed', 'processing'],
  awaiting_payment: ['processing', 'paid', 'failed', 'unpaid'],
  processing: ['paid', 'failed', 'awaiting_payment'],
  paid: ['refund_pending', 'partially_refunded', 'refunded'],
  failed: ['awaiting_payment', 'processing', 'unpaid'],
  refund_pending: ['refunded', 'partially_refunded', 'paid'],
  refunded: [],
  partially_refunded: ['refund_pending', 'refunded', 'partially_refunded'],
};

const PAYMENT_TX_TRANSITIONS: Record<PaymentTxStatus, readonly PaymentTxStatus[]> = {
  created: ['attempted', 'authorized', 'captured', 'failed', 'refund_pending'],
  attempted: ['authorized', 'captured', 'failed'],
  authorized: ['captured', 'failed'],
  captured: ['refund_pending', 'refunded', 'partially_refunded'],
  failed: ['created', 'attempted'],
  refund_pending: ['refunded', 'partially_refunded', 'captured'],
  refunded: [],
  partially_refunded: ['refund_pending', 'refunded'],
};

export class IllegalStateTransitionError extends Error {
  status = 409;
  code = 'ILLEGAL_STATE_TRANSITION';
  constructor(
    public readonly kind: string,
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Illegal ${kind} transition: ${from} → ${to}`);
    this.name = 'IllegalStateTransitionError';
  }
}

function allows(map: Record<string, readonly string[]>, from: string, to: string): boolean {
  if (from === to) return true;
  const next = map[from];
  return Boolean(next && next.includes(to));
}

export function assertBookingStatusTransition(from: BookingStatus, to: BookingStatus): void {
  if (!allows(BOOKING_TRANSITIONS, from, to)) {
    throw new IllegalStateTransitionError('booking', from, to);
  }
}

export function assertPaymentStatusTransition(
  from: BookingPaymentStatus,
  to: BookingPaymentStatus,
): void {
  if (!allows(PAYMENT_STATUS_TRANSITIONS, from, to)) {
    throw new IllegalStateTransitionError('payment_status', from, to);
  }
}

export function assertPaymentTxTransition(from: PaymentTxStatus, to: PaymentTxStatus): void {
  if (!allows(PAYMENT_TX_TRANSITIONS, from, to)) {
    throw new IllegalStateTransitionError('payment_tx', from, to);
  }
}

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  try {
    assertBookingStatusTransition(from, to);
    return true;
  } catch {
    return false;
  }
}
