export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  redirectTo?: string;
  /** beliebige Rückgabedaten (z. B. neue ID) */
  data?: Record<string, unknown>;
} | null;

export function fail(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors };
}

export function success(message?: string, extra?: Partial<NonNullable<ActionState>>): ActionState {
  return { ok: true, message, ...extra };
}
