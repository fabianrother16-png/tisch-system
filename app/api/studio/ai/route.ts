import { ZodError } from "zod";
import { AI_TASKS, type AiTaskName } from "@/lib/studio/tasks";
import { assertAccess, errorResponse, StudioError } from "@/lib/studio/server/env";
import { runTask } from "@/lib/studio/server/tasks";

// Analysen mit hoher Denktiefe und die Web-Recherche brauchen Zeit.
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    assertAccess(request);
    const body = (await request.json().catch(() => null)) as { task?: string; input?: unknown } | null;
    if (!body?.task || !(body.task in AI_TASKS)) {
      throw new StudioError("Unbekannte KI-Aufgabe.", 400);
    }
    const result = await runTask(body.task as AiTaskName, body.input);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return Response.json(
        { error: `Ungültige Eingabe (${first?.path.join(".") || "?"}: ${first?.message ?? "?"})` },
        { status: 400 },
      );
    }
    return errorResponse(error);
  }
}
