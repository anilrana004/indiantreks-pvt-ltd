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

function ensureHeadLink(rel: string, href: string, attrs?: Record<string, string>) {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      link.setAttribute(k, v);
    }
  }
  document.head.appendChild(link);
}

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
      existing.addEventListener('load', () => {
        existing.dataset.ready = '1';
        finish();
      }, { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')), {
        once: true,
      });
      // Next <Script /> may already be complete without dataset.ready.
      if (existing.dataset.ready === '1' || existing.getAttribute('data-loaded') === 'true') {
        queueMicrotask(finish);
        return;
      }
      const poll = window.setInterval(() => {
        if (window.Razorpay) {
          window.clearInterval(poll);
          existing.dataset.ready = '1';
          resolve();
        }
      }, 40);
      window.setTimeout(() => window.clearInterval(poll), 12000);
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
  ensureHeadLink('preconnect', 'https://checkout.razorpay.com', { crossorigin: 'anonymous' });
  ensureHeadLink('preconnect', 'https://api.razorpay.com', { crossorigin: 'anonymous' });
  ensureHeadLink('dns-prefetch', 'https://checkout.razorpay.com');
  ensureHeadLink('preload', RAZORPAY_SRC, { as: 'script' });
  void loadRazorpayScript().catch(() => {
    /* ignore warm failures — open path still loads */
  });
}

/** Awaitable warm — use before opening so Pay Now never waits on script I/O. */
export function ensureRazorpayReady(): Promise<void> {
  return loadRazorpayScript();
}

export function isRazorpayReady(): boolean {
  return typeof window !== 'undefined' && Boolean(window.Razorpay);
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

function buildRazorpayInstance(
  order: RazorpayCheckoutOrder,
  handlers: {
    onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
    onDismiss?: () => void;
  },
) {
  if (!window.Razorpay) throw new Error('Razorpay SDK unavailable');

  return new window.Razorpay({
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
}

/**
 * Instant open when SDK is already warmed (TTH-style): construct + open() with no await.
 * Throws if checkout.js is not ready — caller should fall back to openRazorpayCheckout.
 */
export function openRazorpayCheckoutSync(
  order: RazorpayCheckoutOrder,
  handlers: {
    onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
    onDismiss?: () => void;
  },
): void {
  buildRazorpayInstance(order, handlers).open();
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
  openRazorpayCheckoutSync(order, handlers);
}
