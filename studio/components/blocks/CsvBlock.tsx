"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";
import { downloadFile } from "@/lib/browser";
import { CopyButton } from "../CopyButton";

function parseCsv(text: string): string[][] {
  const firstLine = text.split("\n", 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** CSV-Export eines Agenten (z. B. Redaktionsplan) mit Tabellenvorschau und Download. */
export function CsvBlock({ csv, filename = "export.csv" }: { csv: string; filename?: string }) {
  const rows = useMemo(() => parseCsv(csv), [csv]);
  const [head, ...body] = rows;
  return (
    <div className="not-prose my-4 overflow-hidden rounded-2xl border border-cream-darker bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-cream-darker bg-cream/60 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-anthracite/60">CSV-Export · {body.length} Zeilen</span>
        <div className="ml-auto flex gap-1.5">
          <button className="btn-secondary btn-sm" onClick={() => downloadFile(filename, "﻿" + csv, "text/csv;charset=utf-8")}>
            <Download className="h-3.5 w-3.5" /> .csv
          </button>
          <CopyButton text={csv} />
        </div>
      </div>
      {head && (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-cream-dark">
              <tr>
                {head.map((h, i) => (
                  <th key={i} className="border-b border-cream-darker px-2 py-1.5 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.slice(0, 100).map((r, i) => (
                <tr key={i} className="odd:bg-cream/30">
                  {head.map((_, j) => (
                    <td key={j} className="border-b border-cream-dark px-2 py-1.5 align-top">
                      {r[j] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
