"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { db } from "../db";
import { activities, baselines, contacts, customers, invoices, quotes } from "../db/schema";
import { assertUser } from "../auth";
import { randomToken } from "../crypto";
import { nextCustomerNumber } from "../domain/numbering";
import { logActivity } from "../domain/activity";
import { bool, optInt, str } from "../forms";
import { parseNumber } from "../format";
import { CUSTOMER_COLORS } from "../constants";
import { fail, success, type ActionState } from "./types";

function customerValues(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    industry: str(fd, "industry"),
    status: (str(fd, "status") ?? "aktiv") as "lead" | "aktiv" | "pausiert" | "ehemalig",
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    website: str(fd, "website"),
    street: str(fd, "street"),
    zip: str(fd, "zip"),
    city: str(fd, "city"),
    country: str(fd, "country") ?? "Deutschland",
    vatId: str(fd, "vatId"),
    color: str(fd, "color") ?? CUSTOMER_COLORS[0],
    ownerId: optInt(fd, "ownerId"),
    startDate: str(fd, "startDate"),
    source: str(fd, "source"),
    instagramHandle: str(fd, "instagramHandle")?.replace(/^@/, "") ?? null,
    tiktokHandle: str(fd, "tiktokHandle")?.replace(/^@/, "") ?? null,
    facebookUrl: str(fd, "facebookUrl"),
    youtubeUrl: str(fd, "youtubeUrl"),
    googleBusinessUrl: str(fd, "googleBusinessUrl"),
    googlePlaceId: str(fd, "googlePlaceId"),
    paymentTermDays: optInt(fd, "paymentTermDays"),
    notes: str(fd, "notes"),
  };
}

export async function createCustomer(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const values = customerValues(fd);
  if (!values.name) return fail("Bitte Eingaben prüfen.", { name: "Name ist erforderlich" });
  const [{ n }] = await db.select({ n: count() }).from(customers);
  const [customer] = await db
    .insert(customers)
    .values({
      ...values,
      color: str(fd, "color") ?? CUSTOMER_COLORS[n % CUSTOMER_COLORS.length],
      number: await nextCustomerNumber(),
      reportToken: randomToken(18),
    })
    .returning();

  const contactName = str(fd, "contactName");
  if (contactName) {
    await db.insert(contacts).values({
      customerId: customer.id,
      name: contactName,
      position: str(fd, "contactPosition"),
      email: str(fd, "contactEmail") ?? values.email,
      phone: str(fd, "contactPhone") ?? values.phone,
      isPrimary: true,
    });
  }
  await logActivity({ customerId: customer.id, userId: user.id, title: "Kunde angelegt" });
  revalidatePath("/kunden");
  return success("Kunde angelegt", { redirectTo: `/kunden/${customer.id}` });
}

export async function updateCustomer(id: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const values = customerValues(fd);
  if (!values.name) return fail("Bitte Eingaben prüfen.", { name: "Name ist erforderlich" });
  await db
    .update(customers)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(customers.id, id));
  revalidatePath(`/kunden/${id}`);
  revalidatePath("/kunden");
  return success("Gespeichert");
}

export async function deleteCustomer(id: number): Promise<ActionState> {
  await assertUser();
  const [[inv], [quo]] = await Promise.all([
    db.select({ n: count() }).from(invoices).where(and(eq(invoices.customerId, id))),
    db.select({ n: count() }).from(quotes).where(eq(quotes.customerId, id)),
  ]);
  if (inv.n > 0 || quo.n > 0) {
    return fail(
      "Kunden mit Rechnungen oder Angeboten können aus Gründen der Aufbewahrungspflicht nicht gelöscht werden. Setze den Status stattdessen auf „Ehemalig“.",
    );
  }
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/kunden");
  return success("Kunde gelöscht", { redirectTo: "/kunden" });
}

export async function setCustomerStatus(id: number, status: "lead" | "aktiv" | "pausiert" | "ehemalig"): Promise<ActionState> {
  const user = await assertUser();
  await db.update(customers).set({ status, updatedAt: new Date().toISOString() }).where(eq(customers.id, id));
  await logActivity({ customerId: id, userId: user.id, title: `Status geändert: ${status}` });
  revalidatePath(`/kunden/${id}`);
  return success("Status geändert");
}

// ─── Kontakte ──────────────────────────────────────────────────────────────

export async function saveContact(customerId: number, contactId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const name = str(fd, "name");
  if (!name) return fail("Bitte Eingaben prüfen.", { name: "Name ist erforderlich" });
  const values = {
    name,
    position: str(fd, "position"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    notes: str(fd, "notes"),
    isPrimary: bool(fd, "isPrimary"),
  };
  if (values.isPrimary) {
    await db.update(contacts).set({ isPrimary: false }).where(eq(contacts.customerId, customerId));
  }
  if (contactId) {
    await db.update(contacts).set(values).where(and(eq(contacts.id, contactId), eq(contacts.customerId, customerId)));
  } else {
    await db.insert(contacts).values({ ...values, customerId });
  }
  revalidatePath(`/kunden/${customerId}`);
  return success(contactId ? "Kontakt gespeichert" : "Kontakt hinzugefügt");
}

export async function deleteContact(customerId: number, contactId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(contacts).where(and(eq(contacts.id, contactId), eq(contacts.customerId, customerId)));
  revalidatePath(`/kunden/${customerId}`);
  return success("Kontakt entfernt");
}

// ─── Notizen / Verlauf ─────────────────────────────────────────────────────

export async function addNote(customerId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const body = str(fd, "body");
  if (!body) return fail("Bitte einen Text eingeben.");
  const kind = str(fd, "kind") ?? "notiz";
  const titles: Record<string, string> = { notiz: "Notiz", anruf: "Telefonat", meeting: "Meeting", email: "E-Mail" };
  await db.insert(activities).values({ customerId, userId: user.id, kind, title: titles[kind] ?? "Notiz", body });
  revalidatePath(`/kunden/${customerId}`);
  return success("Eintrag gespeichert");
}

export async function deleteActivity(customerId: number, activityId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(activities).where(and(eq(activities.id, activityId), eq(activities.customerId, customerId)));
  revalidatePath(`/kunden/${customerId}`);
  return success("Eintrag gelöscht");
}

// ─── Ausgangswerte & Report ───────────────────────────────────────────────

export async function saveBaselines(customerId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const date = str(fd, "date");
  for (const [key, raw] of fd.entries()) {
    if (!key.startsWith("b:")) continue;
    const [, platform, metric] = key.split(":");
    const value = String(raw).trim();
    if (value === "") {
      await db
        .delete(baselines)
        .where(and(eq(baselines.customerId, customerId), eq(baselines.platform, platform), eq(baselines.metric, metric)));
      continue;
    }
    const n = parseNumber(value);
    await db
      .insert(baselines)
      .values({ customerId, platform, metric, value: n, date })
      .onConflictDoUpdate({
        target: [baselines.customerId, baselines.platform, baselines.metric],
        set: { value: n, date },
      });
  }
  revalidatePath(`/kunden/${customerId}`);
  return success("Ausgangswerte gespeichert");
}

export async function toggleReport(customerId: number, enabled: boolean): Promise<ActionState> {
  const user = await assertUser();
  await db.update(customers).set({ reportEnabled: enabled }).where(eq(customers.id, customerId));
  await logActivity({ customerId, userId: user.id, title: enabled ? "Kunden-Report freigegeben" : "Kunden-Report deaktiviert" });
  revalidatePath(`/kunden/${customerId}`);
  return success(enabled ? "Report-Link ist jetzt aktiv" : "Report-Link deaktiviert");
}

export async function regenerateReportToken(customerId: number): Promise<ActionState> {
  await assertUser();
  await db.update(customers).set({ reportToken: randomToken(18) }).where(eq(customers.id, customerId));
  revalidatePath(`/kunden/${customerId}`);
  return success("Neuer Link erzeugt – der alte funktioniert nicht mehr");
}

export async function sendReportMail(customerId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const to = str(fd, "to");
  if (!to) return fail("Bitte Empfänger angeben.", { to: "Pflichtfeld" });
  const { sendMail } = await import("../mail");
  const res = await sendMail({
    to,
    cc: str(fd, "cc"),
    subject: str(fd, "subject") ?? "Ihr Marketing-Report",
    text: str(fd, "body") ?? "",
    customerId,
    refType: "report",
    userId: user.id,
  });
  if (!res.ok) return fail(res.error ?? "Versand fehlgeschlagen");
  await db.update(customers).set({ reportEnabled: true }).where(eq(customers.id, customerId));
  await logActivity({ customerId, userId: user.id, kind: "email", title: "Report-Link per E-Mail gesendet", body: `an ${to}` });
  revalidatePath(`/kunden/${customerId}`);
  return success("Report-Link versendet");
}
