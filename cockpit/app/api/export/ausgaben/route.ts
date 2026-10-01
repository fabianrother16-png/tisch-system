import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { expenseEntries } from "@/lib/domain/finance";
import { csvResponse, toCsv } from "@/lib/csv";
import { EXPENSE_CATEGORY_MAP } from "@/lib/constants";
import { fmtDate } from "@/lib/format";

export async function GET(req: Request) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const year = new URL(req.url).searchParams.get("jahr") ?? String(new Date().getFullYear());
  const [rows, cs] = await Promise.all([expenseEntries(`${year}-01-01`, `${year}-12-31`), db.select().from(customers)]);
  const cmap = new Map(cs.map((c) => [c.id, c.name]));
  const csv = toCsv(
    ["Datum", "Empfänger", "Beschreibung", "Kategorie", "Netto", "USt-Satz", "Vorsteuer", "Brutto", "Kunde", "Zahlungsweg", "Beleg"],
    rows
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => [
        fmtDate(e.date),
        e.vendor,
        e.description,
        EXPENSE_CATEGORY_MAP[e.category]?.label ?? e.category,
        e.netAmount / 100,
        `${e.taxRate}%`,
        e.taxAmount / 100,
        e.grossAmount / 100,
        e.customerId ? cmap.get(e.customerId) : "",
        e.paymentMethod === "privat_auslage" ? "Privat ausgelegt" : "Geschäftskonto",
        e.receiptFileId ? `Beleg_${e.id}` : "FEHLT",
      ]),
  );
  return csvResponse(csv, `Ausgaben_${year}.csv`);
}
