"use client";

import { useState } from "react";
import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input, MoneyInput, Select, Textarea } from "@/components/ui/inputs";
import { EXPENSE_CATEGORIES, TAX_RATES } from "@/lib/constants";
import { centsToInput, eur, parseMoney } from "@/lib/format";
import type { ActionState } from "@/lib/actions/types";
import type { Expense } from "@/lib/db/schema";

type Option = { id: number; name: string };

export function ExpenseForm({
  action,
  expense,
  customers,
  users,
  today,
  kleinunternehmer,
  defaultCustomerId,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  expense?: Expense;
  customers: Option[];
  users: Option[];
  today: string;
  kleinunternehmer: boolean;
  defaultCustomerId?: number;
}) {
  const e = expense;
  const [amount, setAmount] = useState(centsToInput(e?.grossAmount ?? null));
  const [amountType, setAmountType] = useState("brutto");
  const [taxRate, setTaxRate] = useState(e?.taxRate ?? 19);
  const [method, setMethod] = useState<string>(e?.paymentMethod ?? "geschaeftskonto");
  const cents = parseMoney(amount);
  const net = kleinunternehmer ? cents : amountType === "brutto" ? Math.round(cents / (1 + taxRate / 100)) : cents;
  const gross = amountType === "brutto" ? cents : Math.round(cents * (1 + taxRate / 100));
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Datum (Zahlung)" name="date" required>
          <Input type="date" name="date" defaultValue={e?.date ?? today} required />
        </Field>
        <Field label="Händler / Empfänger" name="vendor" required>
          <Input name="vendor" defaultValue={e?.vendor} placeholder="z. B. Adobe, Tankstelle, Freelancer" required autoFocus={!e} />
        </Field>
        <Field label="Wofür?" name="description" className="sm:col-span-2">
          <Input name="description" defaultValue={e?.description ?? ""} placeholder="z. B. Creative Cloud Oktober" />
        </Field>
        <Field label="Kategorie" name="category">
          <Select name="category" defaultValue={e?.category ?? "software"} options={EXPENSE_CATEGORIES} />
        </Field>
        <Field label="Kunde (optional)" name="customerId" hint="Für die Kosten-/Gewinnrechnung pro Kunde">
          <Select name="customerId" defaultValue={e?.customerId ?? defaultCustomerId ?? ""} placeholder="– allgemeine Ausgabe –" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Betrag" name="amount" required>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <MoneyInput name="amount" value={amount} onChange={(ev) => setAmount(ev.target.value)} required />
            <Select name="amountType" value={amountType} onChange={(ev) => setAmountType(ev.target.value)} options={[{ value: "brutto", label: "brutto" }, { value: "netto", label: "netto" }]} className="w-28" />
          </div>
        </Field>
        <Field label="Umsatzsteuer im Beleg" name="taxRate" hint={kleinunternehmer ? "Als Kleinunternehmer keine Vorsteuer" : `Netto ${eur(net)} · Vorsteuer ${eur(gross - net)}`}>
          <Select name="taxRate" value={taxRate} onChange={(ev) => setTaxRate(Number(ev.target.value))} options={TAX_RATES.map((t) => ({ value: t, label: `${t} %` }))} />
        </Field>
        <Field label="Bezahlt über" name="paymentMethod">
          <Select
            name="paymentMethod"
            value={method}
            onChange={(ev) => setMethod(ev.target.value)}
            options={[
              { value: "geschaeftskonto", label: "Geschäftskonto" },
              { value: "privat_auslage", label: "Privat ausgelegt" },
            ]}
          />
        </Field>
        {method === "privat_auslage" ? (
          <Field label="Ausgelegt von" name="paidByUserId">
            <Select name="paidByUserId" defaultValue={e?.paidByUserId ?? ""} options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Field>
        ) : (
          <Field label="Wiederkehrend" name="recurring">
            <Select
              name="recurring"
              defaultValue={e?.recurring ?? "nein"}
              options={[
                { value: "nein", label: "Nein, einmalig" },
                { value: "monatlich", label: "Monatlich (Abo, Miete …)" },
                { value: "jaehrlich", label: "Jährlich" },
              ]}
            />
          </Field>
        )}
        {method === "privat_auslage" && (
          <>
            <Field label="Wiederkehrend" name="recurring">
              <Select name="recurring" defaultValue={e?.recurring ?? "nein"} options={[{ value: "nein", label: "Nein" }, { value: "monatlich", label: "Monatlich" }, { value: "jaehrlich", label: "Jährlich" }]} />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox name="reimbursed" defaultChecked={e?.reimbursed} label="Bereits erstattet" />
            </div>
          </>
        )}
        <Field label="Beleg (Foto oder PDF)" name="receipt" className="sm:col-span-2" hint={e?.receiptFileId ? "Beleg vorhanden – neue Datei ersetzt die Verknüpfung" : "Wird automatisch in der Ablage unter „Belege“ gespeichert"}>
          <Input type="file" name="receipt" accept="application/pdf,image/*" capture="environment" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-2 file:py-1 file:text-xs" />
        </Field>
        <Field label="Notiz" name="notes" className="sm:col-span-2">
          <Textarea name="notes" rows={2} defaultValue={e?.notes ?? ""} />
        </Field>
      </div>
      <FormActions>
        <CancelButton />
        <SubmitButton>{e ? "Speichern" : "Ausgabe erfassen"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
