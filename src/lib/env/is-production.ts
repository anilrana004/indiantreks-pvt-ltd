/** True on Vercel Production or NODE_ENV=production. */
export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}
