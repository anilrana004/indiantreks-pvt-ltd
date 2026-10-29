/**
 * iOS-safe body scroll lock with reference counting.
 * Multiple overlays (menu + search + modal) can lock/unlock independently
 * without restoring scroll too early or jumping the page.
 */

let lockCount = 0;
let savedScrollY = 0;
let savedBodyStyles: Partial<CSSStyleDeclaration> | null = null;

function applyLock() {
  if (typeof document === 'undefined') return;
  const body = document.body;
  savedScrollY = window.scrollY || window.pageYOffset || 0;
  savedBodyStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
  };

  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  body.dataset.scrollLocked = '1';
}

function clearLock() {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const y = savedScrollY;

  if (savedBodyStyles) {
    body.style.position = savedBodyStyles.position ?? '';
    body.style.top = savedBodyStyles.top ?? '';
    body.style.left = savedBodyStyles.left ?? '';
    body.style.right = savedBodyStyles.right ?? '';
    body.style.width = savedBodyStyles.width ?? '';
    body.style.overflow = savedBodyStyles.overflow ?? '';
  } else {
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
  }

  delete body.dataset.scrollLocked;
  savedBodyStyles = null;
  savedScrollY = 0;
  window.scrollTo(0, y);
}

/** Lock page scroll. Call unlockBodyScroll when the overlay closes. */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  lockCount += 1;
  if (lockCount === 1) applyLock();
}

/** Release one lock. Restores scroll only when the last lock is released. */
export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) clearLock();
}

/** Force-clear all locks (route changes / emergency cleanup). */
export function resetBodyScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) return;
  lockCount = 0;
  clearLock();
}
