import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import {
  assertBookingStatusTransition,
  assertPaymentStatusTransition,
} from '@/lib/bookings/state-machine';
import {
  normalizeParticipantsInput,
  replaceBookingParticipants,
} from '@/lib/bookings/participants';
import {
  attachHoldToBooking,
  expireStaleInventoryHolds,
  releaseHold,
  reserveInventory,
} from '@/lib/inventory/service';
import { getCurrentUser } from '@/lib/user-auth/auth';
import type { PublicUser } from '@/lib/user-auth/types';
import type {
  BookingPayment,
  BookingPaymentStatus,
  BookingStatus,
  PaymentTxStatus,
} from '@/lib/operations/types';
import {
  resolveTrustedPayable,
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
  batchId?: string;
  notes?: string;
  pickup?: string;
  participants?: CheckoutParticipant[];
  /** When provided by an authenticated route, skips a second getCurrentUser DB hit. */
  user?: PublicUser;
};

export async function createCheckoutBooking(input: CheckoutBookingInput) {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay is not configured');
  }

  const user = input.user ?? (await getCurrentUser());
  if (!user) {
    throw Object.assign(new Error('Please sign in to continue.'), { status: 401 });
  }

  // Opportunistic hold cleanup — never block Pay Now on this.
  void expireStaleInventoryHolds(50).catch(() => {
    /* ignore cleanup errors */
  });

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (!name || !email || !phone || !input.trekId || !input.date) {
    throw new Error('Missing required booking fields');
  }

  const pricing = await resolveTrustedPayable({
    trekId: input.trekId,
    packageName: input.packageName,
    persons: input.persons,
    paymentMode: input.paymentMode,
    addonIds: input.addonIds,
    pickupFeePerPerson: input.pickupFeePerPerson,
    gearLines: input.gearLines,
  });

  const persons = Math.max(1, Math.min(20, Math.floor(input.persons) || 1));
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

  const reservation = await reserveInventory({
    trekId: input.trekId,
    startDate: input.date,
    batchId: input.batchId,
    quantity: persons,
    userId: user.id,
    expiresAt: holdExpiresAt,
  });

  let row: typeof bookings.$inferSelect | undefined;
  try {
    const inserted = await requireDb()
      .insert(bookings)
      .values({
        trekId: input.trekId,
        trekTitle: pricing.trekTitle,
        name,
        email,
        phone,
        package: pricing.packageName,
        persons,
        date: reservation.startDate,
        payment: input.paymentMode,
        amount: pricing.payableRupees,
        status: 'pending_payment',
        notes: notesParts.join('\n'),
        userId: user.id,
        referenceCode: generateBookingReference(),
        city: input.city?.trim() || '',
        participantsJson: JSON.stringify(participants),
        pricingSnapshot: JSON.stringify({
          ...pricing.snapshot,
          batchId: reservation.batchId,
          holdId: reservation.holdId,
        }),
        payablePaise: pricing.payablePaise,
        totalPaise: pricing.totalPaise,
        currency: 'INR',
        checkoutTokenHash: hashToken(checkoutToken),
        paymentStatus: 'awaiting_payment',
        holdExpiresAt,
        batchId: reservation.batchId,
        holdId: reservation.holdId,
        emailStatus: 'not_configured',
        updatedAt: new Date(),
      })
      .returning();
    row = inserted[0];
    if (!row) throw new Error('Failed to create booking');

    const normalized = normalizeParticipantsInput(input.participants, persons);
    // Hold link + participants are independent after insert.
    await Promise.all([
      attachHoldToBooking(reservation.holdId, row.id, reservation.batchId),
      replaceBookingParticipants(row.id, normalized),
    ]);
  } catch (err) {
    try {
      await releaseHold(reservation.holdId, 'cancelled');
    } catch {
      /* best-effort */
    }
    throw err;
  }

  logPayment('booking_created', {
    bookingId: row.id,
    referenceCode: row.referenceCode,
    payablePaise: row.payablePaise,
    userId: user.id,
    batchId: reservation.batchId,
    holdId: reservation.holdId,
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
    batchId: reservation.batchId,
  };
}

export type PayNowCheckoutInput = CheckoutBookingInput & {
  idempotencyKey: string;
};

/**
 * Single Pay Now path: price → (inventory reserve ∥ Razorpay order) → booking insert.
 * Returns everything needed to open Standard Checkout with no second round-trip.
 */
export async function createPayNowCheckout(input: PayNowCheckoutInput) {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay is not configured');
  }

  const user = input.user ?? (await getCurrentUser());
  if (!user) {
    throw Object.assign(new Error('Please sign in to continue.'), { status: 401 });
  }

  void expireStaleInventoryHolds(50).catch(() => {
    /* ignore */
  });

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (!name || !email || !phone || !input.trekId || !input.date) {
    throw new Error('Missing required booking fields');
  }

  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) throw new Error('Missing idempotency key');

  const db = requireDb();

  // Idempotent retry: same fingerprint / click returns the existing open order.
  {
    const [existingTx] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existingTx?.razorpayOrderId) {
      const booking = await loadBooking(existingTx.bookingId);
      if (
        booking &&
        booking.userId === user.id &&
        booking.paymentStatus !== 'paid' &&
        booking.status !== 'cancelled' &&
        booking.status !== 'expired' &&
        isTrustedCheckoutBooking(booking)
      ) {
        // Rotate checkout token so retries / page-refresh still verify cleanly.
        const rotatedToken = createCheckoutToken();
        await db
          .update(bookings)
          .set({ checkoutTokenHash: hashToken(rotatedToken), updatedAt: new Date() })
          .where(eq(bookings.id, booking.id));
        logPayment('pay_now_reused', {
          bookingId: booking.id,
          razorpayOrderId: existingTx.razorpayOrderId,
          idempotencyKey,
        });
        return {
          checkoutToken: rotatedToken,
          reused: true as const,
          ...orderResponseFromTx(booking, existingTx),
        };
      }
    }
  }

  const pricing = await resolveTrustedPayable({
    trekId: input.trekId,
    packageName: input.packageName,
    persons: input.persons,
    paymentMode: input.paymentMode,
    addonIds: input.addonIds,
    pickupFeePerPerson: input.pickupFeePerPerson,
    gearLines: input.gearLines,
  });

  const persons = Math.max(1, Math.min(20, Math.floor(input.persons) || 1));
  const bookingId = crypto.randomUUID();
  const checkoutToken = createCheckoutToken();
  const referenceCode = generateBookingReference();
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

  const razorpay = getRazorpayClient();
  const receipt = referenceCode.slice(0, 40);

  // Overlap inventory reserve with Razorpay Orders API (dominant latency).
  // Orphan unpaid Razorpay orders are harmless if reserve fails afterward.
  let reservation: Awaited<ReturnType<typeof reserveInventory>> | null = null;
  try {
    const [res, order] = await Promise.all([
      reserveInventory({
        trekId: input.trekId,
        startDate: input.date,
        batchId: input.batchId,
        quantity: persons,
        userId: user.id,
        expiresAt: holdExpiresAt,
      }),
      razorpay.orders.create({
        amount: pricing.payablePaise,
        currency: 'INR',
        receipt,
        notes: {
          bookingId,
          referenceCode,
          trekId: input.trekId,
          idempotencyKey,
        },
      }),
    ]);
    reservation = res;

    const normalized = normalizeParticipantsInput(input.participants, persons);

    const inserted = await db
      .insert(bookings)
      .values({
        id: bookingId,
        trekId: input.trekId,
        trekTitle: pricing.trekTitle,
        name,
        email,
        phone,
        package: pricing.packageName,
        persons,
        date: reservation.startDate,
        payment: input.paymentMode,
        amount: pricing.payableRupees,
        status: 'payment_processing',
        notes: notesParts.join('\n'),
        userId: user.id,
        referenceCode,
        city: input.city?.trim() || '',
        participantsJson: JSON.stringify(participants),
        pricingSnapshot: JSON.stringify({
          ...pricing.snapshot,
          batchId: reservation.batchId,
          holdId: reservation.holdId,
        }),
        payablePaise: pricing.payablePaise,
        totalPaise: pricing.totalPaise,
        currency: 'INR',
        checkoutTokenHash: hashToken(checkoutToken),
        paymentStatus: 'processing',
        holdExpiresAt,
        batchId: reservation.batchId,
        holdId: reservation.holdId,
        emailStatus: 'not_configured',
        updatedAt: new Date(),
      })
      .returning();

    const row = inserted[0];
    if (!row) throw new Error('Failed to create booking');

    // Payment tx requires booking FK — run after insert, still parallel with attach/participants.
    const [txRow] = await Promise.all([
      db
        .insert(paymentTransactions)
        .values({
          bookingId: row.id,
          razorpayOrderId: order.id,
          amountPaise: pricing.payablePaise,
          currency: 'INR',
          status: 'created',
          idempotencyKey,
          updatedAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0])
        .catch(async (err) => {
          // Concurrent insert on same idempotency key — return the winner.
          const [winner] = await db
            .select()
            .from(paymentTransactions)
            .where(eq(paymentTransactions.idempotencyKey, idempotencyKey))
            .limit(1);
          if (winner) return winner;
          throw err;
        }),
      attachHoldToBooking(reservation.holdId, row.id, reservation.batchId),
      replaceBookingParticipants(row.id, normalized),
    ]);

    void db
      .insert(schema.bookingStatusHistory)
      .values({
        bookingId: row.id,
        fromStatus: 'pending_payment',
        toStatus: 'payment_processing',
        fromPaymentStatus: 'awaiting_payment',
        toPaymentStatus: 'processing',
        reason: 'pay_now_create',
        actor: 'payments',
      })
      .catch(() => {
        /* best-effort */
      });

    logPayment('pay_now_created', {
      bookingId: row.id,
      referenceCode,
      razorpayOrderId: order.id,
      paymentTxId: txRow?.id,
      payablePaise: pricing.payablePaise,
      userId: user.id,
      idempotencyKey,
    });

    return {
      checkoutToken,
      reused: false as const,
      ...orderResponseFromTx(row, {
        razorpayOrderId: order.id,
        id: txRow?.id || '',
      }),
    };
  } catch (err) {
    if (reservation) {
      try {
        await releaseHold(reservation.holdId, 'cancelled');
      } catch {
        /* best-effort */
      }
    }
    try {
      await db
        .update(bookings)
        .set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
    } catch {
      /* booking may not exist yet */
    }
    throw err;
  }
}

/** Release inventory when a warmed checkout is superseded (fingerprint change / abandon). */
export async function abandonUnpaidCheckout(opts: {
  bookingId: string;
  checkoutToken: string;
  userId: string;
}) {
  const booking = await loadBooking(opts.bookingId);
  if (!booking) return { abandoned: false };
  if (booking.userId !== opts.userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  if (!verifyCheckoutToken(opts.checkoutToken, booking.checkoutTokenHash)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  if (booking.status === 'confirmed' || booking.paymentStatus === 'paid') {
    return { abandoned: false };
  }
  if (booking.status === 'cancelled' || booking.status === 'expired') {
    return { abandoned: false };
  }

  if (booking.holdId) {
    try {
      await releaseHold(booking.holdId, 'cancelled');
    } catch {
      /* best-effort */
    }
  }

  await requireDb()
    .update(bookings)
    .set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() })
    .where(eq(bookings.id, booking.id));

  logPayment('checkout_abandoned', {
    bookingId: booking.id,
    userId: opts.userId,
  });

  return { abandoned: true };
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

export async function assertBookingPayable(
  bookingId: string,
  checkoutToken: string,
  opts?: { user?: PublicUser; skipHoldCheck?: boolean },
) {
  const user = opts?.user ?? (await getCurrentUser());
  if (!user) {
    throw Object.assign(new Error('Please sign in to continue.'), { status: 401 });
  }

  const booking = await loadBooking(bookingId);
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });

  if (!isTrustedCheckoutBooking(booking)) {
    throw Object.assign(new Error('Booking is not eligible for payment'), { status: 403 });
  }

  // Ownership is Principal-style: authenticated user id only (never email).
  if (booking.userId !== user.id) {
    logPayment('authorization_denied', {
      bookingId: booking.id,
      userId: user.id,
      reason: 'not_owner',
    });
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const tokenOk = verifyCheckoutToken(checkoutToken, booking.checkoutTokenHash);
  if (!tokenOk) {
    logPayment('authorization_denied', {
      bookingId: booking.id,
      userId: user.id,
      reason: 'invalid_checkout_token',
    });
    throw Object.assign(new Error('Forbidden'), { status: 403 });
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
    if (booking.holdId) {
      try {
        await releaseHold(booking.holdId, 'expired');
      } catch {
        /* ignore */
      }
    }
    throw Object.assign(new Error('Booking payment window expired'), { status: 409 });
  }

  if (!opts?.skipHoldCheck && booking.holdId) {
    const { schema: dbSchema, getDb: gdb } = await import('@/lib/db');
    const db = gdb();
    if (db) {
      const [hold] = await db
        .select()
        .from(dbSchema.bookingHolds)
        .where(eq(dbSchema.bookingHolds.id, booking.holdId))
        .limit(1);
      if (!hold || hold.status !== 'active' || hold.expiresAt.getTime() < Date.now()) {
        throw Object.assign(new Error('Booking inventory hold is no longer active'), {
          status: 409,
          code: 'BOOKING_UNAVAILABLE',
        });
      }
    }
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
  opts?: { idempotencyKey?: string; user?: PublicUser; freshCheckout?: boolean },
) {
  const db = requireDb();
  const freshUser = opts?.freshCheckout ? opts.user : undefined;

  // Standalone create-order keeps full assert; same-request pay verifies under the row lock.
  const prechecked =
    freshUser
      ? null
      : await assertBookingPayable(bookingId, checkoutToken, { user: opts?.user });

  const targetId = prechecked?.id || bookingId;
  const idempotencyKey =
    opts?.idempotencyKey?.trim() ||
    (prechecked
      ? `order:${prechecked.id}:${prechecked.payablePaise}`
      : `order:${bookingId}`);

  // Lock booking row + reuse open order / idempotency key before calling Razorpay.
  const locked = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, targetId))
      .for('update')
      .limit(1);

    if (!row) throw Object.assign(new Error('Booking not found'), { status: 404 });

    if (freshUser) {
      if (!isTrustedCheckoutBooking(row)) {
        throw Object.assign(new Error('Booking is not eligible for payment'), { status: 403 });
      }
      if (row.userId !== freshUser.id) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
      }
      if (!verifyCheckoutToken(checkoutToken, row.checkoutTokenHash)) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
      }
      if (!row.payablePaise || row.payablePaise < 100) {
        throw Object.assign(new Error('Invalid booking amount'), { status: 400 });
      }
    }

    if (row.status === 'confirmed' || row.paymentStatus === 'paid') {
      throw Object.assign(new Error('Booking already paid'), { status: 409 });
    }
    if (row.holdExpiresAt && row.holdExpiresAt.getTime() < Date.now()) {
      assertBookingStatusTransition(row.status as BookingStatus, 'expired');
      assertPaymentStatusTransition(
        (row.paymentStatus || 'unpaid') as BookingPaymentStatus,
        'failed',
      );
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

    assertBookingStatusTransition(row.status as BookingStatus, 'payment_processing');
    assertPaymentStatusTransition(
      (row.paymentStatus || 'unpaid') as BookingPaymentStatus,
      'processing',
    );

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

  if (locked.kind === 'create') {
    // History is best-effort — never block Razorpay order creation.
    void requireDb()
      .insert(schema.bookingStatusHistory)
      .values({
        bookingId: locked.booking.id,
        fromStatus: locked.booking.status,
        toStatus: 'payment_processing',
        fromPaymentStatus: locked.booking.paymentStatus,
        toPaymentStatus: 'processing',
        reason: 'razorpay_order_create',
        actor: 'payments',
      })
      .catch(() => {
        /* history best-effort */
      });
  }

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

  const [txRow] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.id, opts.paymentTxId))
    .limit(1);
  if (!txRow) throw new Error('Payment transaction not found');

  const { assertPaymentTxTransition } = await import('@/lib/bookings/state-machine');
  assertPaymentTxTransition(
    txRow.status as import('@/lib/operations/types').PaymentTxStatus,
    'captured',
  );

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

  const { applyBookingTransition } = await import('@/lib/bookings/transitions');
  await applyBookingTransition({
    bookingId: opts.bookingId,
    toStatus: 'confirmed',
    toPaymentStatus: 'paid',
    reason: 'payment_captured',
    actor: 'payments',
    extra: { confirmedAt: now, emailStatus: 'pending' },
  });

  try {
    const { convertHoldForBooking } = await import('@/lib/inventory/service');
    await convertHoldForBooking(opts.bookingId);
  } catch (err) {
    logPayment('inventory_convert_failed', {
      bookingId: opts.bookingId,
      error: err instanceof Error ? err.message : 'unknown',
    });
  }

  // Queue confirmation email — never block payment capture on Brevo latency.
  try {
    await enqueueBookingConfirmationEmail(opts.bookingId);
  } catch (err) {
    logPayment('email_enqueue_failed', {
      bookingId: opts.bookingId,
      error: err instanceof Error ? err.message : 'unknown',
    });
  }

  logPayment('booking_confirmed', {
    bookingId: opts.bookingId,
    paymentTxId: opts.paymentTxId,
    razorpayPaymentId: opts.razorpayPaymentId,
  });
}

async function enqueueBookingConfirmationEmail(bookingId: string) {
  const booking = await loadBooking(bookingId);
  if (!booking) return;

  const {
    isTransactionalEmailConfigured,
    bookingConfirmationEmailHtml,
  } = await import('@/lib/email/brevo');
  const { enqueueEmail } = await import('@/lib/email/outbox');

  if (!isTransactionalEmailConfigured()) {
    await requireDb()
      .update(bookings)
      .set({ emailStatus: 'not_configured', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
    return;
  }

  const payableRupees = Math.floor((booking.payablePaise || 0) / 100);
  await enqueueEmail({
    kind: 'booking_confirmation',
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
    bookingId: booking.id,
  });

  await requireDb()
    .update(bookings)
    .set({ emailStatus: 'queued', updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));
}

/** @deprecated Prefer enqueue + cron; kept for ops scripts. */
async function maybeSendBookingConfirmationEmail(bookingId: string) {
  await enqueueBookingConfirmationEmail(bookingId);
}

export async function verifyAndConfirmPayment(input: {
  bookingId: string;
  checkoutToken: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw Object.assign(new Error('Please sign in to continue.'), { status: 401 });
  }

  const bookingRow = await loadBooking(input.bookingId);
  if (!bookingRow) throw Object.assign(new Error('Booking not found'), { status: 404 });

  if (!isTrustedCheckoutBooking(bookingRow)) {
    throw Object.assign(new Error('Booking is not eligible for payment'), { status: 403 });
  }

  if (bookingRow.userId !== user.id) {
    logPayment('authorization_denied', {
      bookingId: bookingRow.id,
      userId: user.id,
      reason: 'not_owner',
    });
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const tokenOk = verifyCheckoutToken(input.checkoutToken, bookingRow.checkoutTokenHash);
  if (!tokenOk) {
    logPayment('authorization_denied', {
      bookingId: bookingRow.id,
      userId: user.id,
      reason: 'invalid_checkout_token',
    });
    throw Object.assign(new Error('Forbidden'), { status: 403 });
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
    const [txRow] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.razorpayOrderId, opts.razorpayOrderId))
      .limit(1);
    if (txRow && txRow.status !== 'failed') {
      const { assertPaymentTxTransition } = await import('@/lib/bookings/state-machine');
      try {
        assertPaymentTxTransition(
          txRow.status as import('@/lib/operations/types').PaymentTxStatus,
          'failed',
        );
      } catch {
        return { ignored: true as const };
      }
    }
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

  const { applyBookingTransition } = await import('@/lib/bookings/transitions');
  await applyBookingTransition({
    bookingId: opts.bookingId,
    toStatus: 'payment_failed',
    toPaymentStatus: 'failed',
    reason: opts.reason || 'payment_failed',
    actor: 'payments',
  });

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
  const ownerOk = Boolean(user && user.id === booking.userId);
  // Capability token OR authenticated owner — never email match.
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
