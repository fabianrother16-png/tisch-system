export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function getJson<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(25_000) });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const b = body as Record<string, unknown> | null;
    const err = (b?.error as Record<string, unknown> | string | undefined) ?? b?.error_description ?? b;
    const msg =
      typeof err === "string"
        ? err
        : (err as Record<string, unknown>)?.message ?? (err as Record<string, unknown>)?.error_user_msg ?? JSON.stringify(err)?.slice(0, 300);
    throw new ApiError(`${res.status}: ${String(msg)}`, res.status);
  }
  return body as T;
}

export function form(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}
