"use client";

import { CheckCircle2, Download, ExternalLink, Upload, XCircle } from "lucide-react";
import { useState } from "react";
import { exportBackup, importBackup, type Backup } from "@/lib/studio/db";
import { useStudioStatus } from "./StudioShell";
import { Btn, Card, ErrorNote, SectionTitle } from "./ui";

const SERVICES = [
  {
    key: "claude" as const,
    env: "ANTHROPIC_API_KEY",
    name: "Claude (Anthropic)",
    what: "Konkurrenzanalyse, Skripte, Trend-Recherche im Web, Schnittplan, Viral-Rating, Hashtags.",
    link: "https://console.anthropic.com/settings/keys",
  },
  {
    key: "apify" as const,
    env: "APIFY_API_TOKEN",
    name: "Apify",
    what: "Echte TikTok- und Instagram-Daten: Suche, Profile, Aufrufe, Likes, Sounds, Transkripte.",
    link: "https://console.apify.com/settings/integrations",
  },
  {
    key: "elevenlabs" as const,
    env: "ELEVENLABS_API_KEY",
    name: "ElevenLabs",
    what: "Sprecherstimme für KI-Videos und automatische Untertitel (Transkription) für eigene Clips.",
    link: "https://elevenlabs.io/app/settings/api-keys",
  },
  {
    key: "fal" as const,
    env: "FAL_KEY",
    name: "fal.ai",
    what: "KI-Videoszenen (Veo 3.1, Kling 3) für Videos komplett ohne eigenes Filmmaterial.",
    link: "https://fal.ai/dashboard/keys",
  },
];

export function SettingsPage() {
  const { status } = useStudioStatus();
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SectionTitle eyebrow="Einstellungen" title="Dienste & Daten" />

      <Card>
        <h2 className="font-serif text-lg font-semibold">Verbundene Dienste</h2>
        <p className="mt-1 text-sm text-cream/55">
          Schlüssel werden als Umgebungsvariablen auf dem Server hinterlegt (Vercel → Project → Settings → Environment Variables, lokal in{" "}
          <code className="rounded bg-ink-700 px-1">.env.local</code>). Sie verlassen nie den Server.
        </p>
        <ul className="mt-5 divide-y divide-cream/[0.06]">
          {SERVICES.map((s) => {
            const ok = status?.[s.key];
            return (
              <li key={s.key} className="flex flex-wrap items-start gap-3 py-4">
                {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" /> : <XCircle className="mt-0.5 h-5 w-5 text-red-400" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {s.name} <code className="ml-1 rounded bg-ink-700 px-1.5 py-0.5 text-xs text-cream/70">{s.env}</code>
                  </p>
                  <p className="text-sm text-cream/55">{s.what}</p>
                </div>
                <a href={s.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-terracotta-light hover:underline">
                  Schlüssel holen <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            );
          })}
          <li className="flex flex-wrap items-start gap-3 py-4">
            {status?.passwordRequired ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 text-amber-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                Zugangsschutz <code className="ml-1 rounded bg-ink-700 px-1.5 py-0.5 text-xs text-cream/70">STUDIO_PASSWORD</code>
              </p>
              <p className="text-sm text-cream/55">
                Schützt alle kostenpflichtigen Funktionen. Online ist das Passwort Pflicht, lokal in der Entwicklung optional.
              </p>
            </div>
          </li>
        </ul>
        {status && (
          <p className="mt-2 text-xs text-cream/40">
            KI-Modell: <code>{status.model}</code> (änderbar über <code>STUDIO_MODEL</code>)
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-serif text-lg font-semibold">Datensicherung</h2>
        <p className="mt-1 text-sm text-cream/55">
          Kunden, Recherchen, Pläne und Videoprojekte liegen lokal in diesem Browser. Exportiere sie regelmäßig oder zum Umzug auf ein
          anderes Gerät. Videodateien sind nicht enthalten, die fertigen Videos bitte separat herunterladen.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Btn
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            onClick={async () => {
              const data = await exportBackup();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `sichtwerk-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }}
          >
            Backup exportieren
          </Btn>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-ink-600 px-4 py-2.5 text-sm font-semibold hover:bg-ink-500">
            <Upload className="h-4 w-4" /> Backup importieren
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImportError(null);
                setImported(false);
                try {
                  await importBackup(JSON.parse(await file.text()) as Backup);
                  setImported(true);
                } catch (err) {
                  setImportError(err instanceof Error ? err.message : "Import fehlgeschlagen.");
                }
              }}
            />
          </label>
        </div>
        {imported && <p className="mt-3 text-sm text-emerald-300">Import erfolgreich.</p>}
        {importError && (
          <div className="mt-3">
            <ErrorNote>{importError}</ErrorNote>
          </div>
        )}
      </Card>
    </div>
  );
}
