import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { getCurrentUser } from '@/lib/user-auth/auth';
import type {
  BookingPayment,
  BookingPaymentStatus,
  BookingStatus,
  PaymentTxStatus,
} from '@/lib/operations/types';
import {
  calculateTrustedPayable,
  type CheckoutParticipant,
  type CheckoutPricingInput,
} from '@/lib/payments/pricing';
import {
  createCheckoutToken,
  generateBookingReference,
  getCheckoutLogoUrl,
  getCheckoutThemeColor,
  getMerchantDisplayName,
  getRazorpayClient,
  getRazorpayKeyId,
  hashToken,
  isRazorpayConfigured,
  paymentHoldMinutes,
  verifyCheckoutToken,
  verifyPaymentSignature,
} from '@/lib/payments/razorpay';

const { bookings, paymentTransactions } = schema;

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  return db;
}

function logPayment(event: string, data: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      scope: 'payments',
      event,
      ts: new Date().toISOString(),
      ...data,
    }),
  );
}

export type CheckoutBookingInput = CheckoutPricingInput & {
  name: string;
  email: string;
  phone: string;
  city?: string;
  date: string;
  notes?: string;
  pickup?: string;
  participants?: CheckoutParticipant[];
};

export async function createCheckoutBooking(input: CheckoutBookingInput) {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay is not configured');
  }

  const user = await getCurrentUser();
  if (!user) {
    throw Object.assign(new Error('Authentication required'), { status: 401 });
  }

  // Opportunistic hold cleanup (non-blocking for correctness — also checked on pay)
  try {
    const { expireStaleBookingHolds } = await import('@/lib/payments/holds');
    await expireStaleBookingHolds(50);
  } catch {
    /* ignore cleanup errors */
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (!name || !email || !phone || !input.trekId || !input.date) {
    throw new Error('Missing required booking fields');
  }

  const pricing = calculateTrustedPayable({
    trekId: input.trekId,
    packageName: input.packageName,
    persons: input.persons,
    paymentMode: input.paymentMode,
    addonIds: input.addonIds,
    pickupFeePerPerson: input.pickupFeePerPerson,
    gearLines: input.gearLines,
  });

  const checkoutToken = createCheckoutToken();
  const holdMs = paymentHoldMinutes() * 60 * 1000;
  const holdExpiresAt = new Date(Date.now() + holdMs);
  const participants = (input.participants || [])
    .filter((p) => p.name?.trim())
    .map((p) => ({
      name: p.name.trim(),
      age: p.age?.trim() || '',
      gender: p.gender?.trim() || '',
      phone: p.phone?.trim() || '',
    }));

  const notesParts = [
    input.notes?.trim() || '',
    input.pickup ? `Pickup: ${input.pickup}` : '',
  ].filter(Boolean);

  const [row] = await requireDb()
    .insert(bookings)
    .values({
      trekId: input.trekId,
      trekTitle: pricing.trekTitle,
      name,
      email,
      phone,
      package: pricing.packageName,
      persons: Math.max(1, Math.floor(input.persons) || 1),
      date: input.date,
      payment: input.paymentMode,
      amount: pricing.payableRupees,
      status: 'pending_payment',
      notes: notesParts.join('\n'),
      userId: user.id,
      referenceCode: generateBookingReference(),
      city: input.city?.trim() || '',
      participantsJson: JSON.stringify(participants),
      pricingSnapshot: JSON.stringify(pricing.snapshot),
      payablePaise: pricing.payablePaise,
      totalPaise: pricing.totalPaise,
      currency: 'INR',
      checkoutTokenHash: hashToken(checkoutToken),
      paymentStatus: 'awaiting_payment',
      holdExpiresAt,
      emailStatus: 'not_configured',
      updatedAt: new Date(),
    })
    .returning();

  if (!row) throw new Error('Failed to create booking');

  logPayment('booking_created', {
    bookingId: row.id,
    referenceCode: row.referenceCode,
    payablePaise: row.payablePaise,
    userId: user.id,
  });

  return {
    bookingId: row.id,
    referenceCode: row.referenceCode!,
    checkoutToken,
    payablePaise: row.payablePaise,
    totalPaise: row.totalPaise,
    currency: row.currency,
    amountRupees: pricing.payableRupees,
    holdExpiresAt: holdExpiresAt.toISOString(),
  };
}

async function loadBooking(bookingId: string) {
  const [row] = await requireDb()
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  return row ?? null;
}

/** Only server-priced checkout bookings may initiate Razorpay payment. */
function isTrustedCheckoutBooking(booking: NonNullable<Awaited<ReturnType<typeof loadBooking>>>): boolean {
  if (!booking.checkoutTokenHash || !booking.payablePaise || booking.payablePaise < 100) {
    return false;
  }
  try {
    const snap = JSON.parse(booking.pricingSnapshot || '{}') as {
      trusted?: boolean;
      source?: string;
      payablePaise?: number;
      calculatedAt?: string;
      trekId?: string;
    };
    if (typeof snap.payablePaise !== 'number' || snap.payablePaise !== booking.payablePaise) {
      return false;
    }
    // Current checkout marker
    if (snap.trusted === true && snap.source === 'checkout') return true;
    // Pre-P0 server checkout snapshots (still authoritative; not `{}` legacy inserts)
    if (typeof snap.calculatedAt === 'string' && typeof snap.trekId === 'string') return true;
    return false;
  } catch {
    return false;
  }
}

export async function assertBookingPayable(bookingId: string, checkoutToken: string) {
  const booking = await loadBooking(bookingId);
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });

  if (!isTrustedCheckoutBooking(booking)) {
    throw Object.assign(new Error('Booking is not eligible for payment'), { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    throw Object.assign(new Error('Authentication required'), { status: 401 });
  }

  const tokenOk = verifyCheckoutToken(checkoutToken, booking.checkoutTokenHash);
  const ownerOk =
    user.id === booking.userId || user.email.toLowerCase() === booking.email.toLowerCase();
  if (!tokenOk || !ownerOk) {
    throw Object.assign(new Error('Unauthorized'), { status: 403 });
  }

  if (booking.status === 'confirmed' || booking.paymentStatus === 'paid') {
    throw Object.assign(new Error('Booking already paid'), { status: 409 });
  }

  if (booking.status === 'cancelled' || booking.status === 'expired') {
    throw Object.assign(new Error('Booking is no longer payable'), { status: 409 });
  }

  if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() < Date.now()) {
    await requireDb()
      .update(bookings)
      .set({ status: 'expired', paymentStatus: 'failed', updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));
    throw Object.assign(new Error('Booking payment window expired'), { status: 409 });
  }

  if (!booking.payablePaise || booking.payablePaise < 100) {
    throw Object.assign(new Error('Invalid booking amount'), { status: 400 });
  }

  return booking;
}

function orderResponseFromTx(
  booking: NonNullable<Awaited<ReturnType<typeof loadBooking>>>,
  tx: { razorpayOrderId: string; id: string },
) {
  return {
    bookingId: booking.id,
    referenceCode: booking.referenceCode,
    razorpayOrderId: tx.razorpayOrderId,
    amount: booking.payablePaise,
    currency: booking.currency || 'INR',
    keyId: getRazorpayKeyId(),
    name: getMerchantDisplayName(),
    description: `${booking.trekTitle} · ${booking.referenceCode || booking.id.slice(0, 8)}`,
    prefill: {
      name: booking.name,
      email: booking.email,
      contact: booking.phone,
    },
    theme: { color: getCheckoutThemeColor() },
    image: getCheckoutLogoUrl(),
    notes: {
      bookingId: booking.id,
      referenceCode: booking.referenceCode || '',
    },
  };
}

export async function createRazorpayOrderForBooking(
  bookingId: string,
  checkoutToken: string,
  opts?: { idempotencyKey?: string },
) {
  const booking = await assertBookingPayable(bookingId, checkoutToken);
  const db = requireDb();
  const idempotencyKey =
    opts?.idempotencyKey?.trim() || `order:${booking.id}:${booking.payablePaise}`;

  // Lock booking row + reuse open order / idempotency key before calling Razorpay.
  const locked = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id))
      .for('update')
      .limit(1);

    if (!row) throw Object.assign(new Error('Booking not found'), { status: 404 });
    if (row.status === 'confirmed' || row.paymentStatus === 'paid') {
      throw Object.assign(new Error('Booking already paid'), { status: 409 });
    }
    if (row.holdExpiresAt && row.holdExpiresAt.getTime() < Date.now()) {
      await tx
        .update(bookings)
        .set({ status: 'expired', paymentStatus: 'failed', updatedAt: new Date() })
        .where(eq(bookings.id, row.id));
      throw Object.assign(new Error('Booking payment window expired'), { status: 409 });
    }

    const [byKey] = await tx
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.idempotencyKey, idempotencyKey))
      .limit(1);
    if (byKey && byKey.amountPaise === row.payablePaise && byKey.razorpayOrderId) {
      return { kind: 'reuse' as const, booking: row, tx: byKey };
    }

    const [existing] = await tx
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.bookingId, row.id),
          inArray(paymentTransactions.status, ['created', 'attempted']),
        ),
      )
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(1);

    if (existing && existing.amountPaise === row.payablePaise) {
      return { kind: 'reuse' as const, booking: row, tx: existing };
    }

    await tx
      .update(bookings)
      .set({
        status: 'payment_processing',
        paymentStatus: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, row.id));

    return { kind: 'create' as const, booking: row };
  });

  if (locked.kind === 'reuse') {
    logPayment('order_reused', {
      bookingId: locked.booking.id,
      razorpayOrderId: locked.tx.razorpayOrderId,
      paymentTxId: locked.tx.id,
      idempotencyKey,
    });
    return orderResponseFromTx(locked.booking, locked.tx);
  }

  const razorpay = getRazorpayClient();
  const receipt = (locked.booking.referenceCode || locked.booking.id).slice(0, 40);
  const order = await razorpay.orders.create({
    amount: locked.booking.payablePaise,
    currency: locked.booking.currency || 'INR',
    receipt,
    notes: {
      bookingId: locked.booking.id,
      referenceCode: locked.booking.referenceCode || '',
      trekId: locked.booking.trekId,
      idempotencyKey,
    },
  });

  try {
    const [txRow] = await db
      .insert(paymentTransactions)
      .values({
        bookingId: locked.booking.id,
        razorpayOrderId: order.id,
        amountPaise: locked.booking.payablePaise,
        currency: locked.booking.currency || 'INR',
        status: 'created',
        idempotencyKey,
        updatedAt: new Date(),
      })
      .returning();

    logPayment('order_created', {
      bookingId: locked.booking.id,
      razorpayOrderId: order.id,
      paymentTxId: txRow?.id,
      amountPaise: locked.booking.payablePaise,
      idempotencyKey,
    });

    return orderResponseFromTx(locked.booking, {
      razorpayOrderId: order.id,
      id: txRow?.id || '',
    });
  } catch (err) {
    // Concurrent insert on same idempotency key — return the winner.
    const [winner] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.idempotencyKey, idempotencyKey))
      .limit(1);
    if (winner) {
      logPayment('order_idempotent_race', {
        bookingId: locked.booking.id,
        razorpayOrderId: winner.razorpayOrderId,
        paymentTxId: winner.id,
      });
      return orderResponseFromTx(locked.booking, winner);
    }
    throw err;
  }
}

async function markBookingPaid(opts: {
  bookingId: string;
  paymentTxId: string;
  razorpayPaymentId: string;
  method?: string | null;
  rawStatus?: string | null;
  signatureVerified: boolean;
}) {
  const db = requireDb();
  const now = new Date();

  await db
    .update(paymentTransactions)
    .set({
      razorpayPaymentId: opts.razorpayPaymentId,
      status: 'captured',
      method: opts.method || null,
      signatureVerified: opts.signatureVerified,
      rawStatus: opts.rawStatus || 'captured',
      capturedAt: now,
      updatedAt: now,
      failureReason: null,
    })
    .where(eq(paymentTransactions.id, opts.paymentTxId));

  await db
    .update(bookings)
    .set({
      status: 'confirmed',
      paymentStatus: 'paid',
      confirmedAt: now,
      updatedAt: now,
      emailStatus: 'pending',
    })
    .where(eq(bookings.id, opts.bookingId));

  // Best-effort confirmation email hook (no SMTP configured yet — do not roll back payment)
  try {
    await maybeSendBookingConfirmationEmail(opts.bookingId);
  } catch (err) {
    logPayment('email_failed', {
      bookingId: opts.bookingId,
      error: err instanceof Error ? err.message : 'unknown',
    });
    await db
      .update(bookings)
      .set({ emailStatus: 'failed', updatedAt: new Date() })
      .where(eq(bookings.id, opts.bookingId));
  }

  logPayment('booking_confirmed', {
    bookingId: opts.bookingId,
    paymentTxId: opts.paymentTxId,
    razorpayPaymentId: opts.razorpayPaymentId,
  });
}

async function maybeSendBookingConfirmationEmail(bookingId: string) {
  const booking = await loadBooking(bookingId);
  if (!booking) return;

  const {
    isTransactionalEmailConfigured,
    sendTransactionalEmail,
    bookingConfirmationEmailHtml,
  } = await import('@/lib/email/brevo');

  if (!isTransactionalEmailConfigured()) {
    await requireDb()
      .update(bookings)
      .set({ emailStatus: 'not_configured', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
    return;
  }

  await requireDb()
    .update(bookings)
    .set({ emailStatus: 'pending', updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  const payableRupees = Math.floor((booking.payablePaise || 0) / 100);
  const result = await sendTransactionalEmail({
    toEmail: booking.email,
    toName: booking.name,
    subject: `Booking confirmed — ${booking.trekTitle} (${booking.referenceCode || booking.id.slice(0, 8)})`,
    html: bookingConfirmationEmailHtml({
      name: booking.name,
      trekTitle: booking.trekTitle,
      referenceCode: booking.referenceCode || booking.id.slice(0, 8),
      date: booking.date,
      payableRupees,
      persons: booking.persons,
    }),
    text: `Hi ${booking.name}, your ${booking.trekTitle} booking ${booking.referenceCode || ''} is confirmed.`,
    tags: ['booking-confirmation'],
  });

  if (!result.ok) {
    await requireDb()
      .update(bookings)
      .set({
        emailStatus: result.reason === 'not_configured' ? 'not_configured' : 'failed',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));
    if (result.reason !== 'not_configured') {
      throw new Error(result.detail || 'email_send_failed');
    }
    return;
  }

  await requireDb()
    .update(bookings)
    .set({ emailStatus: 'sent', updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
}

export async function verifyAndConfirmPayment(input: {
  bookingId: string;
  checkoutToken: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const bookingRow = await loadBooking(input.bookingId);
  if (!bookingRow) throw Object.assign(new Error('Booking not found'), { status: 404 });

  if (!isTrustedCheckoutBooking(bookingRow)) {
    throw Object.assign(new Error('Booking is not eligible for payment'), { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    throw Object.assign(new Error('Authentication required'), { status: 401 });
  }
  const tokenOk = verifyCheckoutToken(input.checkoutToken, bookingRow.checkoutTokenHash);
  const ownerOk =
    user.id === bookingRow.userId || user.email.toLowerCase() === bookingRow.email.toLowerCase();
  if (!tokenOk || !ownerOk) {
    throw Object.assign(new Error('Unauthorized'), { status: 403 });
  }

  const db = requireDb();

  const [tx] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.razorpayOrderId, input.razorpayOrderId))
    .limit(1);

  if (!tx || tx.bookingId !== bookingRow.id) {
    logPayment('verify_order_mismatch', {
      bookingId: bookingRow.id,
      razorpayOrderId: input.razorpayOrderId,
    });
    throw Object.assign(new Error('Order does not match booking'), { status: 400 });
  }

  if (
    (bookingRow.status === 'confirmed' && bookingRow.paymentStatus === 'paid') ||
    (tx.status === 'captured' && tx.razorpayPaymentId)
  ) {
    return {
      ok: true as const,
      alreadyConfirmed: true,
      bookingId: bookingRow.id,
      referenceCode: bookingRow.referenceCode,
      status: 'confirmed' as BookingStatus,
      paymentStatus: 'paid' as BookingPaymentStatus,
    };
  }

  const booking = await assertBookingPayable(input.bookingId, input.checkoutToken);

  // Trusted order id from DB — never from browser alone
  const trustedOrderId = tx.razorpayOrderId;

  const signatureOk = verifyPaymentSignature({
    orderId: trustedOrderId,
    paymentId: input.razorpayPaymentId,
    signature: input.razorpaySignature,
  });

  if (!signatureOk) {
    logPayment('signature_failed', {
      bookingId: booking.id,
      paymentTxId: tx.id,
      razorpayOrderId: trustedOrderId,
    });
    throw Object.assign(new Error('Payment signature verification failed'), { status: 400 });
  }

  const razorpay = getRazorpayClient();
  const payment = await razorpay.payments.fetch(input.razorpayPaymentId);

  const paymentAmount = Number(payment.amount);
  const paymentCurrency = String(payment.currency || '').toUpperCase();
  const paymentOrderId = String(payment.order_id || '');
  const paymentStatus = String(payment.status || '');

  if (paymentOrderId !== trustedOrderId) {
    throw Object.assign(new Error('Payment order mismatch'), { status: 400 });
  }
  if (paymentAmount !== tx.amountPaise || paymentAmount !== booking.payablePaise) {
    logPayment('amount_mismatch', {
      bookingId: booking.id,
      expected: booking.payablePaise,
      paymentAmount,
      txAmount: tx.amountPaise,
    });
    throw Object.assign(new Error('Payment amount mismatch'), { status: 400 });
  }
  if (paymentCurrency !== (booking.currency || 'INR').toUpperCase()) {
    throw Object.assign(new Error('Payment currency mismatch'), { status: 400 });
  }
  if (paymentStatus !== 'captured' && paymentStatus !== 'authorized') {
    throw Object.assign(new Error(`Payment not successful (${paymentStatus})`), { status: 400 });
  }

  await markBookingPaid({
    bookingId: booking.id,
    paymentTxId: tx.id,
    razorpayPaymentId: String(payment.id),
    method: payment.method ? String(payment.method) : null,
    rawStatus: paymentStatus,
    signatureVerified: true,
  });

  return {
    ok: true as const,
    alreadyConfirmed: false,
    bookingId: booking.id,
    referenceCode: booking.referenceCode,
    status: 'confirmed' as BookingStatus,
    paymentStatus: 'paid' as BookingPaymentStatus,
  };
}

export async function markPaymentFailed(opts: {
  bookingId: string;
  razorpayOrderId?: string;
  reason?: string;
}) {
  const db = requireDb();
  const now = new Date();

  const booking = await loadBooking(opts.bookingId);
  // Never overwrite a completed paid booking with a late/duplicate failure event.
  if (
    booking &&
    (booking.paymentStatus === 'paid' ||
      booking.paymentStatus === 'refunded' ||
      booking.paymentStatus === 'partially_refunded' ||
      booking.paymentStatus === 'refund_pending')
  ) {
    logPayment('webhook_ignore_failed_after_paid', {
      bookingId: opts.bookingId,
      paymentStatus: booking.paymentStatus,
    });
    return { ignored: true as const };
  }

  if (opts.razorpayOrderId) {
    await db
      .update(paymentTransactions)
      .set({
        status: 'failed',
        failureReason: opts.reason || 'payment_failed',
        failedAt: now,
        updatedAt: now,
      })
      .where(eq(paymentTransactions.razorpayOrderId, opts.razorpayOrderId));
  }

  await db
    .update(bookings)
    .set({
      status: 'payment_failed',
      paymentStatus: 'failed',
      updatedAt: now,
    })
    .where(eq(bookings.id, opts.bookingId));

  return { ignored: false as const };
}

export async function confirmFromWebhookPayment(opts: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  currency: string;
  method?: string | null;
  status: string;
}) {
  const db = requireDb();
  const [tx] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.razorpayOrderId, opts.razorpayOrderId))
    .limit(1);

  if (!tx) {
    logPayment('webhook_unknown_order', { razorpayOrderId: opts.razorpayOrderId });
    return { handled: false as const };
  }

  if (tx.status === 'captured') {
    return { handled: true as const, duplicate: true };
  }

  const booking = await loadBooking(tx.bookingId);
  if (!booking) return { handled: false as const };

  if (opts.amountPaise !== tx.amountPaise || opts.amountPaise !== booking.payablePaise) {
    logPayment('webhook_amount_mismatch', {
      bookingId: booking.id,
      expected: booking.payablePaise,
      got: opts.amountPaise,
    });
    return { handled: false as const };
  }

  if (opts.status === 'captured' || opts.status === 'authorized') {
    await markBookingPaid({
      bookingId: booking.id,
      paymentTxId: tx.id,
      razorpayPaymentId: opts.razorpayPaymentId,
      method: opts.method,
      rawStatus: opts.status,
      signatureVerified: true,
    });
    return { handled: true as const, duplicate: false };
  }

  if (opts.status === 'failed') {
    await markPaymentFailed({
      bookingId: booking.id,
      razorpayOrderId: opts.razorpayOrderId,
      reason: 'webhook_payment_failed',
    });
    return { handled: true as const, duplicate: false };
  }

  return { handled: false as const };
}

export async function getBookingPublicSummary(bookingId: string, checkoutToken: string) {
  const booking = await loadBooking(bookingId);
  if (!booking) return null;
  const user = await getCurrentUser();
  const tokenOk = verifyCheckoutToken(checkoutToken, booking.checkoutTokenHash);
  const ownerOk = Boolean(user && (user.id === booking.userId || user.email.toLowerCase() === booking.email.toLowerCase()));
  if (!tokenOk && !ownerOk) return null;

  const [tx] = await requireDb()
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.bookingId, booking.id))
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(1);

  return {
    bookingId: booking.id,
    referenceCode: booking.referenceCode,
    trekTitle: booking.trekTitle,
    date: booking.date,
    persons: booking.persons,
    package: booking.package,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    city: booking.city,
    amountRupees: booking.amount,
    payablePaise: booking.payablePaise,
    totalPaise: booking.totalPaise,
    currency: booking.currency,
    status: booking.status as BookingStatus,
    paymentStatus: booking.paymentStatus as BookingPaymentStatus,
    paymentMode: booking.payment as BookingPayment,
    razorpayPaymentId: tx?.razorpayPaymentId ?? null,
    method: tx?.method ?? null,
    confirmedAt: booking.confirmedAt?.toISOString() ?? null,
  };
}
