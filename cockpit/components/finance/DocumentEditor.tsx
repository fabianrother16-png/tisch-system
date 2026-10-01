"use client";

import { useMemo, useState } from "react";
import { GripVertical, Plus, Trash2, BookOpen } from "lucide-react";
import { ActionForm, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/inputs";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { computeTotals, lineNet, type LineItem } from "@/lib/domain/totals";
import { TAX_RATES, UNITS } from "@/lib/constants";
import { centsToInput, eur, parseMoney, parseNumber } from "@/lib/format";
import { addDays } from "@/lib/dates";
import type { ActionState } from "@/lib/actions/types";

type Row = LineItem & { key: string; priceInput: string; qtyInput: string };

export type DocumentInitial = {
  customerId?: number | null;
  title: string;
  issueDate: string;
  validUntil?: string | null;
  serviceFrom?: string | null;
  serviceTo?: string | null;
  dueDate?: string | null;
  intro?: string | null;
  outro?: string | null;
  discountPercent: number;
  items: LineItem[];
};

let keySeq = 0;
const newKey = () => `r${++keySeq}`;

function toRow(i: LineItem): Row {
  return { ...i, key: newKey(), priceInput: centsToInput(i.unitPrice), qtyInput: String(i.quantity).replace(".", ",") };
}

export function DocumentEditor({
  kind,
  action,
  customers,
  services,
  initial,
  kleinunternehmer,
  defaultTaxRate,
  defaultPaymentDays,
}: {
  kind: "angebot" | "rechnung";
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  customers: { id: number; name: string; paymentTermDays: number | null }[];
  services: { id: number; name: string; description: string | null; unit: string; unitPrice: number; taxRate: number }[];
  initial: DocumentInitial;
  kleinunternehmer: boolean;
  defaultTaxRate: number;
  defaultPaymentDays: number;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.items.length
      ? initial.items.map(toRow)
      : [toRow({ title: "", description: "", quantity: 1, unit: "Pauschale", unitPrice: 0, taxRate: kleinunternehmer ? 0 : defaultTaxRate })],
  );
  const [discount, setDiscount] = useState(String(initial.discountPercent || "").replace(".", ","));
  const [customerId, setCustomerId] = useState<string>(initial.customerId ? String(initial.customerId) : "");
  const [issueDate, setIssueDate] = useState(initial.issueDate);
  const [dueDate, setDueDate] = useState(initial.dueDate ?? "");

  const totals = useMemo(
    () => computeTotals(rows, parseNumber(discount, 0), kleinunternehmer),
    [rows, discount, kleinunternehmer],
  );

  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  const add = (item?: Partial<LineItem>) =>
    setRows((rs) => {
      const row = toRow({ title: "", description: "", quantity: 1, unit: "Pauschale", unitPrice: 0, taxRate: kleinunternehmer ? 0 : defaultTaxRate, ...item });
      // Eine einzelne, leere Startzeile wird ersetzt statt ergänzt
      if (item && rs.length === 1 && !rs[0].title && !rs[0].unitPrice) return [row];
      return [...rs, row];
    });
  const move = (from: number, to: number) =>
    setRows((rs) => {
      if (to < 0 || to >= rs.length) return rs;
      const copy = [...rs];
      const [x] = copy.splice(from, 1);
      copy.splice(to, 0, x);
      return copy;
    });

  const applyPaymentTerm = (cid: string, date: string) => {
    if (kind !== "rechnung") return;
    const c = customers.find((x) => String(x.id) === cid);
    const days = c?.paymentTermDays ?? defaultPaymentDays;
    setDueDate(addDays(date, days));
  };

  const serialized = JSON.stringify(
    rows
      .filter((r) => r.title.trim())
      .map(({ title, description, quantity, unit, unitPrice, taxRate, optional }) => ({ title, description, quantity, unit, unitPrice, taxRate, optional: !!optional })),
  );

  return (
    <ActionForm action={action} keepOpen>
      <input type="hidden" name="items" value={serialized} />
      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-6">
          <Field label="Kunde" name="customerId" required className="md:col-span-3">
            <Select
              name="customerId"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                applyPaymentTerm(e.target.value, issueDate);
              }}
              placeholder="Kunde wählen …"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
              required
            />
          </Field>
          <Field label={kind === "angebot" ? "Angebotsdatum" : "Rechnungsdatum"} name="issueDate" className="md:col-span-1">
            <Input
              type="date"
              name="issueDate"
              value={issueDate}
              onChange={(e) => {
                setIssueDate(e.target.value);
                applyPaymentTerm(customerId, e.target.value);
              }}
              required
            />
          </Field>
          {kind === "angebot" ? (
            <Field label="Gültig bis" name="validUntil" className="md:col-span-2">
              <Input type="date" name="validUntil" defaultValue={initial.validUntil ?? ""} />
            </Field>
          ) : (
            <Field label="Zahlbar bis" name="dueDate" className="md:col-span-2">
              <Input type="date" name="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          )}
          <Field label="Betreff / Titel" name="title" required className={kind === "rechnung" ? "md:col-span-2" : "md:col-span-6"}>
            <Input name="title" defaultValue={initial.title} placeholder={kind === "angebot" ? "z. B. Social-Media-Betreuung 2026" : "z. B. Social-Media-Betreuung Oktober 2026"} required />
          </Field>
          {kind === "rechnung" && (
            <>
              <Field label="Leistungszeitraum von" name="serviceFrom" className="md:col-span-2" hint="Pflichtangabe auf Rechnungen (§ 14 UStG)">
                <Input type="date" name="serviceFrom" defaultValue={initial.serviceFrom ?? ""} />
              </Field>
              <Field label="bis" name="serviceTo" className="md:col-span-2">
                <Input type="date" name="serviceTo" defaultValue={initial.serviceTo ?? ""} />
              </Field>
            </>
          )}
          <Field label="Einleitungstext" name="intro" className="md:col-span-6">
            <Textarea name="intro" rows={2} defaultValue={initial.intro ?? ""} />
          </Field>
        </div>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <h3 className="text-sm font-semibold">Positionen</h3>
          <div className="flex gap-2">
            {services.length > 0 && (
              <div className="relative">
                <BookOpen className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" />
                <select
                  className="input w-56 py-1.5 pl-8 text-sm"
                  value=""
                  onChange={(e) => {
                    const s = services.find((x) => String(x.id) === e.target.value);
                    if (s) add({ title: s.name, description: s.description, unit: s.unit, unitPrice: s.unitPrice, taxRate: kleinunternehmer ? 0 : s.taxRate });
                  }}
                  aria-label="Aus Leistungskatalog"
                >
                  <option value="">Aus Leistungskatalog …</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.unitPrice ? `(${eur(s.unitPrice)})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={() => add()}>
              <Plus /> Position
            </Button>
          </div>
        </div>
        <div className="divide-y divide-line">
          {rows.map((r, idx) => (
            <div key={r.key} className={cn("grid gap-3 px-5 py-4 md:grid-cols-[24px_1fr_90px_120px_130px_90px_110px_32px]", r.optional && "bg-surface-2")}>
              <div className="hidden flex-col items-center pt-2 md:flex">
                <button type="button" onClick={() => move(idx, idx - 1)} className="text-muted hover:text-fg" aria-label="Nach oben">
                  <GripVertical className="size-4" />
                </button>
                <span className="mt-1 text-xs text-muted num">{idx + 1}</span>
              </div>
              <div className="space-y-2">
                <Input value={r.title} onChange={(e) => update(r.key, { title: e.target.value })} placeholder="Leistung" aria-label="Leistung" />
                <Textarea
                  value={r.description ?? ""}
                  onChange={(e) => update(r.key, { description: e.target.value })}
                  rows={1}
                  placeholder="Beschreibung (optional)"
                  className="text-xs"
                  aria-label="Beschreibung"
                />
                {kind === "angebot" && (
                  <Checkbox checked={!!r.optional} onChange={(e) => update(r.key, { optional: e.target.checked })} label="Optionale Position (nicht in Summe)" />
                )}
              </div>
              <div>
                <label className="label md:hidden">Menge</label>
                <Input
                  value={r.qtyInput}
                  inputMode="decimal"
                  onChange={(e) => update(r.key, { qtyInput: e.target.value, quantity: parseNumber(e.target.value, 0) })}
                  className="text-right num"
                  aria-label="Menge"
                />
              </div>
              <div>
                <label className="label md:hidden">Einheit</label>
                <Select value={r.unit} onChange={(e) => update(r.key, { unit: e.target.value })} options={Array.from(new Set([...UNITS, r.unit])).map((u) => ({ value: u, label: u }))} aria-label="Einheit" />
              </div>
              <div>
                <label className="label md:hidden">Einzelpreis (netto)</label>
                <div className="relative">
                  <Input
                    value={r.priceInput}
                    inputMode="decimal"
                    onChange={(e) => update(r.key, { priceInput: e.target.value, unitPrice: parseMoney(e.target.value) })}
                    className="pr-7 text-right num"
                    aria-label="Einzelpreis"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted">€</span>
                </div>
              </div>
              <div>
                <label className="label md:hidden">USt.</label>
                <Select
                  value={kleinunternehmer ? 0 : r.taxRate}
                  disabled={kleinunternehmer}
                  onChange={(e) => update(r.key, { taxRate: Number(e.target.value) })}
                  options={TAX_RATES.map((t) => ({ value: t, label: `${t} %` }))}
                  aria-label="Steuersatz"
                />
              </div>
              <div className="flex items-center justify-end text-sm font-medium num md:pt-2 md:items-start">
                {eur(lineNet(r))}
              </div>
              <div className="flex justify-end md:pt-1.5">
                <button type="button" onClick={() => remove(r.key)} className="rounded p-1 text-muted hover:bg-surface-3 hover:text-red-600" aria-label="Entfernen">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-6 border-t border-line bg-surface-2 px-5 py-5 md:grid-cols-2">
          <div className="max-w-48">
            <Field label="Rabatt in %" name="discountPercent">
              <Input name="discountPercent" value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" placeholder="0" />
            </Field>
          </div>
          <dl className="ml-auto w-full max-w-sm space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Zwischensumme</dt><dd className="num">{eur(totals.subtotal)}</dd></div>
            {totals.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Rabatt</dt><dd className="num">−{eur(totals.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Netto</dt><dd className="num">{eur(totals.net)}</dd></div>
            {kleinunternehmer ? (
              <div className="text-xs text-muted">Keine Umsatzsteuer gem. § 19 UStG</div>
            ) : (
              totals.byRate.filter((r) => r.rate > 0).map((r) => (
                <div key={r.rate} className="flex justify-between"><dt className="text-muted">zzgl. {r.rate} % USt.</dt><dd className="num">{eur(r.tax)}</dd></div>
              ))
            )}
            <div className="flex justify-between border-t border-line-strong pt-2 text-base font-semibold"><dt>Gesamt</dt><dd className="num">{eur(totals.gross)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <Field label="Schlusstext" name="outro" hint={kind === "rechnung" ? "Platzhalter: {{faellig}} = Fälligkeitsdatum" : undefined}>
          <Textarea name="outro" rows={2} defaultValue={initial.outro ?? ""} />
        </Field>
      </div>

      <FormActions>
        <SubmitButton size="lg">{kind === "angebot" ? "Angebot speichern" : "Entwurf speichern"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
