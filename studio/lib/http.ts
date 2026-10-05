import { NextResponse } from "next/server";

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await req.json()) as unknown;
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const notFound = (what = "Eintrag") => json({ error: `${what} nicht gefunden.` }, 404);
export const badRequest = (message: string) => json({ error: message }, 400);
