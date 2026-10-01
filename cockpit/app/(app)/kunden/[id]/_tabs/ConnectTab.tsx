import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { AlertTriangle, CheckCircle2, ExternalLink, Link2, Plug, Plus, RefreshCw, Send, Unplug, Star } from "lucide-react";
import { db } from "@/lib/db";
import { baselines, contacts, integrations, trackingLinks, type Customer } from "@/lib/db/schema";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CopyField } from "@/components/ui/CopyField";
import { ActionButton } from "@/components/ui/form";
import { PlatformIcon } from "@/components/PlatformIcon";
import { SendMailForm } from "@/components/finance/SendMailForm";
import { BaselineForm } from "@/components/customers/BaselineForm";
import { ChoiceForm } from "@/components/performance/ChoiceForm";
import { LinkForm } from "@/components/links/LinkForm";
import { regenerateReportToken, saveBaselines, sendReportMail, toggleReport } from "@/lib/actions/customers";
import { chooseAccount, disconnectIntegration, syncCustomerNow } from "@/lib/actions/performance";
import { saveLink } from "@/lib/actions/links";
import { PROVIDERS, appCredentials, extraSecrets } from "@/lib/integrations/config";
import { LINK_CHANNEL_MAP } from "@/lib/constants";
import { appUrl } from "@/lib/env";
import { fillTemplate, getSetting } from "@/lib/settings";
import { fmtNumber, fmtTimestamp } from "@/lib/format";
import { requireUser } from "@/lib/auth";

export async function ConnectTab({ customer, flash }: { customer: Customer; flash?: { connected?: string; error?: string } }) {
  const user = await requireUser();
  const id = customer.id;
  const [rows, baseRows, links, primary, templates, company, creds, extra] = await Promise.all([
    db.select().from(integrations).where(eq(integrations.customerId, id)),
    db.select().from(baselines).where(eq(baselines.customerId, id)),
    db.select().from(trackingLinks).where(eq(trackingLinks.customerId, id)).orderBy(desc(trackingLinks.createdAt)),
    db.select().from(contacts).where(and(eq(contacts.customerId, id), eq(contacts.isPrimary, true))).limit(1),
    getSetting("mailTemplates"),
    getSetting("company"),
    Promise.all((["instagram", "tiktok", "meta", "google"] as const).map(async (a) => [a, !!(await appCredentials(a))] as const)),
    extraSecrets(),
  ]);
  const configured = Object.fromEntries(creds);
  const reportUrl = `${appUrl()}/report/${customer.reportToken}`;
  const contactName = primary[0]?.name?.split(" ")[0] ?? "zusammen";
  const reportDraft = {
    to: primary[0]?.email ?? customer.email ?? "",
    subject: fillTemplate(templates.report.subject, { firma: company.name, kunde: customer.name }),
    body: fillTemplate(templates.report.body, { ansprechpartner: contactName, link: reportUrl, firma: company.name, kunde: customer.name, absender: `${user.name}\n${company.name}` }),
  };

  return (
    <div className="space-y-6">
      {flash?.connected && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 className="size-4" /> {PROVIDERS.find((p) => p.key === flash.connected)?.label} wurde verbunden.
        </div>
      )}
      {flash?.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {flash.error}
        </div>
      )}

      <Card>
        <CardHeader
          title="Kanäle verbinden"
          icon={<Plug />}
          description="Einmal verbinden – danach holt das Cockpit die Zahlen täglich automatisch."
          actions={
            rows.length > 0 && (
              <ActionButton action={syncCustomerNow.bind(null, id)} size="sm">
                <RefreshCw /> Alle aktualisieren
              </ActionButton>
            )
          }
        />
        <div className="grid gap-px bg-line md:grid-cols-2 xl:grid-cols-3">
          {PROVIDERS.map((p) => {
            const row = rows.find((r) => r.provider === p.key);
            const ready = configured[p.app];
            const choices: { id: string; name: string }[] = row ? JSON.parse(row.config.choices ?? "[]") : [];
            const needsChoice = row && !row.externalId && choices.length > 0;
            return (
              <div key={p.key} className="flex flex-col bg-surface p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={p.platform} className="size-5" />
                    <p className="font-medium">{p.label}</p>
                  </div>
                  {row ? (
                    row.status === "fehler" ? <Badge tone="red">Fehler</Badge> : needsChoice ? <Badge tone="amber">Auswahl nötig</Badge> : <Badge tone="green" dot>verbunden</Badge>
                  ) : (
                    <Badge>nicht verbunden</Badge>
                  )}
                </div>
                <p className="mt-2 flex-1 text-xs text-muted">{p.description}</p>
                {row?.name && <p className="mt-2 text-sm">Konto: <span className="font-medium">{row.name}</span></p>}
                {row?.lastSyncAt && <p className="text-xs text-muted">Zuletzt aktualisiert: {fmtTimestamp(row.lastSyncAt)}</p>}
                {row?.lastError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{row.lastError}</p>}
                {needsChoice && (
                  <div className="mt-3">
                    <ChoiceForm action={chooseAccount.bind(null, row.id)} choices={choices} />
                  </div>
                )}
                {row && !row.externalId && choices.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Keine Seiten/Konten gefunden – fehlen dem Login die nötigen Rechte?</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {ready ? (
                    <LinkButton href={`/api/oauth/${p.key}/start?kunde=${id}`} size="sm" variant={row ? "secondary" : "primary"} prefetch={false}>
                      <Plug /> {row ? "Neu verbinden" : "Verbinden"}
                    </LinkButton>
                  ) : (
                    <Link href="/einstellungen?tab=anbindungen" className="text-xs font-medium text-accent hover:underline">
                      Erst App-Zugang in den Einstellungen hinterlegen →
                    </Link>
                  )}
                  {row && (
                    <ActionButton action={disconnectIntegration.bind(null, row.id)} confirm={`${p.label} trennen?`} variant="ghost">
                      <Unplug /> Trennen
                    </ActionButton>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted">Voraussetzung: {p.needs}</p>
              </div>
            );
          })}
          <div className="flex flex-col bg-surface p-5">
            <div className="flex items-center gap-2">
              <Star className="size-5 fill-amber-400 text-amber-400" />
              <p className="font-medium">Google-Sterne ohne Kunden-Login</p>
            </div>
            <p className="mt-2 flex-1 text-xs text-muted">
              Sterne & Anzahl der Bewertungen über die Google Places API – ihr braucht nur die Place ID des Kunden (in den Stammdaten) und einen API-Schlüssel.
            </p>
            <p className="mt-2 text-sm">
              Place ID: {customer.googlePlaceId ? <span className="font-mono text-xs">{customer.googlePlaceId}</span> : <Link className="text-accent hover:underline" href={`/kunden/${id}?tab=stammdaten`}>eintragen</Link>}
            </p>
            <p className="text-xs text-muted">API-Schlüssel: {extra.googlePlacesKey ? "hinterlegt ✓" : <Link className="text-accent hover:underline" href="/einstellungen?tab=anbindungen">fehlt</Link>}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Kunden-Report"
            description="Eine schöne, immer aktuelle Seite mit allen Zahlen und dem Vorher/Nachher – zum Teilen mit dem Kunden. Ohne Login, nur mit geheimem Link."
            actions={customer.reportEnabled ? <Badge tone="green" dot>aktiv</Badge> : <Badge>aus</Badge>}
          />
          <CardBody className="space-y-4">
            {customer.reportEnabled ? (
              <>
                <CopyField value={reportUrl} />
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/report/${customer.reportToken}`} target="_blank" size="sm"><ExternalLink /> Ansehen</LinkButton>
                  <Modal title="Report-Link senden" size="lg" trigger={<Button size="sm"><Send /> Per E-Mail senden</Button>}>
                    <SendMailForm action={sendReportMail.bind(null, id)} draft={reportDraft} attachments={[]} />
                  </Modal>
                  <ActionButton action={regenerateReportToken.bind(null, id)} confirm="Neuen Link erzeugen? Der bisherige Link funktioniert dann nicht mehr.">
                    Neuer Link
                  </ActionButton>
                  <ActionButton action={toggleReport.bind(null, id, false)} variant="ghost">Deaktivieren</ActionButton>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                <ActionButton action={toggleReport.bind(null, id, true)} variant="primary" size="md">Report-Link aktivieren</ActionButton>
                <LinkButton href={`/report/${customer.reportToken}?vorschau=1`} target="_blank" size="md"><ExternalLink /> Vorschau</LinkButton>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Ausgangswerte (Vorher)"
            description="Wie stand der Kunde da, bevor ihr angefangen habt? Daraus entsteht der Vorher/Nachher-Vergleich – euer stärkstes Argument."
          />
          <CardBody>
            <BaselineForm action={saveBaselines.bind(null, id)} baselines={baseRows} startDate={customer.startDate} />
          </CardBody>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Tracking-Links & NFC-Karten"
          icon={<Link2 />}
          actions={
            <Modal title="Neuer Tracking-Link" trigger={<Button size="sm"><Plus /> Link</Button>}>
              <LinkForm action={saveLink.bind(null, null)} customers={[{ id, name: customer.name }]} baseUrl={appUrl()} defaultCustomerId={id} />
            </Modal>
          }
        />
        {links.length === 0 ? (
          <p className="px-5 py-5 text-sm text-muted">Noch keine Links – z. B. für NFC-Bewertungskarten, die Website im Google-Profil oder die Instagram-Bio.</p>
        ) : (
          <div className="divide-y divide-line">
            {links.map((l) => (
              <Link key={l.id} href={`/links/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-surface-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.label}</p>
                  <p className="text-xs text-muted">{LINK_CHANNEL_MAP[l.channel]?.label} · /go/{l.slug}</p>
                </div>
                <span className="font-medium num">{fmtNumber(l.clickCount)} Klicks</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
