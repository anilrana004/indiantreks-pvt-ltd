/**
 * Live API gate: anonymous checkout/create-order must be 401 (not 429).
 * Usage: BASE_URL=http://localhost:3005 npx tsx scripts/smoke-auth-payment-api.ts
 */
const BASE = (process.env.BASE_URL || 'http://localhost:3005').replace(/\/$/, '');

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: { error?: string; code?: string } = {};
  try {
    json = JSON.parse(text) as { error?: string; code?: string };
  } catch {
    /* ignore */
  }
  return { status: res.status, json, text };
}

async function runAuthPaymentApiSmoke() {
  const me = await fetch(`${BASE}/api/user/auth/me`);
  if (me.status !== 401) {
    throw new Error(`anon /me expected 401, got ${me.status}`);
  }
  console.log('TEST1 anon /me → 401 ok');

  const checkout = await postJson('/api/bookings/checkout', {
    trekId: 'chopta-tungnath',
    packageName: 'Twin Sharing',
    persons: 1,
    paymentMode: 'deposit',
    name: 'Anon Test',
    email: 'anon@example.com',
    phone: '9999999999',
    date: '2026-10-15',
  });
  if (checkout.status !== 401) {
    throw new Error(
      `anon checkout expected 401, got ${checkout.status}: ${checkout.text}`,
    );
  }
  if (checkout.json.code !== 'AUTH_REQUIRED') {
    throw new Error(`anon checkout expected AUTH_REQUIRED, got ${JSON.stringify(checkout.json)}`);
  }
  console.log('TEST2 anon checkout → 401 AUTH_REQUIRED ok');

  const order = await postJson('/api/payments/create-order', {
    bookingId: '00000000-0000-0000-0000-000000000001',
    checkoutToken: 'fake-token',
  });
  if (order.status !== 401) {
    throw new Error(`anon create-order expected 401, got ${order.status}: ${order.text}`);
  }
  if (order.json.code !== 'AUTH_REQUIRED') {
    throw new Error(`anon create-order expected AUTH_REQUIRED, got ${JSON.stringify(order.json)}`);
  }
  console.log('TEST3 anon create-order → 401 AUTH_REQUIRED ok');

  for (let i = 0; i < 5; i++) {
    const again = await postJson('/api/bookings/checkout', {
      trekId: 'chopta-tungnath',
      packageName: 'Twin Sharing',
      persons: 1,
      paymentMode: 'deposit',
      name: 'Anon Test',
      email: 'anon@example.com',
      phone: '9999999999',
      date: '2026-10-15',
    });
    if (again.status !== 401 && again.status !== 429) {
      throw new Error(`repeat anon checkout unexpected ${again.status}`);
    }
  }
  console.log('repeat anon checkout still auth-gated ok');

  console.log('smoke-auth-payment-api passed');
}

runAuthPaymentApiSmoke().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

export {};
