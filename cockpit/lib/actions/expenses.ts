"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, like } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../db/schema";
import { assertUser } from "../auth";
import { bool, isDate, money, optInt, str, int } from "../forms";
import { isUpload, saveUpload } from "../storage";
import { getSetting } from "../settings";
import { endOfMonth } from "../dates";
import { fail, success, type ActionState } from "./types";

function revalidate(customerId?: number | null) {
  revalidatePath("/ausgaben");
  revalidatePath("/finanzen");
  revalidatePath("/");
  if (customerId) revalidatePath(`/kunden/${customerId}`);
}

export async function saveExpense(expenseId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const date = str(fd, "date");
  const vendor = str(fd, "vendor");
  const amount = money(fd, "amount");
  const errors: Record<string, string> = {};
  if (!isDate(date)) errors.date = "Bitte Datum angeben";
  if (!vendor) errors.vendor = "Bitte Händler / Zahlungsempfänger angeben";
  if (amount <= 0) errors.amount = "Bitte Betrag angeben";
  if (Object.keys(errors).length) return fail("Bitte Eingaben prüfen.", errors);

  const { kleinunternehmer } = await getSetting("invoicing");
  const taxRate = int(fd, "taxRate", 19);
  const isGross = (str(fd, "amountType") ?? "brutto") === "brutto";
  // Kleinunternehmer können keine Vorsteuer ziehen – Bruttobetrag ist Kostenbetrag
  const gross = isGross ? amount : Math.round(amount * (1 + taxRate / 100));
  const net = kleinunternehmer ? gross : isGross ? Math.round(amount / (1 + taxRate / 100)) : amount;
  const tax = kleinunternehmer ? 0 : gross - net;
  const paymentMethod = (str(fd, "paymentMethod") ?? "geschaeftskonto") as "geschaeftskonto" | "privat_auslage";
  const values = {
    date: date!,
    vendor: vendor!,
    description: str(fd, "description"),
    category: str(fd, "category") ?? "sonstiges",
    netAmount: net,
    taxRate: kleinunternehmer ? 0 : taxRate,
    taxAmount: tax,
    grossAmount: gross,
    customerId: optInt(fd, "customerId"),
    paymentMethod,
    paidByUserId: paymentMethod === "privat_auslage" ? optInt(fd, "paidByUserId") ?? user.id : null,
    reimbursed: bool(fd, "reimbursed"),
    recurring: (str(fd, "recurring") ?? "nein") as "nein" | "monatlich" | "jaehrlich",
    notes: str(fd, "notes"),
  };
  let id = expenseId;
  if (expenseId) {
    await db.update(expenses).set(values).where(eq(expenses.id, expenseId));
  } else {
    const [row] = await db.insert(expenses).values(values).returning();
    id = row.id;
  }
  const upload = fd.get("receipt");
  if (isUpload(upload)) {
    const file = await saveUpload(upload, {
      customerId: values.customerId,
      category: "beleg",
      refType: "expense",
      refId: id!,
      uploadedBy: user.id,
      notes: `${values.vendor} – ${values.date}`,
    });
    await db.update(expenses).set({ receiptFileId: file.id }).where(eq(expenses.id, id!));
  }
  revalidate(values.customerId);
  return success(expenseId ? "Ausgabe gespeichert" : "Ausgabe erfasst");
}

export async function deleteExpense(expenseId: number): Promise<ActionState> {
  await assertUser();
  const [e] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
  await db.delete(expenses).where(eq(expenses.id, expenseId));
  revalidate(e?.customerId);
  return success("Ausgabe gelöscht");
}

export async function markReimbursed(expenseIds: number[]): Promise<ActionState> {
  await assertUser();
  if (!expenseIds.length) return success("Nichts zu tun");
  await db.update(expenses).set({ reimbursed: true }).where(inArray(expenses.id, expenseIds));
  revalidate();
  return success("Als erstattet markiert");
}

/** Wiederkehrende Ausgaben (Abos, Miete …) für einen Monat buchen, sofern noch nicht vorhanden */
export async function bookRecurring(month: string): Promise<ActionState> {
  await assertUser();
  const templates = await db.select().from(expenses).where(inArray(expenses.recurring, ["monatlich", "jaehrlich"]));
  // je Vorlage nur die jüngste Buchung betrachten
  const latest = new Map<string, (typeof templates)[number]>();
  for (const t of templates) {
    const key = `${t.vendor}|${t.description ?? ""}|${t.recurring}`;
    const prev = latest.get(key);
    if (!prev || prev.date < t.date) latest.set(key, t);
  }
  let created = 0;
  for (const t of latest.values()) {
    if (t.date.startsWith(month) || t.date > endOfMonth(`${month}-01`)) continue;
    if (t.recurring === "jaehrlich" && t.date.slice(5, 7) !== month.slice(5, 7)) continue;
    const exists = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(and(eq(expenses.vendor, t.vendor), like(expenses.date, `${month}%`), eq(expenses.grossAmount, t.grossAmount)))
      .limit(1);
    if (exists.length) continue;
    const day = t.date.slice(8, 10);
    const date = `${month}-${day}` > endOfMonth(`${month}-01`) ? endOfMonth(`${month}-01`) : `${month}-${day}`;
    await db.insert(expenses).values({
      date,
      vendor: t.vendor,
      description: t.description,
      category: t.category,
      netAmount: t.netAmount,
      taxRate: t.taxRate,
      taxAmount: t.taxAmount,
      grossAmount: t.grossAmount,
      customerId: t.customerId,
      paymentMethod: t.paymentMethod,
      paidByUserId: t.paidByUserId,
      recurring: t.recurring,
      notes: t.notes,
    });
    created++;
  }
  revalidate();
  return success(created ? `${created} wiederkehrende Ausgabe${created === 1 ? "" : "n"} gebucht – Belege bitte ergänzen` : "Alle wiederkehrenden Ausgaben sind bereits gebucht");
}
