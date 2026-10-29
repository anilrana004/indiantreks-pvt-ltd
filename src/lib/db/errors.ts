/**
 * Classify Postgres / driver errors for auth UX — never expose connection strings.
 * Drizzle wraps driver errors as `Failed query: …` with the real PostgresError on `.cause`.
 */

export type DbErrorKind =
  | 'not_configured'
  | 'quota'
  | 'unreachable'
  | 'schema'
  | 'conflict'
  | 'unknown';

function collectErrorText(err: unknown): { text: string; codes: string[] } {
  const parts: string[] = [];
  const codes: string[] = [];
  const seen = new Set<unknown>();

  let current: unknown = err;
  let depth = 0;
  while (current && depth < 6 && !seen.has(current)) {
    seen.add(current);
    depth += 1;

    if (typeof current === 'string') {
      parts.push(current);
      break;
    }

    if (current instanceof Error) {
      parts.push(current.message);
      const withCode = current as Error & { code?: unknown; cause?: unknown };
      if (withCode.code != null) codes.push(String(withCode.code));
      current = withCode.cause;
      continue;
    }

    if (typeof current === 'object') {
      const obj = current as { message?: unknown; code?: unknown; cause?: unknown };
      if (typeof obj.message === 'string') parts.push(obj.message);
      if (obj.code != null) codes.push(String(obj.code));
      current = obj.cause;
      continue;
    }

    break;
  }

  return { text: parts.join('\n'), codes };
}

export function classifyDbError(err: unknown): { kind: DbErrorKind; message: string } {
  const { text, codes } = collectErrorText(err);
  const codeSet = new Set(codes);

  if (/exceeded the quota|quota|compute time/i.test(text) || codeSet.has('53000')) {
    return {
      kind: 'quota',
      message:
        'Database quota exceeded. Upgrade or restore Neon compute limits, then retry sign-in.',
    };
  }

  if (
    /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connection.*refused|timeout|too many connections/i.test(text) ||
    codeSet.has('53300') ||
    codeSet.has('57P01') ||
    codeSet.has('57P03')
  ) {
    return {
      kind: 'unreachable',
      message: 'Database is temporarily unreachable. Please try again in a minute.',
    };
  }

  if (
    /does not exist|undefined column/i.test(text) ||
    codeSet.has('42703') ||
    codeSet.has('42P01')
  ) {
    return {
      kind: 'schema',
      message:
        'Auth database schema is incomplete. Run pending Drizzle migrations (including customer auth + session_version), then retry.',
    };
  }

  if (/unique|duplicate/i.test(text) || codeSet.has('23505')) {
    return {
      kind: 'conflict',
      message: 'This Google account or email is already linked. Try email login or another Google account.',
    };
  }

  return { kind: 'unknown', message: text || 'Unknown database error' };
}

export function isDbInfraError(err: unknown): boolean {
  const kind = classifyDbError(err).kind;
  return kind === 'quota' || kind === 'unreachable' || kind === 'schema';
}
