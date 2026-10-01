import { addDays, addMonths, diffDays, todayISO } from "../dates";
import type { Contract } from "../db/schema";
import { BILLING_MONTHS } from "../constants";

export type ContractTerm = {
  /** Ende der aktuellen (Mindest-)Laufzeit bzw. Verlängerungsperiode */
  termEnd: string | null;
  /** Letzter Tag, an dem noch fristgerecht zum termEnd gekündigt werden kann */
  noticeDeadline: string | null;
  daysToNotice: number | null;
  daysToEnd: number | null;
  /** Verlängert sich automatisch, wenn nicht gekündigt wird */
  renews: boolean;
  label: string;
};

function subtractNotice(date: string, value: number, unit: Contract["noticeUnit"]): string {
  if (!value) return date;
  if (unit === "tage") return addDays(date, -value);
  if (unit === "wochen") return addDays(date, -value * 7);
  return addMonths(date, -value);
}

export function noticeLabel(c: Pick<Contract, "noticePeriod" | "noticeUnit">): string {
  if (!c.noticePeriod) return "jederzeit";
  const unit = c.noticeUnit === "tage" ? "Tag" : c.noticeUnit === "wochen" ? "Woche" : "Monat";
  const plural = c.noticePeriod === 1 ? unit : unit === "Monat" ? "Monate" : unit === "Woche" ? "Wochen" : "Tage";
  return `${c.noticePeriod} ${plural}`;
}

export function contractTerm(c: Contract, today = todayISO()): ContractTerm {
  if (c.status === "beendet" || c.status === "entwurf") {
    return { termEnd: c.endDate, noticeDeadline: null, daysToNotice: null, daysToEnd: null, renews: false, label: c.status === "beendet" ? "Beendet" : "Entwurf" };
  }
  let termEnd: string | null = null;
  const renews = c.autoRenewMonths > 0 && c.status !== "gekuendigt";

  if (c.status === "gekuendigt") {
    termEnd = c.endDate;
  } else if (c.minTermMonths > 0) {
    termEnd = addDays(addMonths(c.startDate, c.minTermMonths), -1);
    if (renews) {
      let guard = 0;
      while (termEnd < today && guard++ < 200) {
        termEnd = addDays(addMonths(addDays(termEnd, 1), c.autoRenewMonths), -1);
      }
    }
  } else if (c.endDate) {
    termEnd = c.endDate;
  }

  const noticeDeadline = termEnd && c.status === "aktiv" ? subtractNotice(termEnd, c.noticePeriod, c.noticeUnit) : null;
  const daysToNotice = noticeDeadline ? diffDays(noticeDeadline, today) : null;
  const daysToEnd = termEnd ? diffDays(termEnd, today) : null;

  let label = "Unbefristet";
  if (c.status === "gekuendigt") label = termEnd ? "Gekündigt" : "Gekündigt (Ende offen)";
  else if (termEnd && renews) label = `Verlängert sich um ${c.autoRenewMonths} Mon.`;
  else if (termEnd) label = "Befristet";

  return { termEnd, noticeDeadline, daysToNotice, daysToEnd, renews, label };
}

/** Monatlicher Gegenwert eines Vertrags (für MRR) */
export function monthlyValue(c: Contract): number {
  if (c.status !== "aktiv" || c.billingInterval === "einmalig") return 0;
  return c.monthlyFee;
}

/** Betrag je Abrechnung (monatliche Gebühr × Intervall) */
export function amountPerBilling(c: Contract): number {
  const months = BILLING_MONTHS[c.billingInterval] || 1;
  return c.monthlyFee * months;
}
