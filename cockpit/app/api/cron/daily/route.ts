import { NextResponse } from "next/server";
import { cronSecret } from "@/lib/env";
import { runDailyMaintenance } from "@/lib/domain/maintenance";

export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = cronSecret();
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 401 });
  }
  const result = await runDailyMaintenance();
  return NextResponse.json({ ok: true, at: new Date().toISOString(), ...result });
}
