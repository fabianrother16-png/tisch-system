"use client";

import { useState } from "react";
import { CircleCheck, LoaderCircle, MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/labels";
import type { OutputStatus } from "@/lib/types";
import { LogoMark } from "./Logo";
import { Markdown } from "./Markdown";
import { StudioProvider } from "./StudioContext";

interface Props {
  token: string;
  title: string;
  content: string;
  clientName: string | null;
  agenturName: string;
  agenturWebsite: string;
  status: OutputStatus;
  letzteEntscheidung: { entscheidung: "freigegeben" | "aenderung"; createdAt: string } | null;
}

export function FreigabeView({ token, title, content, clientName, agenturName, agenturWebsite, status, letzteEntscheidung }: Props) {
  const [mode, setMode] = useState<"idle" | "aenderung">("idle");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"freigegeben" | "aenderung" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(entscheidung: "freigegeben" | "aenderung") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/freigabe/${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entscheidung, text }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json()) as { error?: string }).error ?? "Das hat leider nicht geklappt.");
      return;
    }
    setDone(entscheidung);
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-anthracite">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <LogoMark className="h-8 w-8" />
          <div className="font-serif text-lg font-semibold text-cream">{agenturName}</div>
          <span className="ml-auto text-xs text-cream/60">Freigabe{clientName ? ` für ${clientName}` : ""}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <p className="text-sm text-anthracite/60">Bitte prüfen Sie den folgenden Entwurf.</p>
          <h1 className="h-page mt-1">{title}</h1>
          {letzteEntscheidung && !done && (
            <p className="mt-2 text-xs text-anthracite/55">
              Letzte Rückmeldung: {letzteEntscheidung.entscheidung === "freigegeben" ? "freigegeben" : "Änderungswunsch"} am {formatDateTime(letzteEntscheidung.createdAt)}
            </p>
          )}
        </div>

        <article className="card p-5 md:p-8">
          <StudioProvider value={{ higgsfield: false, team: [], oeffentlich: true }}>
            <Markdown content={content} />
          </StudioProvider>
        </article>

        <div className="card p-5">
          {done ? (
            <div className="flex items-start gap-3">
              <CircleCheck className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <div className="font-semibold">{done === "freigegeben" ? "Vielen Dank – freigegeben!" : "Danke – wir kümmern uns um Ihre Änderungen."}</div>
                <p className="text-sm text-anthracite/65">Das Team von {agenturName} wurde benachrichtigt. Sie können dieses Fenster schließen.</p>
              </div>
            </div>
          ) : status === "freigegeben" || status === "veroeffentlicht" ? (
            <p className="text-sm text-anthracite/70">Dieser Entwurf ist bereits freigegeben. Vielen Dank!</p>
          ) : (
            <div className="space-y-3">
              <div className="font-semibold">Ihre Rückmeldung</div>
              {mode === "aenderung" && (
                <textarea
                  className="input min-h-[120px]"
                  placeholder="Was sollen wir ändern? Je konkreter, desto schneller."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  autoFocus
                />
              )}
              {error && <p className="text-sm text-red-700">{error}</p>}
              <div className="flex flex-wrap gap-2">
                {mode === "idle" ? (
                  <>
                    <button className="btn-primary" onClick={() => send("freigegeben")} disabled={busy}>
                      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheck className="h-4 w-4" />} Freigeben
                    </button>
                    <button className="btn-secondary" onClick={() => setMode("aenderung")} disabled={busy}>
                      <MessageSquare className="h-4 w-4" /> Änderungen wünschen
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-primary" onClick={() => send("aenderung")} disabled={busy || !text.trim()}>
                      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />} Änderungswunsch senden
                    </button>
                    <button className="btn-ghost" onClick={() => setMode("idle")} disabled={busy}>
                      Zurück
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <footer className="pb-8 text-center text-xs text-anthracite/45">
          {agenturName}
          {agenturWebsite && (
            <>
              {" · "}
              <a href={agenturWebsite} target="_blank" rel="noreferrer" className="hover:underline">
                {agenturWebsite.replace(/^https?:\/\//, "")}
              </a>
            </>
          )}
        </footer>
      </main>
    </div>
  );
}
