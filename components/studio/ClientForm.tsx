"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { BRANCHEN_BEISPIELE } from "@/lib/studio/clients";
import {
  CAPTION_STYLE_LABEL,
  GOAL_LABEL,
  PLATFORM_LABEL,
  type CaptionStyleId,
  type Client,
  type Goal,
  type Platform,
  type Region,
} from "@/lib/studio/types";
import { Btn, Card, Field, Select, TextArea, TextInput, Toggle, cx } from "./ui";

export function ClientForm({
  initial,
  onSave,
  onCancel,
  saveLabel = "Speichern",
}: {
  initial: Client;
  onSave: (client: Client) => Promise<void> | void;
  onCancel?: () => void;
  saveLabel?: string;
}) {
  const [c, setC] = useState<Client>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Client>(key: K, value: Client[K]) => setC((prev) => ({ ...prev, [key]: value }));
  const valid = c.name.trim() && c.branche.trim() && c.plattformen.length > 0;

  const togglePlatform = (p: Platform) =>
    set("plattformen", c.plattformen.includes(p) ? c.plattformen.filter((x) => x !== p) : [...c.plattformen, p]);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        try {
          await onSave({ ...c, name: c.name.trim(), branche: c.branche.trim() });
        } finally {
          setBusy(false);
        }
      }}
    >
      <Card>
        <h3 className="mb-4 font-serif text-lg font-semibold">Wer ist der Kunde?</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name des Betriebs">
            {(id) => (
              <TextInput id={id} required value={c.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Dachdeckerei Müller" />
            )}
          </Field>
          <Field label="Beruf / Branche" hint="So konkret wie möglich – danach sucht die Software die Konkurrenz.">
            {(id) => (
              <>
                <TextInput
                  id={id}
                  required
                  list={`${id}-list`}
                  value={c.branche}
                  onChange={(e) => set("branche", e.target.value)}
                  placeholder="z. B. Dachdecker"
                />
                <datalist id={`${id}-list`}>
                  {BRANCHEN_BEISPIELE.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label="Zielgruppe" hint='Wen sollen die Videos erreichen? "alle" ist erlaubt.'>
            {(id) => (
              <TextInput id={id} value={c.zielgruppe} onChange={(e) => set("zielgruppe", e.target.value)} placeholder="z. B. Hausbesitzer 35–65" />
            )}
          </Field>
          <Field label="Ziel der Videos">
            {(id) => (
              <Select id={id} value={c.ziel} onChange={(e) => set("ziel", e.target.value as Goal)}>
                {Object.entries(GOAL_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Stadt">
            {(id) => <TextInput id={id} value={c.stadt} onChange={(e) => set("stadt", e.target.value)} placeholder="z. B. Gütersloh" />}
          </Field>
          <Field label="Land">
            {(id) => (
              <Select id={id} value={c.region} onChange={(e) => set("region", e.target.value as Region)}>
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
              </Select>
            )}
          </Field>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/60">Plattformen</p>
          <div className="flex flex-wrap gap-2">
            {(["tiktok", "instagram"] as Platform[]).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => togglePlatform(p)}
                aria-pressed={c.plattformen.includes(p)}
                className={cx(
                  "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                  c.plattformen.includes(p)
                    ? "border-terracotta bg-terracotta/15 text-cream"
                    : "border-cream/10 text-cream/55 hover:border-cream/30",
                )}
              >
                {PLATFORM_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-serif text-lg font-semibold">Marke & Stimme</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Besonderheiten / USP" className="sm:col-span-2">
            {(id) => (
              <TextArea
                id={id}
                value={c.usp}
                onChange={(e) => set("usp", e.target.value)}
                placeholder="z. B. Familienbetrieb in 3. Generation, 24h-Notdienst, spezialisiert auf Flachdächer"
              />
            )}
          </Field>
          <Field label="Tonalität">
            {(id) => <TextInput id={id} value={c.tonalitaet} onChange={(e) => set("tonalitaet", e.target.value)} />}
          </Field>
          <Field label="Standard-Call-to-Action">
            {(id) => (
              <TextInput id={id} value={c.cta} onChange={(e) => set("cta", e.target.value)} placeholder="z. B. Link in Bio – kostenloser Dach-Check" />
            )}
          </Field>
          <Field label="Eigener TikTok-Account">
            {(id) => (
              <TextInput
                id={id}
                value={c.handles.tiktok}
                onChange={(e) => set("handles", { ...c.handles, tiktok: e.target.value })}
                placeholder="@account (optional)"
              />
            )}
          </Field>
          <Field label="Eigener Instagram-Account">
            {(id) => (
              <TextInput
                id={id}
                value={c.handles.instagram}
                onChange={(e) => set("handles", { ...c.handles, instagram: e.target.value })}
                placeholder="@account (optional)"
              />
            )}
          </Field>
          <Field label="Notizen für die KI" className="sm:col-span-2" hint="Alles, was die KI wissen sollte: Tabus, Preise, Aktionen, Saison.">
            {(id) => <TextArea id={id} value={c.notizen} onChange={(e) => set("notizen", e.target.value)} />}
          </Field>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-serif text-lg font-semibold">Brand-Kit für Videos</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Markenfarbe">
            {(id) => (
              <input
                id={id}
                type="color"
                value={c.brand.primary}
                onChange={(e) => set("brand", { ...c.brand, primary: e.target.value })}
                className="h-11 w-full cursor-pointer rounded-xl border border-cream/10 bg-ink-900 p-1"
              />
            )}
          </Field>
          <Field label="Akzent / Textfarbe">
            {(id) => (
              <input
                id={id}
                type="color"
                value={c.brand.accent}
                onChange={(e) => set("brand", { ...c.brand, accent: e.target.value })}
                className="h-11 w-full cursor-pointer rounded-xl border border-cream/10 bg-ink-900 p-1"
              />
            )}
          </Field>
          <Field label="Untertitel-Stil">
            {(id) => (
              <Select
                id={id}
                value={c.brand.captionStyle}
                onChange={(e) => set("brand", { ...c.brand, captionStyle: e.target.value as CaptionStyleId })}
              >
                {Object.entries(CAPTION_STYLE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {c.brand.logo ? (
            // Data-URL aus lokalem Upload – kein Remote-Bild, daher <img>.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.brand.logo} alt="Logo" className="h-14 w-14 rounded-lg bg-ink-700 object-contain p-1" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink-700 text-cream/30">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
          <label className="cursor-pointer rounded-xl bg-ink-600 px-4 py-2.5 text-sm font-semibold hover:bg-ink-500">
            Logo hochladen
            <input
              type="file"
              accept="image/png,image/svg+xml,image/webp,image/jpeg"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const dataUrl = await resizeLogo(file);
                set("brand", { ...c.brand, logo: dataUrl });
              }}
            />
          </label>
          {c.brand.logo && (
            <Btn variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => set("brand", { ...c.brand, logo: undefined })}>
              Entfernen
            </Btn>
          )}
          <Toggle
            checked={c.brand.watermark}
            onChange={(v) => set("brand", { ...c.brand, watermark: v })}
            label="Logo als Wasserzeichen"
            hint="Dezent oben rechts in jedem Video"
          />
        </div>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <Btn variant="ghost" onClick={onCancel}>
            Abbrechen
          </Btn>
        )}
        <Btn type="submit" loading={busy} disabled={!valid}>
          {saveLabel}
        </Btn>
      </div>
    </form>
  );
}

/** Verkleinert ein Logo auf max. 256 px und speichert es als PNG-Data-URL. */
async function resizeLogo(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // z. B. SVG ohne feste Größe: über ein <img> laden.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      bitmap = await createImageBitmap(img, { resizeWidth: 256, resizeHeight: 256, resizeQuality: "high" });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
