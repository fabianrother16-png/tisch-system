import { deleteClient, getClient, sanitizeClientInput, saveClient } from "@/lib/db";
import { badRequest, json, notFound, readJson } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const client = await getClient((await params).id);
  return client ? json(client) : notFound("Kunde");
}

export async function PUT(req: Request, { params }: Ctx) {
  const existing = await getClient((await params).id);
  if (!existing) return notFound("Kunde");
  const client = sanitizeClientInput(await readJson(req), existing);
  if (!client.name) return badRequest("Bitte einen Namen angeben.");
  return json(await saveClient(client));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!(await getClient(id))) return notFound("Kunde");
  await deleteClient(id);
  return json({ ok: true });
}
