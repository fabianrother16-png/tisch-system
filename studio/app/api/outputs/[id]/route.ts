import { applyOutputPatch, deleteOutput, getOutput, saveOutput } from "@/lib/db";
import { json, notFound, readJson } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const output = await getOutput((await params).id);
  return output ? json(output) : notFound("Ergebnis");
}

export async function PATCH(req: Request, { params }: Ctx) {
  const output = await getOutput((await params).id);
  if (!output) return notFound("Ergebnis");
  return json(await saveOutput(applyOutputPatch(output, await readJson(req))));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!(await getOutput(id))) return notFound("Ergebnis");
  await deleteOutput(id);
  return json({ ok: true });
}
