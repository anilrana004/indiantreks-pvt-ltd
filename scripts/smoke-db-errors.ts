/**
 * Smoke-test DB error classification used by Google/password auth UX.
 * Usage: npx tsx scripts/smoke-db-errors.ts
 */
import { classifyDbError } from '../src/lib/db/errors';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const quota = classifyDbError(
  Object.assign(new Error('Your account or project has exceeded the quota. Upgrade your plan.'), {
    code: '53000',
  }),
);
assert(quota.kind === 'quota', `expected quota, got ${quota.kind}`);

const schema = classifyDbError(new Error('Failed query: column "session_version" does not exist'));
assert(schema.kind === 'schema', `expected schema, got ${schema.kind}`);

const conflict = classifyDbError(
  Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' }),
);
assert(conflict.kind === 'conflict', `expected conflict, got ${conflict.kind}`);

const down = classifyDbError(new Error('connect ETIMEDOUT'));
assert(down.kind === 'unreachable', `expected unreachable, got ${down.kind}`);

console.log('db-error classification smoke tests passed');
