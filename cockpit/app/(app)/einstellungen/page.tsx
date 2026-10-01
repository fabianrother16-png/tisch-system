import { asc, eq } from "drizzle-orm";
import { Database, Download, KeyRound, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { customers, services, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { CopyField } from "@/components/ui/CopyField";
import { ActionButton } from "@/components/ui/form";
import {
  AddUserForm,
  CompanyForm,
  InvoicingForm,
  MailForm,
  OAuthAppsForm,
  PartnersForm,
  PasswordForm,
  ProfileForm,
  ResetPasswordForm,
  ServiceForm,
  TemplatesForm,
} from "@/components/settings/SettingsForms";
import {
  addUser,
  changePassword,
  deleteService,
  loadDemoData,
  regenerateCalendarToken,
  removeDemoData,
  resetUserPassword,
  saveCompany,
  saveInvoicing,
  saveMailSettings,
  saveMailTemplates,
  saveOAuthApps,
  savePartners,
  saveService,
  setUserActive,
  testMailConnection,
  updateProfile,
  generateWebsiteKey,
} from "@/lib/actions/settings";
import { getSetting } from "@/lib/settings";
import { decrypt } from "@/lib/crypto";
import { appUrl } from "@/lib/env";
import { eur, fmtTimestamp } from "@/lib/format";
import { PROVIDERS, redirectUri } from "@/lib/integrations/config";

export const metadata = { title: "Einstellungen" };

const ENV_KEYS: Record<string, [string, string]> = {
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  instagram: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"],
  meta: ["META_APP_ID", "META_APP_SECRET"],
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  googleAds: ["GOOGLE_ADS_LOGIN_CUSTOMER_ID", "GOOGLE_ADS_DEVELOPER_TOKEN"],
  googlePlaces: ["", "GOOGLE_PLACES_API_KEY"],
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await requireUser();
  const { tab = "profil" } = await searchParams;
  const [company, partners, invoicing, mail, templates, oauthApps, setup, team, serviceRows, demoCount, website] = await Promise.all([
    getSetting("company"),
    getSetting("partners"),
    getSetting("invoicing"),
    getSetting("mail"),
    getSetting("mailTemplates"),
    getSetting("oauthApps"),
    getSetting("setup"),
    db.select().from(users).orderBy(asc(users.createdAt)),
    db.select().from(services).orderBy(asc(services.sortOrder), asc(services.name)),
    db.$count(customers, eq(customers.isDemo, true)),
    getSetting("website"),
  ]);
  const websiteKeyValue = decrypt(website.key) || "";
  const websiteKeyFromEnv = !websiteKeyValue && !!process.env.WEBSITE_SCHLUESSEL;
  const href = (t: string) => `/einstellungen?tab=${t}`;
  const appsView = Object.fromEntries(
    Object.keys(ENV_KEYS).map((k) => {
      const stored = oauthApps[k];
      const envSecret = process.env[ENV_KEYS[k][1]];
      return [k, { clientId: stored?.clientId || process.env[ENV_KEYS[k][0]] || "", hasSecret: !!stored?.clientSecret || !!envSecret, fromEnv: !stored?.clientSecret && !!envSecret }];
    }),
  );
  const redirects: Record<string, string[]> = {
    instagram: [redirectUri("instagram")],
    tiktok: [redirectUri("tiktok")],
    meta: [redirectUri("facebook"), redirectUri("meta_ads")],
    google: [redirectUri("google_ads"), redirectUri("google_business")],
  };

  return (
    <>
      <PageHeader title="Einstellungen" />
      <Tabs
        className="mb-6"
        active={tab}
        tabs={[
          { key: "profil", label: "Profil & Team", href: href("profil") },
          { key: "firma", label: "Firma & GbR", href: href("firma") },
          { key: "rechnungen", label: "Rechnungen & Steuern", href: href("rechnungen") },
          { key: "leistungen", label: "Leistungskatalog", href: href("leistungen") },
          { key: "email", label: "E-Mail", href: href("email") },
          { key: "anbindungen", label: "Anbindungen", href: href("anbindungen") },
          { key: "daten", label: "Daten & Sicherung", href: href("daten") },
        ]}
      />

      {tab === "profil" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Mein Profil" />
              <CardBody><ProfileForm action={updateProfile} user={{ name: me.name, email: me.email, color: me.color }} /></CardBody>
            </Card>
            <Card>
              <CardHeader title="Passwort ändern" icon={<KeyRound />} />
              <CardBody><PasswordForm action={changePassword} /></CardBody>
            </Card>
            <Card>
              <CardHeader title="Mein Kalender-Abo" description="Persönlicher Link für Google/Apple/Outlook-Kalender" />
              <CardBody className="space-y-3">
                <CopyField value={`${appUrl()}/api/calendar/${me.calendarToken}`} />
                <ActionButton action={regenerateCalendarToken} confirm="Neuen Link erzeugen? Bestehende Abos funktionieren dann nicht mehr.">Neuen Link erzeugen</ActionButton>
              </CardBody>
            </Card>
          </div>
          <Card className="self-start">
            <CardHeader
              title="Team"
              description="Wer hat Zugang zum Cockpit?"
              actions={<Modal title="Neuer Zugang" trigger={<Button size="sm"><UserPlus /> Zugang</Button>}><AddUserForm action={addUser} /></Modal>}
            />
            <div className="divide-y divide-line">
              {team.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={u.name} color={u.color} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {u.name} {u.id === me.id && <Badge tone="accent">Du</Badge>} {!u.active && <Badge tone="red">deaktiviert</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted">{u.email} · {u.role === "inhaber" ? "Inhaber" : "Mitarbeiter"} · zuletzt {u.lastLoginAt ? fmtTimestamp(u.lastLoginAt) : "nie"}</p>
                  </div>
                  {u.id !== me.id && (
                    <div className="flex gap-1">
                      <Modal title={`Passwort für ${u.name}`} size="sm" trigger={<Button size="sm" variant="ghost">Passwort</Button>}>
                        <ResetPasswordForm action={resetUserPassword.bind(null, u.id)} />
                      </Modal>
                      <ActionButton action={setUserActive.bind(null, u.id, !u.active)} variant="ghost">{u.active ? "Deaktivieren" : "Aktivieren"}</ActionButton>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "firma" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader title="Firmendaten" description="Erscheinen auf Angeboten, Rechnungen, E-Rechnungen und im Kunden-Report" />
            <CardBody><CompanyForm action={saveCompany} company={company} /></CardBody>
          </Card>
          <Card className="self-start">
            <CardHeader title="Gesellschafter & Gewinnverteilung" description="Für die Gewinnverteilung in der Auswertung (laut Gesellschaftsvertrag)" />
            <CardBody><PartnersForm action={savePartners} partners={partners} /></CardBody>
          </Card>
        </div>
      )}

      {tab === "rechnungen" && (
        <Card>
          <CardHeader title="Rechnungen, Angebote & Steuern" />
          <CardBody><InvoicingForm action={saveInvoicing} s={invoicing} /></CardBody>
        </Card>
      )}

      {tab === "leistungen" && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Leistungskatalog"
            description="Eure Standard-Leistungen mit Preisen – mit einem Klick in Angebote und Rechnungen übernehmen"
            actions={<Modal title="Neue Leistung" trigger={<Button size="sm"><Plus /> Leistung</Button>}><ServiceForm action={saveService.bind(null, null)} /></Modal>}
          />
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Leistung</th><th>Kategorie</th><th>Einheit</th><th className="text-right">Preis netto</th><th>USt</th><th /></tr></thead>
              <tbody>
                {serviceRows.map((s) => (
                  <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                    <td><p className="font-medium">{s.name}</p>{s.description && <p className="max-w-md truncate text-xs text-muted">{s.description}</p>}</td>
                    <td className="text-fg-2">{s.category ?? "–"}</td>
                    <td>{s.unit}</td>
                    <td className="text-right num">{s.unitPrice ? eur(s.unitPrice) : <span className="text-amber-700 dark:text-amber-300">Preis fehlt</span>}</td>
                    <td>{s.taxRate} %</td>
                    <td className="text-right whitespace-nowrap">
                      <Modal title="Leistung bearbeiten" trigger={<Button size="icon" variant="ghost" className="size-8" aria-label="Bearbeiten"><Pencil /></Button>}>
                        <ServiceForm action={saveService.bind(null, s.id)} service={s} />
                      </Modal>
                      <ActionButton action={deleteService.bind(null, s.id)} confirm="Leistung löschen?" variant="ghost" title="Löschen"><Trash2 /></ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "email" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="self-start">
            <CardHeader title="Postfach verbinden" description="Zugangsdaten findet ihr bei eurem Mail-Anbieter (IONOS, Strato, Google Workspace: App-Passwort nutzen)" actions={<ActionButton action={testMailConnection}>Verbindung testen</ActionButton>} />
            <CardBody>
              <MailForm
                action={saveMailSettings}
                m={{ ...mail, hasSmtpPassword: !!mail.smtpPassword, hasImapPassword: !!mail.imapPassword }}
              />
            </CardBody>
          </Card>
          <Card className="self-start">
            <CardHeader title="E-Mail-Vorlagen" />
            <CardBody><TemplatesForm action={saveMailTemplates} t={templates} /></CardBody>
          </Card>
        </div>
      )}

      {tab === "anbindungen" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader title="Eigene Entwickler-Apps" description="Einmalig einrichten – danach verbindet ihr beim jeweiligen Kunden nur noch per Klick dessen Konten." />
            <CardBody><OAuthAppsForm action={saveOAuthApps} apps={appsView} redirects={redirects} /></CardBody>
          </Card>
          <div className="space-y-6 self-start">
            <Card>
              <CardHeader title="Website-Anfragen" description="Anfragen aus dem Kontaktformular eurer Website landen automatisch als Interessent im Cockpit – mit Aufgabe „Rückmeldung“." />
              <CardBody className="space-y-3 text-sm">
                {websiteKeyValue || websiteKeyFromEnv ? (
                  <>
                    <p className="text-xs text-muted">In Vercel beim Projekt <strong>rother-marketing-website</strong> unter Settings → Environment Variables eintragen und neu deployen:</p>
                    <div>
                      <p className="label">COCKPIT_URL</p>
                      <CopyField value={appUrl()} />
                    </div>
                    {websiteKeyValue ? (
                      <div>
                        <p className="label">COCKPIT_SCHLUESSEL</p>
                        <CopyField value={websiteKeyValue} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted">Schlüssel kommt aus der Umgebungsvariable WEBSITE_SCHLUESSEL.</p>
                    )}
                    <p className="text-xs text-muted">
                      {website.received ? `${website.received} Anfrage${website.received === 1 ? "" : "n"} empfangen, zuletzt ${fmtTimestamp(website.lastReceivedAt)}.` : "Noch keine Anfrage empfangen."}
                    </p>
                    <ActionButton action={generateWebsiteKey} confirm="Neuen Schlüssel erzeugen? Der alte funktioniert dann nicht mehr – bitte danach bei der Website aktualisieren.">
                      Neuen Schlüssel erzeugen
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton action={generateWebsiteKey} variant="primary" size="md">
                    Verbindung einrichten
                  </ActionButton>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="So funktioniert's" />
              <CardBody className="space-y-3 text-sm text-fg-2">
                <p>1. Für jede Plattform eine eigene App im jeweiligen Entwicklerportal anlegen und hier eintragen.</p>
                <p>2. Beim Kunden unter „Anbindungen & Report“ auf „Verbinden“ klicken – der Kunde (oder ihr mit seinem Zugang) meldet sich an und erlaubt den Lesezugriff.</p>
                <p>3. Das Cockpit holt danach täglich automatisch Follower, Aufrufe, Klicks und Werbezahlen.</p>
                <p className="text-xs text-muted">Bis die Apps freigegeben sind, könnt ihr alle Zahlen auch manuell erfassen – Auswertungen und Kunden-Report funktionieren genauso.</p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Plattformen" />
              <div className="divide-y divide-line text-sm">
                {PROVIDERS.map((p) => (
                  <div key={p.key} className="px-5 py-2.5">
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-muted">{p.needs}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "daten" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader title="Datensicherung" icon={<Database />} />
            <CardBody className="space-y-3 text-sm">
              <p className="text-fg-2">Exportiert alle Daten (Kunden, Verträge, Rechnungen, Zahlen …) als JSON-Datei. Dateien aus der Ablage bekommt ihr über „Finanzen → Export“ bzw. einzeln.</p>
              <LinkButton href="/api/export/backup" variant="secondary"><Download /> Sicherung herunterladen</LinkButton>
              <p className="text-xs text-muted">Datenbank: {process.env.DATABASE_URL?.startsWith("libsql") ? "Turso (online)" : "lokale Datei"}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Demo-Daten" description={setup.demoLoaded || demoCount ? `${demoCount} Demo-Kunden vorhanden` : "Keine Demo-Daten geladen"} />
            <CardBody className="space-y-3 text-sm">
              <p className="text-fg-2">Die Beispieldaten sind komplett erfunden und als „Demo“ markiert. Entfernt sie, bevor ihr richtig loslegt – eure eigenen Daten bleiben dabei unberührt.</p>
              <div className="flex flex-wrap gap-2">
                {demoCount ? (
                  <ActionButton action={removeDemoData} confirm="Alle Demo-Kunden inkl. Rechnungen, Content und Zahlen löschen?" variant="danger" size="md"><Trash2 /> Demo-Daten entfernen</ActionButton>
                ) : (
                  <ActionButton action={loadDemoData} size="md">Demo-Daten laden</ActionButton>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
