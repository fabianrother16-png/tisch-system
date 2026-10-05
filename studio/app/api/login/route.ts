import { NextResponse } from "next/server";
import { SESSION_COOKIE, passwordConfigured, safeEqual, sessionToken } from "@/lib/auth";
import { readJson } from "@/lib/http";

export async function POST(req: Request) {
  if (!passwordConfigured()) return NextResponse.json({ ok: true });
  const { password } = await readJson(req);
  if (typeof password !== "string" || !safeEqual(password, process.env.STUDIO_PASSWORD ?? "")) {
    // Kleine Bremse gegen Durchprobieren.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
