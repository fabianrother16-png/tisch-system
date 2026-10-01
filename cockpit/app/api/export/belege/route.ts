import { and, gte, inArray, lte, ne } from "drizzle-orm";
import { zipSync, strToU8 } from "fflate";
import { db } from "@/lib/db";
import { expenses, files, invoices } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readFile } from "@/lib/storage";
import { archivedInvoicePdf } from "@/lib/domain/invoicing";

function safe(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120);
}

export async function GET(req: Request) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const year = new URL(req.url).searchParams.get("jahr") ?? String(new Date().getFullYear());
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const entries: Record<string, Uint8Array> = {};

  const invs = await db.select().from(invoices).where(and(ne(invoices.status, "entwurf"), gte(invoices.issueDate, from), lte(invoices.issueDate, to)));
  for (const inv of invs) {
    const f = await archivedInvoicePdf(inv.id);
    if (!f) continue;
    const stored = await readFile(f.id);
    if (stored) entries[`Rechnungen/${safe(f.name)}`] = new Uint8Array(stored.data);
  }

  const exps = await db.select().from(expenses).where(and(gte(expenses.date, from), lte(expenses.date, to)));
  const receiptIds = exps.map((e) => e.receiptFileId).filter((x): x is number => !!x);
  const receiptFiles = receiptIds.length ? await db.select().from(files).where(inArray(files.id, receiptIds)) : [];
  for (const e of exps) {
    const f = receiptFiles.find((x) => x.id === e.receiptFileId);
    if (!f) continue;
    const stored = await readFile(f.id);
    const ext = f.name.includes(".") ? f.name.slice(f.name.lastIndexOf(".")) : "";
    if (stored) entries[`Belege/${e.date}_${safe(e.vendor)}_Beleg_${e.id}${ext}`] = new Uint8Array(stored.data);
  }

  const missing = exps.filter((e) => !e.receiptFileId);
  entries["LIESMICH.txt"] = strToU8(
    `Export ${year}\r\nRechnungen: ${Object.keys(entries).filter((k) => k.startsWith("Rechnungen/")).length}\r\nBelege: ${Object.keys(entries).filter((k) => k.startsWith("Belege/")).length}\r\n` +
      (missing.length ? `\r\nAusgaben ohne Beleg:\r\n${missing.map((e) => `- ${e.date} ${e.vendor} ${(e.grossAmount / 100).toFixed(2)} EUR`).join("\r\n")}\r\n` : ""),
  );
  const zip = zipSync(entries, { level: 6 });
  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Belege_${year}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
