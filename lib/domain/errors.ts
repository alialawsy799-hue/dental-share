export class AccessError extends Error {
  constructor(
    public code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION",
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "AccessError";
  }
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string>): Result<never> {
  return { ok: false, error, fieldErrors };
}

export function validationError(fieldErrors: Record<string, string>, error = "تحقق من الحقول."): Result<never> {
  return { ok: false, error, fieldErrors };
}
