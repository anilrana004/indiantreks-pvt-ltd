import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import { RAZORPAY_LOGO_URL } from '@/lib/brand-assets';

export type RazorpayMode = 'test' | 'live';

export function getRazorpayMode(): RazorpayMode {
  const mode = (process.env.RAZORPAY_MODE || 'test').trim().toLowerCase();
  return mode === 'live' ? 'live' : 'test';
}

export function getRazorpayKeyId(): string {
  const key = process.env.RAZORPAY_KEY_ID?.trim() || '';
  if (!key) throw new Error('RAZORPAY_KEY_ID is not configured');
  return key;
}

export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not configured');
  return secret;
}

export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
  return secret;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

let razorpayClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
  }
  return razorpayClient;
}

export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees) || rupees < 0) throw new Error('Invalid amount');
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return Math.floor(paise / 100);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createCheckoutToken(): string {
  return randomBytes(32).toString('hex');
}

export function verifyCheckoutToken(token: string, hash: string | null | undefined): boolean {
  if (!token || !hash) return false;
  const computed = hashToken(token);
  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getRazorpayKeySecret();
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(params.signature, 'hex'));
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = getRazorpayWebhookSecret();
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export function hashPayload(rawBody: string): string {
  return createHash('sha256').update(rawBody).digest('hex');
}

export function generateBookingReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `IT-${stamp}-${rand}`;
}

export function paymentHoldMinutes(): number {
  const raw = Number(process.env.BOOKING_PAYMENT_HOLD_MINUTES || '30');
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

export function getMerchantDisplayName(): string {
  return process.env.RAZORPAY_MERCHANT_NAME?.trim() || 'Indian Treks';
}

export function getCheckoutThemeColor(): string {
  // Punchy brand green for Razorpay sidebar (brighter than storefront --ih-primary).
  return process.env.RAZORPAY_THEME_COLOR?.trim() || '#00c853';
}

/**
 * Logo shown in the Razorpay Checkout header.
 * Defaults to the dedicated checkout mark; override with RAZORPAY_CHECKOUT_LOGO_URL.
 */
export function getCheckoutLogoUrl(): string {
  const override = process.env.RAZORPAY_CHECKOUT_LOGO_URL?.trim();
  if (override) return override;
  return RAZORPAY_LOGO_URL;
}
