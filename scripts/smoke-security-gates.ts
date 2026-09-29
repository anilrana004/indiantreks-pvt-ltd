/**
 * Offline security unit checks (no DB / no HTTP).
 * Usage: npx tsx scripts/smoke-security-gates.ts
 */
import assert from 'node:assert/strict';
import {
  DEFAULT_SAFE_RETURN_PATH,
  safeReturnPath,
} from '../src/lib/security/urls';

function testSafeReturnPath() {
  assert.equal(safeReturnPath(null), DEFAULT_SAFE_RETURN_PATH);
  assert.equal(safeReturnPath(undefined), DEFAULT_SAFE_RETURN_PATH);
  assert.equal(safeReturnPath('https://malicious-site.com'), DEFAULT_SAFE_RETURN_PATH);
  assert.equal(safeReturnPath('//malicious-site.com'), DEFAULT_SAFE_RETURN_PATH);
  assert.equal(safeReturnPath('/\\evil'), DEFAULT_SAFE_RETURN_PATH);
  assert.equal(safeReturnPath('javascript:alert(1)'), DEFAULT_SAFE_RETURN_PATH);
  assert.equal(safeReturnPath('/booking/chopta-tungnath'), '/booking/chopta-tungnath');
  assert.equal(
    safeReturnPath('/booking/chopta-tungnath?date=2026-10-15'),
    '/booking/chopta-tungnath?date=2026-10-15',
  );
  assert.equal(safeReturnPath('/user-dashboard'), '/user-dashboard');
  assert.equal(safeReturnPath('/treks/chopta-tungnath'), '/treks/chopta-tungnath');
  assert.equal(safeReturnPath('/yatra/kedarnath-yatra'), '/yatra/kedarnath-yatra');
  assert.equal(safeReturnPath('/admin'), DEFAULT_SAFE_RETURN_PATH);
  assert.equal(safeReturnPath('/evil-path'), DEFAULT_SAFE_RETURN_PATH);
  assert.equal(safeReturnPath('https://evil.com', ''), '');
  console.log('safeReturnPath: ok');
}

testSafeReturnPath();
console.log('smoke-security-gates passed');
