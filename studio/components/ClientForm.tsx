"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Save, Sparkles } from "lucide-react";
import { extractJson } from "@/lib/browser";
import { CLIENT_STATUS_LABEL } from "@/lib/labels";
import { PAKETE } from "@/lib/pakete";
import { SEGMENTS } from "@/lib/segments";
import { CLIENT_STATUS, CLIENT_TEXT_FIELDS, type Client, type SegmentSlug } from "@/lib/types";
import { RunView } from "./RunView";
import { useAgentRun } from "./useAgentRun";

type TextField = (typeof CLIENT_TEXT_FIELDS)[number];
type FormState = Record<TextField, string> & Pick<Client, "status" | "paket" | "leistungen">;

const GROUPS: { title: string; fields: { key: TextField; label: string; long?: boolean; placeholder?: string }[] }[] = [
  {
    title: "Basis",
    fields: [
      { key: "name", label: "Name des Betriebs *" },
      { key: "branche", label: "Branche", placeholder: "z. B. Restaurant (italienisch), Dachdecker, Physiotherapie" },
      { key: "ort", label: "Ort / Einzugsgebiet", placeholder: "z. B. Gütersloh, Kreis Gütersloh" },
      { key: "ansprechpartner", label: "Ansprechpartner", placeholder: "Name, Rolle, bevorzugter Kontaktweg" },
    ],
  },
  {
    title: "Online-Präsenz",
    fields: [
      { key: "website", label: "Website", placeholder: "https://…" },
      { key: "googleProfil", label: "Google-Unternehmensprofil", placeholder: "Maps-Link oder exakter Name" },
      { key: "instagram", label: "Instagram", placeholder: "@account" },
      { key: "tiktok", label: "TikTok", placeholder: "@account" },
      { key: "facebook", label: "Facebook" },
      { key: "linkedin", label: "LinkedIn" },
    ],
  },
  {
    title: "Marke & Angebot",
    fields: [
      { key: "angebot", label: "Angebot / Leistungen / Produkte", long: true },
      { key: "zielgruppe", label: "Zielgruppe", long: true, placeholder: "Wer kauft/bucht? Alter, Situation, Motive, Einwände" },
      { key: "usp", label: "Besonderheiten (USP)", long: true },
      { key: "tonalitaet", label: "Tonalität & Ansprache", placeholder: "z. B. herzlich, regional, „du“, kein Fachchinesisch" },
      { key: "farben", label: "Farben & Gestaltung", placeholder: "z. B. Dunkelgrün #1F3D2B, Creme, Serifenschrift" },
      { key: "dosDonts", label: "Dos & Don'ts", long: true, placeholder: "Was immer/nie gesagt oder gezeigt werden soll" },
    ],
  },
  {
    title: "Markt",
    fields: [
      { key: "wettbewerber", label: "Wettbewerber", long: true },
      { key: "keywords", label: "Wichtige Suchbegriffe", long: true, placeholder: "z. B. pizza gütersloh, mittagstisch gütersloh" },
      { key: "notizen", label: "Notizen", long: true },
    ],
  },
];

function toForm(c?: Client): FormState {
  const base = Object.fromEntries(CLIENT_TEXT_FIELDS.map((f) => [f, c?.[f] ?? ""])) as Record<TextField, string>;
  return { ...base, status: c?.status ?? "onboarding", paket: c?.paket ?? "starter", leistungen: c?.leistungen ?? [] };
}

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(client));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const research = useAgentRun();
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const set = (key: keyof FormState, value: string | string[]) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (!form.name.trim()) {
      setMessage({ ok: false, text: "Bitte einen Namen angeben." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const res = await fetch(client ? `/api/clients/${client.id}` : "/api/clients", {
      method: client ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as Client & { error?: string };
    setSaving(false);
    if (!res.ok) {
      setMessage({ ok: false, text: data.error ?? "Speichern fehlgeschlagen." });
      return;
    }
    if (client) {
      setMessage({ ok: true, text: "Gespeichert." });
      router.refresh();
    } else {
      router.push(`/kunden/${data.id}`);
    }
  }

  async function recherchieren() {
    if (!form.name.trim()) {
      setMessage({ ok: false, text: "Für die Recherche mindestens den Namen eintragen (am besten auch Ort und Website)." });
      return;
    }
    setMessage(null);
    const angaben = [`Name: ${form.name}`, form.ort && `Ort: ${form.ort}`, form.website && `Website: ${form.website}`, form.branche && `Branche: ${form.branche}`]
      .filter(Boolean)
      .join("\n");
    const result = await research.start({
      mode: "kundenakte",
      clientId: client?.id ?? null,
      prompt: `Recherchiere diesen Betrieb gründlich (Website, Google-Profil und Bewertungen, Instagram/TikTok/Facebook, lokale Wettbewerber) und liefere die Kundenakte als JSON.\n\n${angaben}`,
    });
    if (!result) return;
    const data = extractJson<Partial<Record<TextField, unknown>>>(result.content);
    if (!data) {
      setMessage({ ok: false, text: "Die Recherche hat kein auswertbares JSON geliefert – Ergebnis siehe unten." });
      return;
    }
    // Nur leere Felder füllen – Eingaben, die während der Recherche gemacht wurden, bleiben erhalten.
    const current = formRef.current;
    const next = { ...current };
    let filled = 0;
    for (const key of CLIENT_TEXT_FIELDS) {
      const v = data[key];
      if (typeof v === "string" && v.trim() && !current[key].trim()) {
        next[key] = v.trim();
        filled++;
      }
    }
    setForm(next);
    setMessage({ ok: true, text: `${filled} Felder vorausgefüllt – bitte prüfen und speichern.` });
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex-1 text-sm">
          <div className="font-semibold">Kundenakte per KI recherchieren</div>
          <div className="text-anthracite/60">Füllt leere Felder aus öffentlich verfügbaren Infos. Dauert 1–3 Minuten.</div>
        </div>
        <button className="btn-dark" onClick={recherchieren} disabled={research.state.status === "running"}>
          {research.state.status === "running" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Mit KI recherchieren
        </button>
      </div>
      {research.state.status !== "idle" && (research.state.status !== "done" || message?.ok === false) && <RunView state={research.state} onCancel={research.cancel} />}

      {GROUPS.map((g) => (
        <fieldset key={g.title} className="card p-4 md:p-5">
          <legend className="sr-only">{g.title}</legend>
          <h2 className="h-section mb-4">{g.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key} className={f.long ? "md:col-span-2" : ""}>
                <label className="label" htmlFor={f.key}>
                  {f.label}
                </label>
                {f.long ? (
                  <textarea
                    id={f.key}
                    className="input min-h-[84px] resize-y"
                    value={form[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : (
                  <input id={f.key} className="input" value={form[f.key]} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
                )}
              </div>
            ))}
            {g.title === "Basis" && (
              <>
                <div>
                  <label className="label" htmlFor="status">
                    Status
                  </label>
                  <select id="status" className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                    {CLIENT_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {CLIENT_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="paket">
                    Paket
                  </label>
                  <select id="paket" className="input" value={form.paket} onChange={(e) => set("paket", e.target.value)}>
                    {PAKETE.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} – {p.beschreibung}
                      </option>
                    ))}
                  </select>
                </div>
                {form.paket === "individuell" && (
                  <div className="md:col-span-2">
                    <div className="label">Gebuchte Leistungen</div>
                    <div className="flex flex-wrap gap-2">
                      {SEGMENTS.filter((s) => !s.ohneKunde && s.slug !== "qualitaet").map((s) => {
                        const on = form.leistungen.includes(s.slug);
                        return (
                          <label key={s.slug} className={`chip cursor-pointer ${on ? "border-terracotta bg-terracotta/10 text-terracotta-dark" : ""}`}>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={on}
                              onChange={() =>
                                set("leistungen", on ? form.leistungen.filter((l) => l !== s.slug) : [...form.leistungen, s.slug as SegmentSlug])
                              }
                            />
                            {s.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl border border-cream-darker bg-white/95 p-3 shadow-lg backdrop-blur">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {client ? "Kundenakte speichern" : "Kunden anlegen"}
        </button>
        {message && <span className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
