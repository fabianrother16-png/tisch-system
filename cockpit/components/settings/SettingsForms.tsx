"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, CancelButton, Field, FormActions, SubmitButton } from "@/components/ui/form";
import { Checkbox, Input, MoneyInput, Select, Textarea } from "@/components/ui/inputs";
import { Button } from "@/components/ui/Button";
import { TAX_RATES, UNITS } from "@/lib/constants";
import { centsToInput } from "@/lib/format";
import type { ActionState } from "@/lib/actions/types";
import type { CompanySettings, InvoicingSettings, MailTemplates, Partner } from "@/lib/settings";
import type { Service } from "@/lib/db/schema";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function CompanyForm({ action, company }: { action: Action; company: CompanySettings }) {
  const c = company;
  return (
    <ActionForm action={action} keepOpen className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Firmenname" name="name" required><Input name="name" defaultValue={c.name} required /></Field>
        <Field label="Rechtsform" name="legalForm"><Input name="legalForm" defaultValue={c.legalForm} placeholder="GbR" /></Field>
        <Field label="Gesellschafter (für Rechnungen & Signatur)" name="owners" className="sm:col-span-2"><Input name="owners" defaultValue={c.owners} placeholder="Max Mustermann & Moritz Mustermann" /></Field>
        <Field label="Straße & Hausnummer" name="street" className="sm:col-span-2"><Input name="street" defaultValue={c.street} /></Field>
        <div className="grid grid-cols-[110px_1fr] gap-3 sm:col-span-2">
          <Field label="PLZ" name="zip"><Input name="zip" defaultValue={c.zip} /></Field>
          <Field label="Ort" name="city"><Input name="city" defaultValue={c.city} /></Field>
        </div>
        <Field label="E-Mail" name="email"><Input type="email" name="email" defaultValue={c.email} /></Field>
        <Field label="Telefon" name="phone"><Input name="phone" defaultValue={c.phone} /></Field>
        <Field label="Website" name="website"><Input name="website" defaultValue={c.website} /></Field>
        <Field label="Akzentfarbe (PDF)" name="accentColor"><Input type="color" name="accentColor" defaultValue={c.accentColor} className="h-10 p-1" /></Field>
      </div>
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
        <legend className="px-1 text-xs font-semibold text-muted">Steuer & Bank (Pflichtangaben auf Rechnungen)</legend>
        <Field label="Steuernummer" name="taxNumber" hint="vom Finanzamt für die GbR"><Input name="taxNumber" defaultValue={c.taxNumber} /></Field>
        <Field label="USt-IdNr." name="vatId"><Input name="vatId" defaultValue={c.vatId} placeholder="DE…" /></Field>
        <Field label="Bank" name="bankName"><Input name="bankName" defaultValue={c.bankName} /></Field>
        <Field label="BIC" name="bic"><Input name="bic" defaultValue={c.bic} /></Field>
        <Field label="IBAN" name="iban" className="sm:col-span-2"><Input name="iban" defaultValue={c.iban} /></Field>
      </fieldset>
      <FormActions><SubmitButton>Speichern</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function PartnersForm({ action, partners }: { action: Action; partners: Partner[] }) {
  const [rows, setRows] = useState(partners.length ? partners : [{ name: "", share: 100 }]);
  return (
    <ActionForm action={action} keepOpen className="space-y-3">
      {rows.map((p, i) => (
        <div key={i} className="grid grid-cols-[1fr_110px_36px] items-end gap-2">
          <Field label={i === 0 ? "Gesellschafter" : undefined}>
            <Input name="partnerName" defaultValue={p.name} placeholder="Name" />
          </Field>
          <Field label={i === 0 ? "Anteil in %" : undefined}>
            <Input name="partnerShare" defaultValue={String(p.share)} inputMode="decimal" />
          </Field>
          <Button variant="ghost" size="icon" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Entfernen" disabled={rows.length === 1}>
            <Trash2 />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setRows([...rows, { name: "", share: 0 }])}><Plus /> Gesellschafter</Button>
        <SubmitButton>Speichern</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function InvoicingForm({ action, s }: { action: Action; s: InvoicingSettings }) {
  return (
    <ActionForm action={action} keepOpen className="space-y-5">
      <div className="space-y-3 rounded-xl bg-surface-2 p-4">
        <Checkbox
          name="kleinunternehmer"
          defaultChecked={s.kleinunternehmer}
          label="Kleinunternehmerregelung (§ 19 UStG)"
          description="Keine Umsatzsteuer auf Rechnungen, kein Vorsteuerabzug. Grenzen: 25.000 € Vorjahr / 100.000 € laufendes Jahr. Im Zweifel mit dem Steuerberater klären."
        />
        <Field label="Versteuerung" name="taxationMode" hint="Ist-Versteuerung: USt wird erst bei Zahlungseingang fällig (bei kleinen GbRs üblich)">
          <Select name="taxationMode" defaultValue={s.taxationMode} options={[{ value: "ist", label: "Ist-Versteuerung (nach Zahlungseingang)" }, { value: "soll", label: "Soll-Versteuerung (nach Rechnungsdatum)" }]} className="max-w-md" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Standard-Steuersatz" name="defaultTaxRate"><Select name="defaultTaxRate" defaultValue={s.defaultTaxRate} options={TAX_RATES.map((t) => ({ value: t, label: `${t} %` }))} /></Field>
        <Field label="Zahlungsziel (Tage)" name="paymentTermDays"><Input type="number" min={0} name="paymentTermDays" defaultValue={s.paymentTermDays} /></Field>
        <Field label="Angebote gültig (Tage)" name="quoteValidityDays"><Input type="number" min={1} name="quoteValidityDays" defaultValue={s.quoteValidityDays} /></Field>
        <Field label="Präfix Rechnungen" name="invoicePrefix" hint="ergibt z. B. RE-2026-0001"><Input name="invoicePrefix" defaultValue={s.invoicePrefix} /></Field>
        <Field label="Präfix Angebote" name="quotePrefix"><Input name="quotePrefix" defaultValue={s.quotePrefix} /></Field>
        <Field label="Präfix Kundennummern" name="customerPrefix"><Input name="customerPrefix" defaultValue={s.customerPrefix} /></Field>
        <Field label="Erinnerung nach (Tagen überfällig)" name="reminderDays"><Input type="number" min={1} name="reminderDays" defaultValue={s.reminderDays} /></Field>
        <Field label="Mahngebühr" name="reminderFee"><MoneyInput name="reminderFee" defaultValue={centsToInput(s.reminderFee)} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Rechnung: Einleitung" name="invoiceIntro"><Textarea name="invoiceIntro" rows={2} defaultValue={s.invoiceIntro} /></Field>
        <Field label="Rechnung: Schlusstext" name="invoiceOutro" hint="{{faellig}} = Fälligkeitsdatum"><Textarea name="invoiceOutro" rows={2} defaultValue={s.invoiceOutro} /></Field>
        <Field label="Angebot: Einleitung" name="quoteIntro"><Textarea name="quoteIntro" rows={2} defaultValue={s.quoteIntro} /></Field>
        <Field label="Angebot: Schlusstext" name="quoteOutro"><Textarea name="quoteOutro" rows={2} defaultValue={s.quoteOutro} /></Field>
      </div>
      <FormActions><SubmitButton>Speichern</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function ServiceForm({ action, service }: { action: Action; service?: Service }) {
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Leistung" name="name" required className="sm:col-span-2"><Input name="name" defaultValue={service?.name} required autoFocus /></Field>
        <Field label="Beschreibung (erscheint auf Angebot/Rechnung)" name="description" className="sm:col-span-2"><Textarea name="description" rows={2} defaultValue={service?.description ?? ""} /></Field>
        <Field label="Kategorie" name="category"><Input name="category" defaultValue={service?.category ?? ""} /></Field>
        <Field label="Einheit" name="unit"><Select name="unit" defaultValue={service?.unit ?? "Pauschale"} options={UNITS.map((u) => ({ value: u, label: u }))} /></Field>
        <Field label="Preis (netto)" name="unitPrice"><MoneyInput name="unitPrice" defaultValue={centsToInput(service?.unitPrice ?? 0)} /></Field>
        <Field label="Steuersatz" name="taxRate"><Select name="taxRate" defaultValue={service?.taxRate ?? 19} options={TAX_RATES.map((t) => ({ value: t, label: `${t} %` }))} /></Field>
        {service && <Checkbox name="active" defaultChecked={service.active} label="Aktiv (im Katalog auswählbar)" className="sm:col-span-2" />}
      </div>
      <FormActions><CancelButton /><SubmitButton>Speichern</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function MailForm({
  action,
  m,
}: {
  action: Action;
  m: { smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpUser: string; hasSmtpPassword: boolean; fromName: string; fromAddress: string; imapHost: string; imapPort: number; imapUser: string; hasImapPassword: boolean; signature: string; bccSelf: boolean };
}) {
  return (
    <ActionForm action={action} keepOpen className="space-y-5">
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
        <legend className="px-1 text-xs font-semibold text-muted">Absender</legend>
        <Field label="Absendername" name="fromName"><Input name="fromName" defaultValue={m.fromName} placeholder="SICHTWERK" /></Field>
        <Field label="Absenderadresse" name="fromAddress"><Input type="email" name="fromAddress" defaultValue={m.fromAddress} placeholder="hallo@sichtwerk.de" /></Field>
      </fieldset>
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
        <legend className="px-1 text-xs font-semibold text-muted">Versand (SMTP)</legend>
        <Field label="Server" name="smtpHost"><Input name="smtpHost" defaultValue={m.smtpHost} placeholder="smtp.ionos.de" /></Field>
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <Field label="Port" name="smtpPort"><Input type="number" name="smtpPort" defaultValue={m.smtpPort} /></Field>
          <Checkbox name="smtpSecure" defaultChecked={m.smtpSecure} label="SSL (465)" className="pb-2" />
        </div>
        <Field label="Benutzername" name="smtpUser"><Input name="smtpUser" defaultValue={m.smtpUser} autoComplete="off" /></Field>
        <Field label="Passwort" name="smtpPassword" hint={m.hasSmtpPassword ? "gespeichert – leer lassen, um es zu behalten" : "wird verschlüsselt gespeichert"}>
          <Input type="password" name="smtpPassword" autoComplete="new-password" placeholder={m.hasSmtpPassword ? "••••••••" : ""} />
        </Field>
      </fieldset>
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
        <legend className="px-1 text-xs font-semibold text-muted">Empfang (IMAP, optional)</legend>
        <Field label="Server" name="imapHost"><Input name="imapHost" defaultValue={m.imapHost} placeholder="imap.ionos.de" /></Field>
        <Field label="Port" name="imapPort"><Input type="number" name="imapPort" defaultValue={m.imapPort} /></Field>
        <Field label="Benutzername" name="imapUser" hint="leer = wie SMTP"><Input name="imapUser" defaultValue={m.imapUser} autoComplete="off" /></Field>
        <Field label="Passwort" name="imapPassword" hint={m.hasImapPassword ? "gespeichert – leer lassen, um es zu behalten" : "leer = wie SMTP"}>
          <Input type="password" name="imapPassword" autoComplete="new-password" placeholder={m.hasImapPassword ? "••••••••" : ""} />
        </Field>
      </fieldset>
      <Field label="Signatur" name="signature"><Textarea name="signature" rows={5} defaultValue={m.signature} placeholder={"SICHTWERK GbR\nDigitale Sichtbarkeit für den Mittelstand\nTel. …"} /></Field>
      <Checkbox name="bccSelf" defaultChecked={m.bccSelf} label="Kopie jeder gesendeten Mail an mich (BCC)" description="Damit die Mails auch im normalen Postfach unter „Gesendet“ auftauchen" />
      <FormActions><SubmitButton>Speichern</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function TemplatesForm({ action, t }: { action: Action; t: MailTemplates }) {
  const labels: Record<string, string> = { angebot: "Angebot senden", rechnung: "Rechnung senden", mahnung: "Zahlungserinnerung", report: "Report-Link senden" };
  return (
    <ActionForm action={action} keepOpen className="space-y-5">
      <p className="text-xs text-muted">
        Platzhalter: {"{{ansprechpartner}} {{kunde}} {{firma}} {{nummer}} {{betrag}} {{offen}} {{faellig}} {{datum}} {{gueltig_bis}} {{link}} {{absender}}"}
      </p>
      {(Object.keys(t) as (keyof MailTemplates)[]).map((k) => (
        <fieldset key={k} className="space-y-3 rounded-xl border border-line p-4">
          <legend className="px-1 text-xs font-semibold text-muted">{labels[k]}</legend>
          <Field label="Betreff" name={`${k}.subject`}><Input name={`${k}.subject`} defaultValue={t[k].subject} /></Field>
          <Field label="Text" name={`${k}.body`}><Textarea name={`${k}.body`} rows={6} defaultValue={t[k].body} /></Field>
        </fieldset>
      ))}
      <FormActions><SubmitButton>Vorlagen speichern</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function OAuthAppsForm({ action, apps, redirects }: { action: Action; apps: Record<string, { clientId: string; hasSecret: boolean; fromEnv: boolean }>; redirects: Record<string, string[]> }) {
  const blocks: { key: string; title: string; idLabel: string; secretLabel: string; help: React.ReactNode }[] = [
    {
      key: "instagram",
      title: "Instagram (Instagram API mit Instagram-Login)",
      idLabel: "Instagram-App-ID",
      secretLabel: "Instagram-App-Geheimschlüssel",
      help: <>developers.facebook.com → App erstellen (Typ „Business“) → Produkt „Instagram“ → „API-Setup mit Instagram-Login“. Berechtigungen: instagram_business_basic, instagram_business_manage_insights.</>,
    },
    {
      key: "tiktok",
      title: "TikTok",
      idLabel: "Client Key",
      secretLabel: "Client Secret",
      help: <>developers.tiktok.com → App anlegen → Produkte „Login Kit“ + „Display API“ → Scopes user.info.basic, user.info.stats, video.list. App-Prüfung durch TikTok nötig.</>,
    },
    {
      key: "meta",
      title: "Meta (Facebook-Seiten & Meta Ads)",
      idLabel: "App-ID",
      secretLabel: "App-Geheimschlüssel",
      help: <>Gleiche oder zweite Meta-App mit „Facebook Login for Business“ + „Marketing API“. Berechtigungen: pages_show_list, pages_read_engagement, read_insights, ads_read, business_management (App-Review für Live-Modus).</>,
    },
    {
      key: "google",
      title: "Google (Ads & Unternehmensprofil)",
      idLabel: "OAuth-Client-ID",
      secretLabel: "OAuth-Clientschlüssel",
      help: <>console.cloud.google.com → APIs aktivieren: Google Ads API, My Business Account Management, Business Information, Business Profile Performance → OAuth-Client (Webanwendung). Business-Profile-APIs müssen bei Google beantragt werden.</>,
    },
    {
      key: "googleAds",
      title: "Google Ads – Developer-Token",
      idLabel: "Verwaltungskonto-ID (MCC, optional)",
      secretLabel: "Developer-Token",
      help: <>Im Google-Ads-Verwaltungskonto unter Tools → API-Center. Für eigene Kundenkonten reicht „Basiszugriff“.</>,
    },
    {
      key: "googlePlaces",
      title: "Google Places API (Sterne & Bewertungsanzahl)",
      idLabel: "(nicht nötig)",
      secretLabel: "API-Schlüssel",
      help: <>console.cloud.google.com → „Places API (New)“ aktivieren → API-Schlüssel erstellen und auf diese API beschränken. Kein Login des Kunden nötig – nur die Place ID.</>,
    },
  ];
  return (
    <ActionForm action={action} keepOpen className="space-y-4">
      {blocks.map((b) => {
        const a = apps[b.key];
        return (
          <fieldset key={b.key} className="space-y-3 rounded-xl border border-line p-4">
            <legend className="px-1 text-sm font-semibold">
              {b.title} {a?.hasSecret ? <span className="ml-1 text-xs font-normal text-emerald-600">● eingerichtet{a.fromEnv ? " (Umgebungsvariable)" : ""}</span> : <span className="ml-1 text-xs font-normal text-muted">○ nicht eingerichtet</span>}
            </legend>
            <p className="text-xs text-muted">{b.help}</p>
            {redirects[b.key] && (
              <div className="rounded-lg bg-surface-2 px-3 py-2 text-xs">
                <p className="font-medium">Weiterleitungs-URL(s) in der App eintragen:</p>
                {redirects[b.key].map((r) => <code key={r} className="block break-all text-fg-2">{r}</code>)}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {b.key !== "googlePlaces" && (
                <Field label={b.idLabel} name={`${b.key}.clientId`}>
                  <Input name={`${b.key}.clientId`} defaultValue={a?.clientId ?? ""} autoComplete="off" />
                </Field>
              )}
              <Field label={b.secretLabel} name={`${b.key}.clientSecret`} hint={a?.hasSecret ? "gespeichert – leer lassen zum Behalten" : undefined}>
                <Input type="password" name={`${b.key}.clientSecret`} autoComplete="new-password" placeholder={a?.hasSecret ? "••••••••" : ""} />
              </Field>
            </div>
            {a?.hasSecret && !a.fromEnv && <Checkbox name={`${b.key}.clear`} label="Zugangsdaten entfernen" />}
          </fieldset>
        );
      })}
      <FormActions><SubmitButton>Zugangsdaten speichern</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function ProfileForm({ action, user }: { action: Action; user: { name: string; email: string; color: string } }) {
  return (
    <ActionForm action={action} keepOpen className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_80px]">
        <Field label="Name" name="name"><Input name="name" defaultValue={user.name} required /></Field>
        <Field label="E-Mail (Login)" name="email"><Input type="email" name="email" defaultValue={user.email} required /></Field>
        <Field label="Farbe" name="color"><Input type="color" name="color" defaultValue={user.color} className="h-10 p-1" /></Field>
      </div>
      <FormActions className="mt-2"><SubmitButton>Profil speichern</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function PasswordForm({ action }: { action: Action }) {
  return (
    <ActionForm action={action} keepOpen resetOnSuccess className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Aktuelles Passwort" name="current"><Input type="password" name="current" autoComplete="current-password" required /></Field>
        <Field label="Neues Passwort" name="next" hint="Mindestens 10 Zeichen"><Input type="password" name="next" autoComplete="new-password" required minLength={10} /></Field>
      </div>
      <FormActions className="mt-2"><SubmitButton>Passwort ändern</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function AddUserForm({ action }: { action: Action }) {
  return (
    <ActionForm action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required><Input name="name" required autoFocus /></Field>
        <Field label="E-Mail" name="email" required><Input type="email" name="email" required /></Field>
        <Field label="Startpasswort" name="password" required hint="Mindestens 10 Zeichen – bitte sicher weitergeben"><Input type="password" name="password" required minLength={10} autoComplete="new-password" /></Field>
        <Field label="Rolle" name="role">
          <Select name="role" defaultValue="mitarbeiter" options={[{ value: "inhaber", label: "Inhaber / Gesellschafter" }, { value: "mitarbeiter", label: "Mitarbeiter / Freelancer" }]} />
        </Field>
        <Field label="Farbe" name="color"><Input type="color" name="color" defaultValue="#059669" className="h-10 p-1" /></Field>
      </div>
      <FormActions><CancelButton /><SubmitButton>Zugang anlegen</SubmitButton></FormActions>
    </ActionForm>
  );
}

export function ResetPasswordForm({ action }: { action: Action }) {
  return (
    <ActionForm action={action} className="space-y-4">
      <Field label="Neues Passwort" name="password" hint="Mindestens 10 Zeichen"><Input type="password" name="password" required minLength={10} autoComplete="new-password" /></Field>
      <FormActions><CancelButton /><SubmitButton>Setzen</SubmitButton></FormActions>
    </ActionForm>
  );
}
