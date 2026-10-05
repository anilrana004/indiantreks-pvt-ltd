import { timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

/** Constant-time string compare for secrets (Bearer tokens, admin passwords). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // Still compare against self to keep runtime roughly constant on length mismatch.
    nodeTimingSafeEqual(left, left);
    return false;
  }
  return nodeTimingSafeEqual(left, right);
}
