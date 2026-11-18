/**
 * Capture console + failed network on local checkout.
 * Usage: node scripts/capture-checkout-console.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:3457/booking/kedarkantha';

const consoleLogs = [];
const pageErrors = [];
const failedRequests = [];
const allRequests = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', (msg) => {
  consoleLogs.push({ type: msg.type(), text: msg.text() });
});
page.on('pageerror', (err) => {
  pageErrors.push(String(err?.message || err));
});
page.on('requestfailed', (req) => {
  failedRequests.push({
    url: req.url(),
    method: req.method(),
    error: req.failure()?.errorText,
  });
});
page.on('response', async (res) => {
  allRequests.push({
    url: res.url(),
    status: res.status(),
    method: res.request().method(),
    ok: res.ok(),
  });
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

const errors = consoleLogs.filter((l) => l.type === 'error');
const warnings = consoleLogs.filter((l) => l.type === 'warning');

console.log(
  JSON.stringify(
    {
      url,
      consoleErrorCount: errors.length,
      consoleWarningCount: warnings.length,
      pageErrorCount: pageErrors.length,
      failedRequestCount: failedRequests.length,
      requestCount: allRequests.length,
      errors,
      warnings: warnings.slice(0, 30),
      pageErrors,
      failedRequests,
      badStatuses: allRequests.filter((r) => r.status >= 400),
      sampleRequests: allRequests.slice(0, 40),
    },
    null,
    2,
  ),
);

await browser.close();
