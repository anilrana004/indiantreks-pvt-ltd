/** Consistent API error envelope for all services. */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'GONE'
  | 'DB_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export type ApiErrorBody = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiSuccessBody<T> = {
  success: true;
  data: T;
};

export function apiError(code: ApiErrorCode, message: string, status: number): Response {
  return Response.json(
    { success: false, error: { code, message } } satisfies ApiErrorBody,
    { status },
  );
}

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiSuccessBody<T>, { status });
}
