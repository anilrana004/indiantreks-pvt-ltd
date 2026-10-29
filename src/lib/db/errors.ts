/**
 * Classify Postgres / driver errors for auth UX — never expose connection strings.
 */

export type DbErrorKind =
  | 'not_configured'
  | 'quota'
  | 'unreachable'
  | 'schema'
  | 'conflict'
  | 'unknown';

export function classifyDbError(err: unknown): { kind: DbErrorKind; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code ?? '')
      : '';

  if (/exceeded the quota|quota|compute time|53000/i.test(message) || code === '53000') {
    return {
      kind: 'quota',
      message:
        'Database quota exceeded. Upgrade or restore Neon compute limits, then retry sign-in.',
    };
  }

  if (
    /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connection.*refused|timeout|too many connections|53300|57P01|57P03/i.test(
      message,
    ) ||
    code === '53300' ||
    code === '57P01' ||
    code === '57P03'
  ) {
    return {
      kind: 'unreachable',
      message: 'Database is temporarily unreachable. Please try again in a minute.',
    };
  }

  if (/does not exist|undefined column|42703|42P01/i.test(message) || code === '42703' || code === '42P01') {
    return {
      kind: 'schema',
      message:
        'Auth database schema is incomplete. Run pending Drizzle migrations (including customer auth + session_version), then retry.',
    };
  }

  if (/unique|duplicate|23505/i.test(message) || code === '23505') {
    return {
      kind: 'conflict',
      message: 'This Google account or email is already linked. Try email login or another Google account.',
    };
  }

  return { kind: 'unknown', message };
}

export function isDbInfraError(err: unknown): boolean {
  const kind = classifyDbError(err).kind;
  return kind === 'quota' || kind === 'unreachable' || kind === 'schema';
}
