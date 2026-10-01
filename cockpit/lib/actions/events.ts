"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { events, tasks } from "../db/schema";
import { assertUser } from "../auth";
import { logActivity } from "../domain/activity";
import { bool, isDate, optInt, str } from "../forms";
import { EVENT_TYPES, EVENT_TYPE_MAP, VISIT_EVENT_TYPES } from "../constants";
import { addDays } from "../dates";
import { fail, success, type ActionState } from "./types";

export async function saveEvent(eventId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const title = str(fd, "title");
  const date = str(fd, "date");
  const allDay = bool(fd, "allDay");
  const startTime = str(fd, "startTime") ?? "09:00";
  const endTime = str(fd, "endTime");
  const endDate = str(fd, "endDate") ?? date;
  const errors: Record<string, string> = {};
  if (!title) errors.title = "Bitte einen Titel angeben";
  if (!isDate(date)) errors.date = "Bitte ein Datum wählen";
  if (Object.keys(errors).length) return fail("Bitte Eingaben prüfen.", errors);

  const type = str(fd, "type") ?? "meeting";
  const start = allDay ? date! : `${date}T${startTime}`;
  let end: string | null = allDay ? (endDate && endDate > date! ? endDate : null) : endTime ? `${endDate ?? date}T${endTime}` : null;
  if (end && end < start) end = null;
  const values = {
    title: title!,
    type: EVENT_TYPES.some((t) => t.value === type) ? type : "meeting",
    start,
    end,
    allDay,
    location: str(fd, "location"),
    customerId: optInt(fd, "customerId"),
    assigneeIds: fd.getAll("assigneeIds").map(Number).filter(Boolean),
    countsAsVisit: fd.has("countsAsVisit") ? bool(fd, "countsAsVisit") : VISIT_EVENT_TYPES.includes(type),
    notes: str(fd, "notes"),
  };

  if (eventId) {
    await db.update(events).set(values).where(eq(events.id, eventId));
  } else {
    const [created] = await db.insert(events).values({ ...values, createdBy: user.id }).returning();
    if (values.customerId) {
      await logActivity({
        customerId: values.customerId,
        userId: user.id,
        title: `${EVENT_TYPE_MAP[values.type]?.label ?? "Termin"} geplant: ${values.title}`,
        body: `am ${date!.split("-").reverse().join(".")}${allDay ? "" : ` um ${startTime} Uhr`}`,
        refType: "event",
        refId: created.id,
      });
    }
    // Optional: Vorbereitungs-Aufgabe
    if (bool(fd, "prepTask")) {
      await db.insert(tasks).values({
        title: `Vorbereiten: ${values.title}`,
        customerId: values.customerId,
        assigneeId: values.assigneeIds[0] ?? user.id,
        dueDate: addDays(date!, -1),
        createdBy: user.id,
      });
    }
  }
  revalidatePath("/kalender");
  revalidatePath("/");
  if (values.customerId) revalidatePath(`/kunden/${values.customerId}`);
  return success(eventId ? "Termin gespeichert" : "Termin eingetragen");
}

export async function deleteEvent(eventId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(events).where(eq(events.id, eventId));
  revalidatePath("/kalender");
  revalidatePath("/");
  return success("Termin gelöscht");
}
