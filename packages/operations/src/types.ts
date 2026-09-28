/** Payment + booking status vocabulary for Razorpay checkout. */

export type BookingStatus =
  | 'pending'
  | 'pending_payment'
  | 'payment_processing'
  | 'confirmed'
  | 'payment_failed'
  | 'cancelled'
  | 'completed'
  | 'expired';

export type BookingPaymentStatus =
  | 'unpaid'
  | 'awaiting_payment'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refund_pending'
  | 'refunded'
  | 'partially_refunded';

export type BookingPayment = 'deposit' | 'half' | 'full';

export type PaymentTxStatus =
  | 'created'
  | 'attempted'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refund_pending'
  | 'refunded';

export type RefundStatus =
  | 'requested'
  | 'initiated'
  | 'processed'
  | 'failed';

export type Booking = {
  id: string;
  trekId: string;
  trekTitle: string;
  name: string;
  email: string;
  phone: string;
  package: string;
  persons: number;
  date: string;
  payment: BookingPayment;
  amount: number;
  status: BookingStatus;
  notes: string;
  createdAt: string;
  userId?: string | null;
  referenceCode?: string | null;
  city?: string;
  participantsJson?: string;
  pricingSnapshot?: string;
  payablePaise?: number;
  totalPaise?: number;
  currency?: string;
  paymentStatus?: BookingPaymentStatus;
  holdExpiresAt?: string | null;
  confirmedAt?: string | null;
  emailStatus?: string;
  updatedAt?: string;
};

export type ContactStatus = 'new' | 'read' | 'replied';

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
};

export type GiftCardStatus = 'active' | 'redeemed' | 'expired';

export type GiftCard = {
  id: string;
  code: string;
  amount: number;
  balance: number;
  recipientName: string;
  recipientEmail: string;
  message?: string;
  status: GiftCardStatus;
  createdAt: string;
  expiresAt: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  subscribedAt: string;
  active: boolean;
};

export type SiteUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  bookings: number;
  createdAt: string;
};

export type CreateBookingInput = Omit<Booking, 'id' | 'createdAt' | 'status'> & {
  status?: BookingStatus;
  checkoutTokenHash?: string | null;
};

export type CreateContactInput = Omit<Contact, 'id' | 'createdAt' | 'status'> & {
  status?: ContactStatus;
};

export type CreateGiftCardInput = Omit<GiftCard, 'id' | 'createdAt' | 'status'> & {
  status?: GiftCardStatus;
};
