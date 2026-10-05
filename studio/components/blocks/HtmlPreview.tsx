"use client";

import { Code, Download, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { downloadFile } from "@/lib/browser";
import { CopyButton } from "../CopyButton";

/** Live-Vorschau einer kompletten HTML-Seite (isoliert im Sandbox-iframe). */
export function HtmlPreview({ html, filename = "seite.html" }: { html: string; filename?: string }) {
  const [view, setView] = useState<"vorschau" | "code">("vorschau");
  const [device, setDevice] = useState<"mobil" | "desktop">("desktop");
  const lines = useMemo(() => html.split("\n").length, [html]);

  function openInTab() {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="not-prose my-4 overflow-hidden rounded-2xl border border-cream-darker bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-cream-darker bg-cream/60 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-anthracite/60">Website-Vorschau</span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-lg border border-cream-darker bg-white p-0.5">
            <button className={`rounded-md px-2 py-1 text-xs ${view === "vorschau" ? "bg-anthracite text-cream" : ""}`} onClick={() => setView("vorschau")}>
              Vorschau
            </button>
            <button className={`rounded-md px-2 py-1 text-xs ${view === "code" ? "bg-anthracite text-cream" : ""}`} onClick={() => setView("code")}>
              <Code className="inline h-3 w-3" /> Code ({lines} {lines === 1 ? "Zeile" : "Zeilen"})
            </button>
          </div>
          {view === "vorschau" && (
            <div className="flex rounded-lg border border-cream-darker bg-white p-0.5">
              <button aria-label="Mobilansicht" className={`rounded-md px-2 py-1 ${device === "mobil" ? "bg-anthracite text-cream" : ""}`} onClick={() => setDevice("mobil")}>
                <Smartphone className="h-3.5 w-3.5" />
              </button>
              <button aria-label="Desktopansicht" className={`rounded-md px-2 py-1 ${device === "desktop" ? "bg-anthracite text-cream" : ""}`} onClick={() => setDevice("desktop")}>
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button className="btn-secondary btn-sm" onClick={openInTab}>
            <ExternalLink className="h-3.5 w-3.5" /> Neuer Tab
          </button>
          <button className="btn-secondary btn-sm" onClick={() => downloadFile(filename, html, "text/html;charset=utf-8")}>
            <Download className="h-3.5 w-3.5" /> .html
          </button>
          <CopyButton text={html} label="Code" />
        </div>
      </div>
      {view === "vorschau" ? (
        <div className="flex justify-center bg-cream-dark/50 p-3">
          <iframe
            title="Website-Vorschau"
            srcDoc={html}
            sandbox="allow-scripts allow-forms allow-popups"
            className="h-[720px] rounded-lg border border-cream-darker bg-white shadow-sm transition-all"
            style={{ width: device === "mobil" ? 390 : "100%" }}
          />
        </div>
      ) : (
        <pre className="max-h-[720px] overflow-auto bg-anthracite p-4 text-xs leading-relaxed text-cream">
          <code>{html}</code>
        </pre>
      )}
    </div>
  );
}
