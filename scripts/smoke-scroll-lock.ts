/**
 * Offline scroll-lock unit checks (mock DOM, no browser).
 * Usage: npx tsx scripts/smoke-scroll-lock.ts
 */
import assert from 'node:assert/strict';

type StyleBag = Record<string, string>;

function installDomMock() {
  let scrollY = 120;
  const style: StyleBag = {
    position: '',
    top: '',
    left: '',
    right: '',
    width: '',
    overflow: '',
  };
  const dataset: Record<string, string> = {};

  const body = {
    style,
    dataset,
  };

  (globalThis as { document?: unknown }).document = { body };
  (globalThis as { window?: unknown }).window = {
    get scrollY() {
      return scrollY;
    },
    get pageYOffset() {
      return scrollY;
    },
    scrollTo(_x: number, y: number) {
      scrollY = y;
    },
  };

  return {
    body,
    getScrollY: () => scrollY,
    setScrollY: (y: number) => {
      scrollY = y;
    },
  };
}

async function main() {
  const mock = installDomMock();
  // Fresh module instance after DOM mock is in place.
  const {
    lockBodyScroll,
    unlockBodyScroll,
    resetBodyScrollLock,
  } = await import('../src/lib/dom/scroll-lock');

  mock.setScrollY(240);
  lockBodyScroll();
  assert.equal(mock.body.style.position, 'fixed');
  assert.equal(mock.body.style.top, '-240px');
  assert.equal(mock.body.style.overflow, 'hidden');
  assert.equal(mock.body.dataset.scrollLocked, '1');

  // Nested lock must not re-apply / clobber saved Y.
  mock.setScrollY(999);
  lockBodyScroll();
  assert.equal(mock.body.style.top, '-240px');

  unlockBodyScroll();
  assert.equal(mock.body.style.position, 'fixed', 'still locked while refcount > 0');
  assert.equal(mock.body.dataset.scrollLocked, '1');

  unlockBodyScroll();
  assert.equal(mock.body.style.position, '');
  assert.equal(mock.body.style.top, '');
  assert.equal(mock.body.style.overflow, '');
  assert.equal(mock.body.dataset.scrollLocked, undefined);
  assert.equal(mock.getScrollY(), 240, 'restores original scrollY');

  // Extra unlock is a no-op.
  unlockBodyScroll();
  assert.equal(mock.getScrollY(), 240);

  mock.setScrollY(80);
  lockBodyScroll();
  lockBodyScroll();
  resetBodyScrollLock();
  assert.equal(mock.body.style.position, '');
  assert.equal(mock.body.dataset.scrollLocked, undefined);
  assert.equal(mock.getScrollY(), 80);

  // After reset, lock works again.
  mock.setScrollY(33);
  lockBodyScroll();
  assert.equal(mock.body.style.top, '-33px');
  unlockBodyScroll();
  assert.equal(mock.getScrollY(), 33);

  console.log('smoke-scroll-lock: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
