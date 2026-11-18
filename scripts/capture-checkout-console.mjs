/**
 * Capture console + network transfer on local checkout.
 * Usage: node scripts/capture-checkout-console.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:3460/booking/chopta-tungnath';

const consoleLogs = [];
const pageErrors = [];
const failedRequests = [];
const allRequests = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');

const byRequestId = new Map();
cdp.on('Network.responseReceived', (e) => {
  byRequestId.set(e.requestId, {
    url: e.response.url,
    status: e.response.status,
    mimeType: e.response.mimeType,
  });
});
cdp.on('Network.loadingFinished', (e) => {
  const prev = byRequestId.get(e.requestId) || {};
  byRequestId.set(e.requestId, {
    ...prev,
    encodedDataLength: e.encodedDataLength,
  });
});

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
page.on('response', (res) => {
  allRequests.push({
    url: res.url(),
    status: res.status(),
    method: res.request().method(),
    ok: res.ok(),
  });
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

const transferEntries = [...byRequestId.values()]
  .filter((e) => e.url && typeof e.encodedDataLength === 'number')
  .map((e) => ({
    url: e.url,
    status: e.status,
    bytes: e.encodedDataLength,
    kb: +(e.encodedDataLength / 1024).toFixed(1),
  }))
  .sort((a, b) => b.bytes - a.bytes);

const totalBytes = transferEntries.reduce((s, e) => s + e.bytes, 0);
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
      transferKB: +(totalBytes / 1024).toFixed(1),
      transferMB: +(totalBytes / (1024 * 1024)).toFixed(2),
      topTransfers: transferEntries.slice(0, 20),
      errors,
      warnings,
      pageErrors,
      failedRequests,
      badStatuses: allRequests.filter((r) => r.status >= 400),
      appRequests: allRequests.filter(
        (r) =>
          r.url.includes('/api/') ||
          r.url.includes('razorpay.com') ||
          r.url.includes('/booking/'),
      ),
    },
    null,
    2,
  ),
);

await browser.close();
