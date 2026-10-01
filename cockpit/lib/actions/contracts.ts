"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { contracts } from "../db/schema";
import { assertUser } from "../auth";
import { logActivity } from "../domain/activity";
import { contractTerm } from "../domain/contracts";
import { saveUpload, isUpload } from "../storage";
import { bool, int, isDate, list, money, str } from "../forms";
import { todayISO } from "../dates";
import { fail, success, type ActionState } from "./types";

type ContractStatus = "entwurf" | "aktiv" | "gekuendigt" | "beendet";
type Interval = "monatlich" | "quartalsweise" | "halbjaehrlich" | "jaehrlich" | "einmalig";

function contractValues(fd: FormData) {
  return {
    title: str(fd, "title") ?? "",
    status: (str(fd, "status") ?? "aktiv") as ContractStatus,
    startDate: str(fd, "startDate") ?? "",
    endDate: str(fd, "endDate"),
    minTermMonths: int(fd, "minTermMonths"),
    noticePeriod: int(fd, "noticePeriod"),
    noticeUnit: (str(fd, "noticeUnit") ?? "monate") as "tage" | "wochen" | "monate",
    autoRenewMonths: int(fd, "autoRenewMonths"),
    monthlyFee: money(fd, "monthlyFee"),
    setupFee: money(fd, "setupFee"),
    billingInterval: (str(fd, "billingInterval") ?? "monatlich") as Interval,
    autoInvoice: bool(fd, "autoInvoice"),
    nextInvoiceDate: str(fd, "nextInvoiceDate"),
    videosPerMonth: int(fd, "videosPerMonth"),
    postsPerMonth: int(fd, "postsPerMonth"),
    visitsPerMonth: int(fd, "visitsPerMonth"),
    adBudgetMonthly: money(fd, "adBudgetMonthly"),
    services: list(fd, "services"),
    conditions: str(fd, "conditions"),
    notes: str(fd, "notes"),
    signedAt: str(fd, "signedAt"),
  };
}

function validate(v: ReturnType<typeof contractValues>) {
  const errors: Record<string, string> = {};
  if (!v.title) errors.title = "Bitte eine Bezeichnung angeben";
  if (!isDate(v.startDate)) errors.startDate = "Bitte ein Startdatum angeben";
  if (v.endDate && v.endDate < v.startDate) errors.endDate = "Ende liegt vor dem Start";
  if (v.autoInvoice && v.billingInterval !== "einmalig" && !v.monthlyFee) errors.monthlyFee = "Für Serienrechnungen wird ein Betrag benötigt";
  return errors;
}

export async function saveContract(
  customerId: number,
  contractId: number | null,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const user = await assertUser();
  const values = contractValues(fd);
  const errors = validate(values);
  if (Object.keys(errors).length) return fail("Bitte Eingaben prüfen.", errors);
  if (values.autoInvoice && !values.nextInvoiceDate) values.nextInvoiceDate = values.startDate > todayISO() ? values.startDate : todayISO();

  let id = contractId;
  if (contractId) {
    await db
      .update(contracts)
      .set({ ...values, updatedAt: new Date().toISOString() })
      .where(and(eq(contracts.id, contractId), eq(contracts.customerId, customerId)));
  } else {
    const [created] = await db.insert(contracts).values({ ...values, customerId }).returning();
    id = created.id;
    await logActivity({ customerId, userId: user.id, title: `Vertrag angelegt: ${values.title}`, refType: "contract", refId: id });
  }

  const upload = fd.get("file");
  if (isUpload(upload) && id) {
    const file = await saveUpload(upload, { customerId, category: "vertrag", refType: "contract", refId: id, uploadedBy: user.id });
    await db.update(contracts).set({ fileId: file.id }).where(eq(contracts.id, id));
  }

  revalidatePath(`/kunden/${customerId}`);
  revalidatePath("/vertraege");
  return success(contractId ? "Vertrag gespeichert" : "Vertrag angelegt");
}

export async function cancelContract(customerId: number, contractId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  if (!contract) return fail("Vertrag nicht gefunden");
  const term = contractTerm(contract);
  const endDate = str(fd, "endDate") ?? term.termEnd ?? todayISO();
  await db
    .update(contracts)
    .set({ status: "gekuendigt", endDate, cancelledAt: todayISO(), autoInvoice: contract.autoInvoice, updatedAt: new Date().toISOString() })
    .where(eq(contracts.id, contractId));
  await logActivity({
    customerId,
    userId: user.id,
    title: `Vertrag gekündigt: ${contract.title}`,
    body: `Endet zum ${endDate}${str(fd, "reason") ? ` – ${str(fd, "reason")}` : ""}`,
    refType: "contract",
    refId: contractId,
  });
  revalidatePath(`/kunden/${customerId}`);
  revalidatePath("/vertraege");
  return success("Kündigung erfasst");
}

export async function deleteContract(customerId: number, contractId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(contracts).where(and(eq(contracts.id, contractId), eq(contracts.customerId, customerId)));
  revalidatePath(`/kunden/${customerId}`);
  revalidatePath("/vertraege");
  return success("Vertrag gelöscht");
}
