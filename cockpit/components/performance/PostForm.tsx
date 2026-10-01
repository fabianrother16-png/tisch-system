"use client";

import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Input, Select } from "@/components/ui/inputs";
import { PLATFORMS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/types";
import type { Post } from "@/lib/db/schema";

export function PostForm({ action, post, today }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; post?: Post; today: string }) {
  const p = post;
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Link zum Beitrag" name="url" className="sm:col-span-2">
          <Input name="url" defaultValue={p?.url ?? ""} placeholder="https://www.instagram.com/reel/…" autoFocus={!p} />
        </Field>
        <Field label="Plattform" name="platform">
          <Select name="platform" defaultValue={p?.platform ?? "instagram"} options={PLATFORMS.filter((x) => !["google", "website"].includes(x.value))} />
        </Field>
        <Field label="Veröffentlicht am" name="publishedAt" required>
          <Input type="date" name="publishedAt" defaultValue={p?.publishedAt?.slice(0, 10) ?? today} required />
        </Field>
        <Field label="Titel / Caption" name="caption" className="sm:col-span-2">
          <Input name="caption" defaultValue={p?.caption ?? ""} />
        </Field>
      </div>
      <div className="rounded-xl bg-surface-2 p-4">
        <p className="mb-3 text-xs font-semibold text-muted">Aktuelle Zahlen (aus der App des Kunden ablesen)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ["views", "Aufrufe"],
              ["reach", "Reichweite"],
              ["likes", "Likes"],
              ["comments", "Kommentare"],
              ["shares", "Geteilt"],
              ["saves", "Gespeichert"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label} name={k}>
              <Input type="number" min={0} name={k} defaultValue={p ? p[k] : ""} inputMode="numeric" />
            </Field>
          ))}
        </div>
      </div>
      <FormActions>
        <CancelButton />
        <SubmitButton>{p ? "Zahlen aktualisieren" : "Beitrag erfassen"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
