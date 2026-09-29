/** Shared JSON API response helpers (storefront + admin deploys). */

export function unauthorizedResponse() {
  return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
}

export function dbUnavailableResponse() {
  return Response.json(
    { error: 'Database not configured', code: 'DB_UNAVAILABLE' },
    { status: 503 },
  );
}

export function notFoundResponse(message = 'Not found') {
  return Response.json({ error: message, code: 'NOT_FOUND' }, { status: 404 });
}

export function apiError(
  status: number,
  error: string,
  code: string,
  extras?: Record<string, unknown>,
) {
  return Response.json({ error, code, ...extras }, { status });
}
