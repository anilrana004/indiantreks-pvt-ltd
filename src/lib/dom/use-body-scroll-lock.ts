'use client';

import { useEffect } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/dom/scroll-lock';

/** Lock document scroll while `locked` is true (iOS-safe, ref-counted). */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [locked]);
}
