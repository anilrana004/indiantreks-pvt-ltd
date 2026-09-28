# Razorpay Standard Checkout — Indian Treks

## Existing flow (before this work)

1. Booking UI calculated prices in the browser.
2. Final step opened **WhatsApp** with a prefilled message.
3. `POST /api/bookings` existed but **was not called** by the UI and trusted client `amount`.
4. No gateway, no webhooks, no payment verification.

## New flow

```
Checkout form → POST /api/bookings/checkout (server prices, PENDING_PAYMENT)
             → POST /api/payments/create-order (Razorpay Order, server amount)
             → Official Razorpay Checkout.js
             → POST /api/payments/verify (HMAC + Razorpay payment fetch)
             → booking CONFIRMED / payment PAID
             ↘ POST /api/webhooks/razorpay (idempotent second source of truth)
```

Frontend never marks bookings paid. Secrets never leave the server.

## Environment

```env
RAZORPAY_MODE=test
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_MERCHANT_NAME=Indian Treks
RAZORPAY_THEME_COLOR=#16a34a
BOOKING_PAYMENT_HOLD_MINUTES=30
DATABASE_URL=
```

Webhook URL (production):

`https://YOUR_DOMAIN/api/webhooks/razorpay`

Events: `payment.captured`, `payment.failed`, `order.paid`

## Migrate

```bash
npm run db:migrate
npx tsx scripts/smoke-payments.ts
```

## Razorpay Dashboard checklist

1. Complete KYC / business verification.
2. Set business/merchant display name to match the live brand.
3. Enable payment methods (UPI, cards, netbanking, wallets, EMI as eligible).
4. Add webhook URL + strong webhook secret (≥32 chars).
5. Subscribe to `payment.captured`, `payment.failed`, `order.paid`.
6. Test mode keys → run end-to-end on staging.
7. Live mode keys only on production env (never mix).
8. Verify settlement bank account.
9. Align refund/cancellation policy pages with operations.
10. Enable dashboard 2FA; restrict team roles.

## Known limitations (do not claim “fully production-ready” until addressed)

- **No seat inventory / capacity locks** in trek data yet — race on “last seat” is not protected.
- **Email confirmation** is scaffolded (`email_status`) but SMTP/Resend is not wired.
- **In-memory rate limits** reset per serverless instance — add Redis/edge rate limits for live traffic.
- **Admin refund UI** uses API `POST /api/admin/payments/refund`; wire a button in admin if needed.
- Dual schema copies (`src/lib/db` + `packages/db`) must stay in sync until monorepo consolidation finishes.
- Old `POST /api/bookings` still accepts client amounts for legacy/admin paths — prefer `/api/bookings/checkout` for storefront.
- Storefront deploy (`APP_ROLE=storefront`) must host `/api/bookings/*`, `/api/payments/*`, and `/api/webhooks/razorpay` (not the admin-only project).
