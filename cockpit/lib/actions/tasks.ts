"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tasks } from "../db/schema";
import { assertUser } from "../auth";
import { optInt, str } from "../forms";
import { fail, success, type ActionState } from "./types";

export async function saveTask(taskId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const title = str(fd, "title");
  if (!title) return fail("Bitte einen Titel eingeben.", { title: "Pflichtfeld" });
  const priority = (str(fd, "priority") ?? "normal") as "niedrig" | "normal" | "hoch";
  const values = {
    title,
    description: str(fd, "description"),
    customerId: optInt(fd, "customerId"),
    assigneeId: fd.has("assigneeId") ? optInt(fd, "assigneeId") : user.id,
    dueDate: str(fd, "dueDate"),
    priority: ["niedrig", "normal", "hoch"].includes(priority) ? priority : "normal",
  };
  if (taskId) await db.update(tasks).set(values).where(eq(tasks.id, taskId));
  else await db.insert(tasks).values({ ...values, createdBy: user.id });
  revalidatePath("/aufgaben");
  revalidatePath("/");
  if (values.customerId) revalidatePath(`/kunden/${values.customerId}`);
  return success(taskId ? "Aufgabe gespeichert" : "Aufgabe angelegt");
}

export async function toggleTask(taskId: number): Promise<ActionState> {
  await assertUser();
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!t) return fail("Nicht gefunden");
  const done = t.status === "offen";
  await db
    .update(tasks)
    .set({ status: done ? "erledigt" : "offen", completedAt: done ? new Date().toISOString() : null })
    .where(eq(tasks.id, taskId));
  revalidatePath("/aufgaben");
  revalidatePath("/");
  if (t.customerId) revalidatePath(`/kunden/${t.customerId}`);
  return success(done ? "Erledigt ✓" : "Wieder geöffnet");
}

export async function deleteTask(taskId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath("/aufgaben");
  revalidatePath("/");
  return success("Aufgabe gelöscht");
}
