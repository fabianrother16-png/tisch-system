"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarPlus, CircleAlert, LoaderCircle, PenLine, Play, Rocket } from "lucide-react";
import { currentMonth, formatDate } from "@/lib/labels";
import { getPaket, monatLabel } from "@/lib/pakete";
import type { OutputStatus, PaketId, SegmentSlug } from "@/lib/types";
import { RunView } from "./RunView";
import { SegmentIcon } from "./SegmentIcon";
import { StatusBadge } from "./StatusBadge";
import { useAgentRun } from "./useAgentRun";

interface Task {
  id: string;
  title: string;
  segment: SegmentSlug;
  status: OutputStatus;
  geplantAm: string | null;
  prompt: string;
}

const needsInput = (t: Task) => /\[[^\]]*(einfügen|hier)[^\]]*\]/i.test(t.prompt);

/**
 * Monats-Autopilot: legt die Paket-Lieferungen eines Monats als Aufgaben an
 * und erzeugt auf Wunsch alle, die keine Eingabe brauchen, nacheinander.
 */
export function AutopilotPanel({ clientId, paket, tasks }: { clientId: string; paket: PaketId; tasks: Task[] }) {
  const router = useRouter();
  const [monat, setMonat] = useState(currentMonth());
  const [preparing, setPreparing] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [queue, setQueue] = useState<{ current: string | null; done: string[]; failed: string[] }>({ current: null, done: [], failed: [] });
  const run = useAgentRun();

  const monthTasks = useMemo(
    () => tasks.filter((t) => t.geplantAm?.startsWith(monat)).sort((a, b) => (a.geplantAm ?? "").localeCompare(b.geplantAm ?? "")),
    [tasks, monat],
  );
  const runnable = monthTasks.filter((t) => t.status === "offen" && !needsInput(t));
  const busy = queue.current !== null;

  async function prepare() {
    setPreparing(true);
    setInfo(null);
    const res = await fetch(`/api/clients/${clientId}/monat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ monat }),
    });
    const data = (await res.json()) as { angelegt?: number; uebersprungen?: number; error?: string };
    setPreparing(false);
    setInfo(res.ok ? `${data.angelegt} Aufgaben angelegt${data.uebersprungen ? `, ${data.uebersprungen} gab es schon` : ""}.` : (data.error ?? "Fehler"));
    router.refresh();
  }

  async function runAll() {
    const list = [...runnable];
    const done: string[] = [];
    const failed: string[] = [];
    for (const t of list) {
      setQueue({ current: t.id, done: [...done], failed: [...failed] });
      const result = await run.start({ segment: t.segment, clientId, prompt: t.prompt, outputId: t.id, title: t.title });
      if (result) done.push(t.id);
      else failed.push(t.id);
      router.refresh();
    }
    setQueue({ current: null, done, failed });
  }

  return (
    <section className="card p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="h-section flex items-center gap-2">
            <Rocket className="h-5 w-5 text-terracotta" /> Monats-Autopilot
          </h2>
          <p className="mt-1 max-w-xl text-sm text-anthracite/60">
            Legt alle wiederkehrenden Lieferungen aus dem Paket „{getPaket(paket)?.label}“ für den Monat an – und erzeugt sie auf Knopfdruck nacheinander.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" className="input w-auto" value={monat} onChange={(e) => setMonat(e.target.value)} aria-label="Monat" disabled={busy} />
          <button className="btn-secondary" onClick={prepare} disabled={preparing || busy}>
            {preparing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            {monatLabel(monat)} vorbereiten
          </button>
          <button className="btn-primary" onClick={runAll} disabled={busy || runnable.length === 0}>
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Alle offenen erzeugen ({runnable.length})
          </button>
        </div>
      </div>
      {info && <p className="mt-2 text-sm text-emerald-700">{info}</p>}
      {paket === "individuell" && monthTasks.length === 0 && (
        <p className="mt-2 text-xs text-anthracite/55">Beim Paket „Individuell“ werden die Standard-Aufgaben der gebuchten Segmente angelegt.</p>
      )}

      {monthTasks.length > 0 && (
        <ul className="mt-4 divide-y divide-cream-dark">
          {monthTasks.map((t) => {
            const isCurrent = queue.current === t.id;
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <SegmentIcon slug={t.segment} className="h-4 w-4 shrink-0 text-anthracite/60" />
                <Link href={`/ergebnisse/${t.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-terracotta-dark">
                  {t.title}
                  <span className="block text-[11px] font-normal text-anthracite/50">geplant {formatDate(t.geplantAm)}</span>
                </Link>
                {isCurrent && <LoaderCircle className="h-4 w-4 animate-spin text-terracotta" />}
                {queue.failed.includes(t.id) && <CircleAlert className="h-4 w-4 text-red-700" />}
                {t.status === "offen" && needsInput(t) && (
                  <Link href={`/segment/${t.segment}?aufgabe=${t.id}`} className="btn-secondary btn-sm">
                    <PenLine className="h-3.5 w-3.5" /> Eingabe nötig
                  </Link>
                )}
                {t.status === "offen" && !needsInput(t) && !isCurrent && (
                  <Link href={`/segment/${t.segment}?aufgabe=${t.id}`} className="btn-ghost btn-sm">
                    <Play className="h-3.5 w-3.5" /> Einzeln
                  </Link>
                )}
                <StatusBadge status={t.status} />
              </li>
            );
          })}
        </ul>
      )}

      {busy && (
        <div className="mt-4">
          <RunView state={run.state} />
        </div>
      )}
    </section>
  );
}
