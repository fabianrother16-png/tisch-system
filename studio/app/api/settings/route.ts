import { getSettings, saveSettings } from "@/lib/db";
import { json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return json(await getSettings());
}

export async function PUT(req: Request) {
  return json(await saveSettings(await readJson(req)));
}
