import { listClients, listOutputs } from "@/lib/db";
import { badRequest } from "@/lib/http";
import { getSegment } from "@/lib/segments";

export const dynamic = "force-dynamic";

const STATUS_GELIEFERT = new Set(["freigegeben", "veroeffentlicht"]);

function csvCell(value: string | number) {
  const s = String(value);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Leistungsnachweis pro Monat als CSV (für Rechnungen in eurer Buchhaltungssoftware). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const monat = url.searchParams.get("monat") ?? "";
  if (!/^\d{4}-\d{2}$/.test(monat)) return badRequest("Parameter monat=JJJJ-MM fehlt.");
  const alle = url.searchParams.get("alle") === "1";
  const clients = new Map((await listClients()).map((c) => [c.id, c.name]));
  const rows = (await listOutputs())
    .filter((o) => (o.geplantAm ?? o.createdAt).startsWith(monat))
    .filter((o) => alle || STATUS_GELIEFERT.has(o.status))
    .sort((a, b) => (clients.get(a.clientId ?? "") ?? "").localeCompare(clients.get(b.clientId ?? "") ?? "", "de"));

  const header = ["Monat", "Kunde", "Segment", "Leistung", "Status", "Erstellt", "Geplant", "KI-Kosten (USD)"];
  const lines = [
    header.join(";"),
    ...rows.map((o) =>
      [
        monat,
        clients.get(o.clientId ?? "") ?? "–",
        getSegment(o.segment)?.label ?? o.segment,
        o.title,
        o.status,
        o.createdAt.slice(0, 10),
        o.geplantAm ?? "",
        o.kostenUsd.toFixed(2).replace(".", ","),
      ]
        .map(csvCell)
        .join(";"),
    ),
  ];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="leistungsnachweis-${monat}.csv"`,
    },
  });
}
