"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { invoices, payments } from "../db/schema";
import { assertUser } from "../auth";
import { isDate, money, optInt, str, bool } from "../forms";
import { todayISO } from "../dates";
import { eur } from "../format";
import { getSetting } from "../settings";
import { parseItems, loadInvoiceDocument } from "../domain/documents";
import {
  cancelInvoice as cancelInvoiceDomain,
  finalizeInvoice as finalizeDomain,
  generateRecurringInvoices,
  recalcInvoice,
  replaceInvoiceItems,
} from "../domain/invoicing";
import { logActivity } from "../domain/activity";
import { invoiceAttachments } from "../domain/attachments";
import { sendMail } from "../mail";
import { parseNumber } from "../format";
import { fail, success, type ActionState } from "./types";

function revalidateInvoice(id: number, customerId?: number) {
  revalidatePath("/rechnungen");
  revalidatePath(`/rechnungen/${id}`);
  revalidatePath("/finanzen");
  revalidatePath("/");
  if (customerId) revalidatePath(`/kunden/${customerId}`);
}

export async function saveInvoice(invoiceId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const customerId = optInt(fd, "customerId");
  const title = str(fd, "title");
  const issueDate = str(fd, "issueDate");
  const items = parseItems(fd.get("items"));
  const errors: Record<string, string> = {};
  if (!customerId) errors.customerId = "Bitte Kunden wählen";
  if (!title) errors.title = "Bitte einen Betreff angeben";
  if (!isDate(issueDate)) errors.issueDate = "Bitte ein Datum angeben";
  if (Object.keys(errors).length) return fail("Bitte Eingaben prüfen.", errors);
  if (!items.length) return fail("Bitte mindestens eine Position mit Bezeichnung anlegen.");

  const values = {
    customerId: customerId!,
    title: title!,
    issueDate: issueDate!,
    serviceFrom: str(fd, "serviceFrom"),
    serviceTo: str(fd, "serviceTo"),
    dueDate: str(fd, "dueDate"),
    intro: str(fd, "intro"),
    outro: str(fd, "outro"),
    discountPercent: Math.min(100, Math.max(0, parseNumber(fd.get("discountPercent") as string, 0))),
    updatedAt: new Date().toISOString(),
  };

  let id = invoiceId;
  if (invoiceId) {
    const [existing] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!existing) return fail("Rechnung nicht gefunden");
    if (existing.status !== "entwurf") return fail("Festgeschriebene Rechnungen können nicht mehr geändert werden. Bitte stornieren und neu erstellen.");
    await db.update(invoices).set(values).where(eq(invoices.id, invoiceId));
  } else {
    const [created] = await db
      .insert(invoices)
      .values({ ...values, quoteId: optInt(fd, "quoteId"), contractId: optInt(fd, "contractId"), status: "entwurf", createdBy: user.id })
      .returning();
    id = created.id;
  }
  await replaceInvoiceItems(id!, items);
  await recalcInvoice(id!);
  revalidateInvoice(id!, values.customerId);
  return success(invoiceId ? "Entwurf gespeichert" : "Rechnungsentwurf angelegt", { redirectTo: `/rechnungen/${id}` });
}

export async function finalizeInvoice(invoiceId: number): Promise<ActionState> {
  const user = await assertUser();
  const res = await finalizeDomain(invoiceId, user.id);
  if (!res.ok) return fail(res.error ?? "Fehler beim Festschreiben");
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  revalidateInvoice(invoiceId, inv?.customerId);
  return success(`Rechnung ${inv?.number} festgeschrieben`);
}

export async function markInvoiceSent(invoiceId: number): Promise<ActionState> {
  const user = await assertUser();
  const res = await finalizeDomain(invoiceId, user.id);
  if (!res.ok) return fail(res.error ?? "Fehler");
  await db.update(invoices).set({ sentAt: new Date().toISOString() }).where(eq(invoices.id, invoiceId));
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  revalidateInvoice(invoiceId, inv?.customerId);
  return success("Als versendet markiert");
}

export async function sendInvoiceMail(invoiceId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const to = str(fd, "to");
  if (!to) return fail("Bitte Empfänger angeben.", { to: "Pflichtfeld" });
  const fin = await finalizeDomain(invoiceId, user.id);
  if (!fin.ok) return fail(fin.error ?? "Fehler beim Festschreiben");
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  const attachments = await invoiceAttachments(invoiceId, bool(fd, "xml"));
  const res = await sendMail({
    to,
    cc: str(fd, "cc"),
    subject: str(fd, "subject") ?? `Rechnung ${inv.number}`,
    text: str(fd, "body") ?? "",
    attachments,
    customerId: inv.customerId,
    refType: "invoice",
    refId: invoiceId,
    userId: user.id,
  });
  if (!res.ok) {
    revalidateInvoice(invoiceId, inv.customerId);
    return fail(res.error ?? "Versand fehlgeschlagen");
  }
  await db.update(invoices).set({ sentAt: new Date().toISOString() }).where(eq(invoices.id, invoiceId));
  await logActivity({ customerId: inv.customerId, userId: user.id, kind: "email", title: `Rechnung ${inv.number} per E-Mail versendet`, body: `an ${to}`, refType: "invoice", refId: invoiceId });
  revalidateInvoice(invoiceId, inv.customerId);
  return success(`Rechnung ${inv.number} an ${to} gesendet`);
}

export async function sendReminderMail(invoiceId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const to = str(fd, "to");
  if (!to) return fail("Bitte Empfänger angeben.", { to: "Pflichtfeld" });
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv || !inv.number) return fail("Rechnung nicht gefunden");
  const attachments = await invoiceAttachments(invoiceId, false);
  const res = await sendMail({
    to,
    cc: str(fd, "cc"),
    subject: str(fd, "subject") ?? `Zahlungserinnerung ${inv.number}`,
    text: str(fd, "body") ?? "",
    attachments,
    customerId: inv.customerId,
    refType: "invoice",
    refId: invoiceId,
    userId: user.id,
  });
  if (!res.ok) return fail(res.error ?? "Versand fehlgeschlagen");
  await db
    .update(invoices)
    .set({ reminderLevel: inv.reminderLevel + 1, lastReminderAt: todayISO() })
    .where(eq(invoices.id, invoiceId));
  await logActivity({ customerId: inv.customerId, userId: user.id, kind: "email", title: `${inv.reminderLevel + 1}. Zahlungserinnerung zu ${inv.number} versendet`, refType: "invoice", refId: invoiceId });
  revalidateInvoice(invoiceId, inv.customerId);
  return success("Zahlungserinnerung versendet");
}

export async function addPayment(invoiceId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const date = str(fd, "date");
  const amount = money(fd, "amount");
  if (!isDate(date)) return fail("Bitte Datum angeben.", { date: "Pflichtfeld" });
  if (amount <= 0) return fail("Bitte Betrag angeben.", { amount: "Betrag muss größer 0 sein" });
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv) return fail("Rechnung nicht gefunden");
  if (inv.status === "entwurf") {
    const fin = await finalizeDomain(invoiceId, user.id);
    if (!fin.ok) return fail(fin.error ?? "Fehler");
  }
  await db.insert(payments).values({ invoiceId, date: date!, amount, method: str(fd, "method") ?? "ueberweisung", note: str(fd, "note") });
  await recalcInvoice(invoiceId);
  const [after] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  await logActivity({
    customerId: inv.customerId,
    userId: user.id,
    title: `Zahlung erhalten: ${eur(amount)}`,
    body: `zu Rechnung ${after.number}${after.status === "bezahlt" ? " – vollständig bezahlt" : ""}`,
    refType: "invoice",
    refId: invoiceId,
  });
  revalidateInvoice(invoiceId, inv.customerId);
  return success(after.status === "bezahlt" ? "Rechnung ist vollständig bezahlt 🎉" : "Zahlung erfasst");
}

export async function markPaidInFull(invoiceId: number): Promise<ActionState> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv) return fail("Rechnung nicht gefunden");
  const fd = new FormData();
  fd.set("date", todayISO());
  fd.set("amount", String((inv.grossTotal - inv.paidTotal) / 100));
  fd.set("method", "ueberweisung");
  return addPayment(invoiceId, null, fd);
}

export async function deletePayment(invoiceId: number, paymentId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(payments).where(and(eq(payments.id, paymentId), eq(payments.invoiceId, invoiceId)));
  await recalcInvoice(invoiceId);
  revalidateInvoice(invoiceId);
  return success("Zahlung entfernt");
}

export async function cancelInvoice(invoiceId: number): Promise<ActionState> {
  const user = await assertUser();
  const res = await cancelInvoiceDomain(invoiceId, user.id);
  if (!res.ok) return fail(res.error ?? "Storno fehlgeschlagen");
  revalidateInvoice(invoiceId);
  return success("Rechnung storniert – Stornorechnung wurde erstellt", { redirectTo: `/rechnungen/${res.stornoId}` });
}

export async function deleteInvoiceDraft(invoiceId: number): Promise<ActionState> {
  await assertUser();
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv) return fail("Nicht gefunden");
  if (inv.status !== "entwurf") return fail("Nur Entwürfe können gelöscht werden. Festgeschriebene Rechnungen bitte stornieren.");
  await db.delete(invoices).where(eq(invoices.id, invoiceId));
  revalidateInvoice(invoiceId, inv.customerId);
  return success("Entwurf gelöscht", { redirectTo: "/rechnungen" });
}

export async function duplicateInvoice(invoiceId: number): Promise<ActionState> {
  const user = await assertUser();
  const doc = await loadInvoiceDocument(invoiceId);
  if (!doc) return fail("Nicht gefunden");
  const today = todayISO();
  const invoicing = await getSetting("invoicing");
  const due = new Date(Date.now() + (doc.customer.paymentTermDays ?? invoicing.paymentTermDays) * 86400000).toISOString().slice(0, 10);
  const [created] = await db
    .insert(invoices)
    .values({
      customerId: doc.invoice.customerId,
      contractId: doc.invoice.contractId,
      title: doc.invoice.title,
      status: "entwurf",
      issueDate: today,
      dueDate: due,
      intro: doc.invoice.intro,
      outro: doc.invoice.outro,
      discountPercent: doc.invoice.discountPercent,
      createdBy: user.id,
    })
    .returning();
  await replaceInvoiceItems(created.id, doc.data.items);
  await recalcInvoice(created.id);
  revalidateInvoice(created.id, doc.invoice.customerId);
  return success("Kopie als Entwurf angelegt", { redirectTo: `/rechnungen/${created.id}?bearbeiten=1` });
}

export async function runRecurringInvoices(): Promise<ActionState> {
  const user = await assertUser();
  const n = await generateRecurringInvoices(user.id);
  revalidatePath("/rechnungen");
  revalidatePath("/");
  return success(n ? `${n} Rechnungsentwurf${n === 1 ? "" : "e"} aus Verträgen erstellt` : "Keine Serienrechnungen fällig");
}
