"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Columns3, List, Plus, Search } from "lucide-react";
import { OUTPUT_STATUS_LABEL, formatDate } from "@/lib/labels";
import { SEGMENTS, getSegment } from "@/lib/segments";
import { OUTPUT_STATUS, type Output, type OutputStatus, type SegmentSlug } from "@/lib/types";
import { SegmentIcon } from "./SegmentIcon";
import { StatusBadge } from "./StatusBadge";
import { useStudio } from "./StudioContext";

type Row = Omit<Output, "content" | "versionen"> & { hasContent: boolean };

export function OutputBoard({ clients, outputs, initialStatus }: { clients: { id: string; name: string }[]; outputs: Row[]; initialStatus?: string }) {
  const router = useRouter();
  const { team } = useStudio();
  const [view, setView] = useState<"board" | "liste">("board");
  const [clientId, setClientId] = useState("");
  const [segment, setSegment] = useState<SegmentSlug | "">("");
  const [person, setPerson] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OutputStatus | "">((OUTPUT_STATUS as readonly string[]).includes(initialStatus ?? "") ? (initialStatus as OutputStatus) : "");
  const [creating, setCreating] = useState(false);
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  const filtered = useMemo(
    () =>
      outputs.filter(
        (o) =>
          (!clientId || o.clientId === clientId) &&
          (!segment || o.segment === segment) &&
          (!person || o.zustaendig === person) &&
          (!status || o.status === status) &&
          (!q || `${o.title} ${clientName.get(o.clientId ?? "") ?? ""}`.toLowerCase().includes(q.toLowerCase())),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outputs, clientId, segment, person, status, q],
  );

  async function setOutputStatus(id: string, next: OutputStatus) {
    await fetch(`/api/outputs/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) });
    router.refresh();
  }

  async function createTask() {
    const title = window.prompt("Titel der neuen Aufgabe:");
    if (!title?.trim()) return;
    setCreating(true);
    const res = await fetch("/api/outputs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, segment: segment || "strategie", clientId: clientId || null, zustaendig: person }),
    });
    setCreating(false);
    if (res.ok) {
      const o = (await res.json()) as Output;
      router.push(`/ergebnisse/${o.id}`);
    }
  }

  const card = (o: Row) => (
    <div key={o.id} className="rounded-xl border border-cream-darker bg-white p-3 shadow-sm">
      <Link href={`/ergebnisse/${o.id}`} className="block">
        <div className="flex items-start gap-2">
          <SegmentIcon slug={o.segment} className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
          <span className="text-sm font-medium leading-snug hover:text-terracotta-dark">{o.title}</span>
        </div>
        <div className="mt-1.5 text-[11px] text-anthracite/55">
          {[clientName.get(o.clientId ?? "") ?? "ohne Kunde", o.geplantAm ? formatDate(o.geplantAm) : null, o.zustaendig].filter(Boolean).join(" · ")}
        </div>
        {o.kundenFeedback.length > 0 && o.kundenFeedback.at(-1)!.entscheidung === "aenderung" && (
          <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-900">Kunde wünscht Änderungen</div>
        )}
      </Link>
      <select
        className="mt-2 w-full rounded-lg border border-cream-dark bg-cream/40 px-2 py-1 text-[11px]"
        value={o.status}
        onChange={(e) => setOutputStatus(o.id, e.target.value as OutputStatus)}
        aria-label="Status ändern"
      >
        {OUTPUT_STATUS.map((s) => (
          <option key={s} value={s}>
            {OUTPUT_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-anthracite/40" />
          <input className="input pl-9" placeholder="Suchen …" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Kunde">
          <option value="">Alle Kunden</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={segment} onChange={(e) => setSegment(e.target.value as SegmentSlug | "")} aria-label="Segment">
          <option value="">Alle Segmente</option>
          {SEGMENTS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.label}
            </option>
          ))}
        </select>
        {team.length > 0 && (
          <select className="input w-auto" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Zuständig">
            <option value="">Alle Personen</option>
            {team.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        {view === "liste" && (
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as OutputStatus | "")} aria-label="Status">
            <option value="">Alle Status</option>
            {OUTPUT_STATUS.map((s) => (
              <option key={s} value={s}>
                {OUTPUT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        )}
        <div className="flex rounded-xl border border-cream-darker bg-white p-0.5">
          <button className={`rounded-lg px-2.5 py-1.5 ${view === "board" ? "bg-anthracite text-cream" : ""}`} onClick={() => setView("board")} aria-label="Board-Ansicht">
            <Columns3 className="h-4 w-4" />
          </button>
          <button className={`rounded-lg px-2.5 py-1.5 ${view === "liste" ? "bg-anthracite text-cream" : ""}`} onClick={() => setView("liste")} aria-label="Listen-Ansicht">
            <List className="h-4 w-4" />
          </button>
        </div>
        <button className="btn-primary" onClick={createTask} disabled={creating}>
          <Plus className="h-4 w-4" /> Aufgabe
        </button>
      </div>

      {view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {OUTPUT_STATUS.map((s) => {
            const items = filtered.filter((o) => o.status === s);
            return (
              <div key={s} className="w-[270px] shrink-0 rounded-2xl bg-cream-dark/60 p-2">
                <div className="flex items-center justify-between px-1.5 py-1.5">
                  <StatusBadge status={s} />
                  <span className="text-xs font-semibold text-anthracite/50">{items.length}</span>
                </div>
                <div className="space-y-2">{items.map(card)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card divide-y divide-cream-dark">
          {filtered.length === 0 && <p className="p-4 text-sm text-anthracite/55">Keine Ergebnisse für diese Filter.</p>}
          {filtered.map((o) => (
            <Link key={o.id} href={`/ergebnisse/${o.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-cream/50">
              <SegmentIcon slug={o.segment} className="h-4 w-4 text-terracotta" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{o.title}</span>
                <span className="block text-xs text-anthracite/55">
                  {[clientName.get(o.clientId ?? "") ?? "ohne Kunde", getSegment(o.segment)?.label, `erstellt ${formatDate(o.createdAt)}`, o.geplantAm ? `geplant ${formatDate(o.geplantAm)}` : null, o.zustaendig]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <StatusBadge status={o.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
