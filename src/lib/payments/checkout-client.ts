'use client';

export type RazorpayCheckoutOrder = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  image?: string;
  notes?: Record<string, string>;
};

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let razorpayLoadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay requires a browser'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (razorpayLoadPromise) return razorpayLoadPromise;

  razorpayLoadPromise = new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      reject(new Error('Razorpay SDK unavailable'));
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
    if (existing) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')), {
        once: true,
      });
      // Script may already be complete (e.g. Next <Script />).
      if (existing.dataset.ready === '1' || existing.getAttribute('data-loaded') === 'true') {
        queueMicrotask(finish);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.dataset.razorpayCheckout = '1';
    script.onload = () => {
      script.dataset.ready = '1';
      finish();
    };
    script.onerror = () => {
      razorpayLoadPromise = null;
      reject(new Error('Failed to load Razorpay Checkout'));
    };
    document.head.appendChild(script);
  });

  return razorpayLoadPromise;
}

/** Warm the Razorpay SDK before Pay Now so checkout opens without a script wait. */
export function preloadRazorpayCheckout(): void {
  if (typeof window === 'undefined') return;
  // Touch Razorpay origins early (desktop + mobile).
  const ensureLink = (rel: string, href: string) => {
    if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (rel === 'preconnect') link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };
  ensureLink('preconnect', 'https://checkout.razorpay.com');
  ensureLink('preconnect', 'https://api.razorpay.com');
  ensureLink('dns-prefetch', 'https://checkout.razorpay.com');
  void loadRazorpayScript().catch(() => {
    /* ignore warm failures — open path still loads */
  });
}

/** Awaitable warm — use before opening so Pay Now never waits on script I/O. */
export function ensureRazorpayReady(): Promise<void> {
  return loadRazorpayScript();
}

/**
 * Native Standard Checkout layout (method icons + UPI QR / Show QR panel).
 * Custom `blocks` force the simpler “Recommended” list UI — avoid them.
 */
function checkoutDisplayConfig() {
  return {
    display: {
      sequence: ['upi', 'card', 'emi', 'netbanking', 'wallet', 'paylater'],
      preferences: {
        show_default_blocks: true,
      },
    },
  };
}

/** Opens official Razorpay Standard Checkout — do not recreate their UI. */
export async function openRazorpayCheckout(
  order: RazorpayCheckoutOrder,
  handlers: {
    onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
    onDismiss?: () => void;
  },
): Promise<void> {
  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error('Razorpay SDK unavailable');

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: order.name,
    description: order.description,
    image: order.image,
    order_id: order.razorpayOrderId,
    prefill: {
      ...order.prefill,
      method: 'upi',
    },
    notes: order.notes,
    theme: order.theme,
    config: checkoutDisplayConfig(),
    handler: (response: RazorpaySuccessResponse) => {
      void handlers.onSuccess(response);
    },
    modal: {
      ondismiss: () => handlers.onDismiss?.(),
    },
  });

  // Open immediately — script is pre-warmed on booking / confirm step.
  rzp.open();
}
