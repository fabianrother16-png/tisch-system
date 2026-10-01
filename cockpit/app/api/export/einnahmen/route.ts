import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { incomeEntries } from "@/lib/domain/finance";
import { csvResponse, toCsv } from "@/lib/csv";
import { fmtDate } from "@/lib/format";

export async function GET(req: Request) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const year = new URL(req.url).searchParams.get("jahr") ?? String(new Date().getFullYear());
  const [rows, cs] = await Promise.all([incomeEntries(`${year}-01-01`, `${year}-12-31`), db.select().from(customers)]);
  const cmap = new Map(cs.map((c) => [c.id, c]));
  const csv = toCsv(
    ["Zahlungsdatum", "Rechnungsnummer", "Kundennummer", "Kunde", "Netto", "USt", "Brutto", "Steuersätze"],
    rows
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => [
        fmtDate(r.date),
        r.invoiceNumber,
        cmap.get(r.customerId)?.number,
        cmap.get(r.customerId)?.name,
        r.net / 100,
        r.tax / 100,
        r.gross / 100,
        r.byRate.map((b) => `${b.rate}%`).join(", "),
      ]),
  );
  return csvResponse(csv, `Einnahmen_${year}.csv`);
}
