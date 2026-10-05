import { listClients, sanitizeClientInput, saveClient } from "@/lib/db";
import { badRequest, json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return json(await listClients());
}

export async function POST(req: Request) {
  const client = sanitizeClientInput(await readJson(req));
  if (!client.name) return badRequest("Bitte einen Namen angeben.");
  return json(await saveClient(client), 201);
}
