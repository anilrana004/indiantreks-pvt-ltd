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

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay requires a browser'));
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
    if (existing) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay Checkout'));
    document.body.appendChild(script);
  });
}

/** Warm the Razorpay SDK before Pay Now so checkout opens without a script wait. */
export function preloadRazorpayCheckout(): void {
  if (typeof window === 'undefined') return;
  void loadRazorpayScript().catch(() => {
    /* ignore warm failures — open path still loads */
  });
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

  rzp.open();
}
