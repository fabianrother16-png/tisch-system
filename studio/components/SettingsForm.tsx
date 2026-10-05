"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, LoaderCircle, Save } from "lucide-react";
import { MODELS } from "@/lib/models";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings, monat }: { settings: Settings; monat: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...settings, team: settings.team.join(", ") });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exportMonat, setExportMonat] = useState(monat);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, team: form.team.split(",").map((t) => t.trim()).filter(Boolean) }),
    });
    setSaving(false);
    setMessage(res.ok ? "Gespeichert." : "Speichern fehlgeschlagen.");
    router.refresh();
  }

  return (
    <>
      <section className="card space-y-4 p-4 md:p-5">
        <h2 className="h-section">Agentur</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label" htmlFor="agenturName">Name</label>
            <input id="agenturName" className="input" value={form.agenturName} onChange={(e) => set("agenturName", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="agenturOrt">Sitz</label>
            <input id="agenturOrt" className="input" value={form.agenturOrt} onChange={(e) => set("agenturOrt", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="agenturWebsite">Website</label>
            <input id="agenturWebsite" className="input" value={form.agenturWebsite} onChange={(e) => set("agenturWebsite", e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="label" htmlFor="team">Team (Namen, mit Komma getrennt)</label>
            <input id="team" className="input" placeholder="z. B. Fabian, Jonas" value={form.team} onChange={(e) => set("team", e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="label" htmlFor="agenturInfo">Was alle Agenten über euch wissen sollen</label>
            <textarea
              id="agenturInfo"
              className="input min-h-[110px]"
              placeholder="z. B. Equipment (Drohne DJI …, POV-Kamera), Einzugsgebiet, Arbeitsweise, Referenzen, was ihr nicht anbietet …"
              value={form.agenturInfo}
              onChange={(e) => set("agenturInfo", e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className="label" htmlFor="preisliste">Preisliste & Pakete (für Angebote)</label>
            <textarea
              id="preisliste"
              className="input min-h-[110px]"
              placeholder={"z. B.\nStarter: … €/Monat – Google-Profil, 4 Beiträge, Bewertungsantworten, Bericht\nDrehtag (4 h, Drohne + POV): … €\nOne-Pager-Website: ab … €"}
              value={form.preisliste}
              onChange={(e) => set("preisliste", e.target.value)}
            />
            <p className="mt-1 text-xs text-anthracite/55">Leer lassen = der Akquise-Agent setzt in Angeboten Platzhalter statt Preise zu erfinden.</p>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-4 md:p-5">
        <h2 className="h-section">KI-Modell & Automationen</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="model">Modell für alle Agenten</label>
            <select id="model" className="input" value={form.model} onChange={(e) => set("model", e.target.value)}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} – {m.hinweis}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-anthracite/55">
              Preise je 1 Mio. Tokens (Ein-/Ausgabe): {MODELS.map((m) => `${m.label.replace("Claude ", "")} ${m.input}/${m.output} $`).join(" · ")}. Websuche: 1 Cent pro Suche.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="webhookUrl">Webhook-URL (Make, n8n, Zapier)</label>
            <input
              id="webhookUrl"
              className="input"
              placeholder="https://hook.eu1.make.com/…"
              value={form.webhookUrl}
              onChange={(e) => set("webhookUrl", e.target.value)}
            />
            <p className="mt-1 text-xs text-anthracite/55">Nur https. Empfängt Ergebnis + Kundenakte als JSON.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
          </button>
          {message && <span className="text-sm text-anthracite/70">{message}</span>}
        </div>
      </section>

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="h-section">Leistungsnachweis für die Buchhaltung</h2>
        <p className="text-sm text-anthracite/65">
          CSV mit allen freigegebenen und veröffentlichten Lieferungen eines Monats pro Kunde – als Grundlage für eure Rechnungen.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" className="input w-auto" value={exportMonat} onChange={(e) => setExportMonat(e.target.value)} aria-label="Monat" />
          <a className="btn-secondary" href={`/api/export/leistungen?monat=${exportMonat}`}>
            <Download className="h-4 w-4" /> Gelieferte Leistungen (.csv)
          </a>
          <a className="btn-ghost" href={`/api/export/leistungen?monat=${exportMonat}&alle=1`}>
            Alle Einträge des Monats
          </a>
        </div>
      </section>
    </>
  );
}
