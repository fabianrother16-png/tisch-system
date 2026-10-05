import { Check, X } from "lucide-react";
import { SettingsForm } from "@/components/SettingsForm";
import { passwordConfigured } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { currentMonth } from "@/lib/labels";
import { getStore, storeIsEphemeral } from "@/lib/store";
import { higgsfieldConfigured } from "@/lib/tools/higgsfield";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen" };

export default async function EinstellungenPage() {
  const settings = await getSettings();
  const store = getStore();

  const integrationen = [
    {
      name: "Claude (Anthropic API)",
      ok: Boolean(process.env.ANTHROPIC_API_KEY),
      pflicht: true,
      text: "Das Gehirn aller Agenten inkl. Websuche und Webseiten-Abruf.",
      setup: "ANTHROPIC_API_KEY – Schlüssel unter platform.claude.com → API Keys erstellen.",
    },
    {
      name: "Passwortschutz",
      ok: passwordConfigured(),
      pflicht: true,
      text: "Pflicht, sobald das Studio online erreichbar ist. Freigabe-Links für Kunden bleiben ohne Login nutzbar.",
      setup: "STUDIO_PASSWORD – ein langes, zufälliges Passwort setzen.",
    },
    {
      name: store.kind === "upstash" ? "Speicher: Upstash Redis (geteilt)" : "Speicher: lokale Dateien (./data)",
      ok: !storeIsEphemeral(),
      pflicht: true,
      text:
        store.kind === "upstash"
          ? "Daten liegen in eurer Upstash-Datenbank – beide Gründer sehen denselben Stand."
          : "Daten liegen auf diesem Rechner im Ordner data/ (nicht im Git). Für gemeinsame Nutzung online Upstash verbinden.",
      setup: "UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (bei Vercel: Storage → Upstash for Redis).",
    },
    {
      name: "Apify – TikTok, Instagram, Google Maps",
      ok: Boolean(process.env.APIFY_TOKEN),
      text: "Live-Daten: Top-Videos zu Hashtags/Suchen, Instagram-Accounts, Google-Maps-Bewertungen von Kunden, Wettbewerbern und Leads.",
      setup: "APIFY_TOKEN – console.apify.com → Settings → API & Integrations. Abrechnung pro Ergebnis bei Apify.",
    },
    {
      name: "Google PageSpeed Insights",
      ok: Boolean(process.env.GOOGLE_API_KEY),
      text: "Website-Geschwindigkeit & Core Web Vitals. Läuft auch ohne Schlüssel, dann aber mit sehr kleinem Kontingent.",
      setup: "GOOGLE_API_KEY – Google Cloud Console → „PageSpeed Insights API“ aktivieren → API-Schlüssel.",
    },
    {
      name: "Higgsfield – KI-Video & KI-Bild",
      ok: higgsfieldConfigured(),
      text: "„Mit Higgsfield erzeugen“-Knopf an jedem KI-Prompt des Video-Agenten (Kling, Soul u. a.).",
      setup: "HIGGSFIELD_API_KEY_ID + HIGGSFIELD_API_KEY_SECRET – console.higgsfield.ai.",
    },
    {
      name: "Automationen (Make, n8n, Zapier)",
      ok: Boolean(settings.webhookUrl),
      text: "„An Automation senden“ schickt ein Ergebnis samt Kundenakte an eure Webhook-URL – von dort weiter in Google Drive, Planungstools, Slack oder die Buchhaltung.",
      setup: "Webhook-URL unten in den Agentur-Einstellungen eintragen.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="h-page">Einstellungen</h1>
        <p className="text-sm text-anthracite/60">Agentur-Angaben, Team, Modell und Verbindungen.</p>
      </div>

      <section className="space-y-3">
        <h2 className="h-section">Verbindungen</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {integrationen.map((i) => (
            <div key={i.name} className="card p-4">
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${i.ok ? "bg-emerald-100 text-emerald-700" : i.pflicht ? "bg-red-100 text-red-700" : "bg-cream-dark text-anthracite/50"}`}>
                  {i.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>
                <span className="font-semibold">{i.name}</span>
                {!i.ok && <span className="ml-auto text-[11px] text-anthracite/50">{i.pflicht ? "fehlt" : "optional"}</span>}
              </div>
              <p className="mt-2 text-sm text-anthracite/65">{i.text}</p>
              {!i.ok && <p className="mt-2 rounded-lg bg-cream px-2 py-1.5 font-mono text-[11px] text-anthracite/70">{i.setup}</p>}
            </div>
          ))}
        </div>
        <p className="text-xs text-anthracite/55">
          Schlüssel werden als Umgebungsvariablen gesetzt (lokal in <code>studio/.env</code>, online im Vercel-Projekt) – nie im Studio selbst gespeichert.
          Nach einer Änderung den Server neu starten bzw. neu deployen.
        </p>
      </section>

      <SettingsForm settings={settings} monat={currentMonth()} />
    </div>
  );
}
