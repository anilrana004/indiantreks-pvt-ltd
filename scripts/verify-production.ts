/**
 * Production readiness checks — env, security, and deployment config.
 * Run before deploy: npm run verify:production
 *
 * Tip: load .env.local first when checking locally:
 *   npx dotenv -e .env.local -- npm run verify:production
 * Or set NODE_ENV=production with your Vercel env values.
 */

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
  level: 'error' | 'warn';
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function isLocalhostUri(value: string): boolean {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value);
}

function main() {
  const results: CheckResult[] = [];
  const prod = isProduction();

  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  results.push({
    name: 'admin_session_secret',
    ok: prod ? Boolean(sessionSecret && sessionSecret.length >= 32) : true,
    level: prod ? 'error' : 'warn',
    detail: prod
      ? sessionSecret && sessionSecret.length >= 32
        ? 'ADMIN_SESSION_SECRET is set (32+ chars)'
        : 'Set ADMIN_SESSION_SECRET (32+ random chars) in production'
      : sessionSecret
        ? 'ADMIN_SESSION_SECRET set for dev'
        : 'Optional in dev — falls back to ADMIN_PASSWORD',
  });

  const userSessionSecret = process.env.USER_SESSION_SECRET?.trim();
  const userOrAdminSecret = userSessionSecret || sessionSecret;
  results.push({
    name: 'user_session_secret',
    ok: prod ? Boolean(userOrAdminSecret && userOrAdminSecret.length >= 32) : true,
    level: prod ? 'error' : 'warn',
    detail: prod
      ? userOrAdminSecret && userOrAdminSecret.length >= 32
        ? userSessionSecret
          ? 'USER_SESSION_SECRET is set (32+ chars)'
          : 'Using ADMIN_SESSION_SECRET for customer sessions (prefer dedicated USER_SESSION_SECRET)'
        : 'Set USER_SESSION_SECRET (32+ random chars) in production'
      : userSessionSecret
        ? 'USER_SESSION_SECRET set for dev'
        : 'Optional in dev — falls back to ADMIN_SESSION_SECRET / default',
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  results.push({
    name: 'admin_credentials',
    ok: prod
      ? Boolean(adminEmail && adminPassword && adminPassword !== 'admin123' && adminPassword.length >= 12)
      : true,
    level: prod ? 'error' : 'warn',
    detail: prod
      ? adminEmail && adminPassword && adminPassword !== 'admin123' && adminPassword.length >= 12
        ? 'ADMIN_EMAIL / ADMIN_PASSWORD are production-safe'
        : 'Set strong ADMIN_EMAIL + ADMIN_PASSWORD (≥12 chars, not admin123) in production'
      : 'Change default password before deploy',
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  results.push({
    name: 'public_site_url',
    ok: Boolean(siteUrl?.startsWith('https://')),
    level: prod ? 'error' : 'warn',
    detail: siteUrl?.startsWith('https://')
      ? `NEXT_PUBLIC_SITE_URL=${siteUrl}`
      : 'Set NEXT_PUBLIC_SITE_URL=https://indiantreks.in for production SEO/canonical',
  });

  const dbUrl = process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();
  results.push({
    name: 'database_url',
    ok: Boolean(dbUrl),
    level: prod ? 'error' : 'warn',
    detail: dbUrl
      ? 'DATABASE_URL configured — Neon/Postgres active'
      : prod
        ? 'DATABASE_URL required in production for blog/auth/bookings'
        : 'DATABASE_URL unset — static blog / file auth fallback only',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  results.push({
    name: 'external_api_url',
    ok: !apiUrl,
    level: 'warn',
    detail: apiUrl
      ? `NEXT_PUBLIC_API_URL is set (${apiUrl}) — only enable after Railway API has payment + customer auth parity`
      : 'NEXT_PUBLIC_API_URL unset — correct for Vercel monolith launch',
  });

  const googleRedirect = process.env.GOOGLE_REDIRECT_URI?.trim();
  results.push({
    name: 'google_redirect_uri',
    ok: !(prod && googleRedirect && isLocalhostUri(googleRedirect)),
    level: prod ? 'error' : 'warn',
    detail:
      prod && googleRedirect && isLocalhostUri(googleRedirect)
        ? 'GOOGLE_REDIRECT_URI must not be localhost on production — leave unset or use https://indiantreks.in/api/user/auth/google/callback'
        : googleRedirect
          ? `GOOGLE_REDIRECT_URI=${googleRedirect}`
          : 'GOOGLE_REDIRECT_URI unset — OAuth uses live request host (recommended on Vercel)',
  });

  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
  results.push({
    name: 'google_oauth',
    ok: true,
    level: 'warn',
    detail: googleConfigured
      ? 'Google OAuth credentials set — add production callback in Google Cloud Console'
      : 'Google OAuth unset — email/password login only',
  });

  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
  const razorpayMode = (process.env.RAZORPAY_MODE || 'test').trim().toLowerCase();
  results.push({
    name: 'razorpay',
    ok: true,
    level: 'warn',
    detail: razorpayConfigured
      ? `Razorpay keys set (mode=${razorpayMode}) — keep test until go-live approval`
      : 'Razorpay unset — checkout/payments will fail until keys are configured',
  });

  if (prod && razorpayMode === 'live') {
    results.push({
      name: 'razorpay_live_gate',
      ok: false,
      level: 'warn',
      detail: 'RAZORPAY_MODE=live — confirm explicit go-live approval before traffic',
    });
  }

  const mapbox = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  results.push({
    name: 'mapbox',
    ok: true,
    level: 'warn',
    detail: mapbox?.startsWith('pk.')
      ? 'NEXT_PUBLIC_MAPBOX_TOKEN set (pk.)'
      : 'NEXT_PUBLIC_MAPBOX_TOKEN missing or not a pk. token — trek maps will fail',
  });

  const cloudinaryOk = Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
  results.push({
    name: 'cloudinary',
    ok: true,
    level: 'warn',
    detail: cloudinaryOk
      ? 'Cloudinary server credentials set'
      : 'Cloudinary incomplete — admin image upload may fail',
  });

  const mongoOk = Boolean(
    process.env.MONGODB_URI?.trim() ||
      process.env.MONGO_URI?.trim() ||
      process.env.MONGODB_URL?.trim(),
  );
  results.push({
    name: 'mongodb_reviews',
    ok: true,
    level: 'warn',
    detail: mongoOk
      ? 'MONGODB_URI set — guest reviews can persist'
      : 'MONGODB_URI unset — trek/yatra/trip review submit will return 503',
  });

  results.push({
    name: 'analytics_scaffold',
    ok: true,
    level: 'warn',
    detail: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
      ? 'GA4 ID set — wire script when ready'
      : 'NEXT_PUBLIC_GA4_MEASUREMENT_ID unset — analytics scaffold only',
  });

  const failed = results.filter((r) => !r.ok && r.level === 'error');
  const warnOnly = results.filter((r) => !r.ok && r.level === 'warn');

  console.log(`\nProduction verification (${prod ? 'production mode' : 'dev mode'})\n`);
  for (const result of results) {
    const tag = result.ok ? 'OK  ' : result.level === 'error' ? 'FAIL' : 'WARN';
    console.log(`${tag} ${result.name}: ${result.detail}`);
  }

  if (warnOnly.length > 0) {
    console.log(`\n${warnOnly.length} warning(s).`);
  }

  if (failed.length > 0) {
    console.log(`\n${failed.length} blocking check(s) failed.`);
    process.exit(1);
  }

  console.log('\nProduction checks passed (or dev-only warnings only).');
}

main();
