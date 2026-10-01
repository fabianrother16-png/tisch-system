import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, FileArchive, Landmark, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Tabs, Segmented } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { CustomerMark } from "@/components/ui/Avatar";
import { ColumnChart } from "@/components/charts/Charts";
import { customerProfitability, euerReport, monthlyOverview, openReceivables, vatReport } from "@/lib/domain/finance";
import { EXPENSE_CATEGORY_MAP } from "@/lib/constants";
import { diffDays, todayISO } from "@/lib/dates";
import { eur, fmtDate, fmtMonthShort, fmtRate, MONTHS } from "@/lib/format";

export const metadata = { title: "Finanzen" };

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ jahr?: string; tab?: string; ust?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const today = todayISO();
  const year = /^\d{4}$/.test(sp.jahr ?? "") ? sp.jahr! : today.slice(0, 4);
  const tab = sp.tab ?? "uebersicht";
  const base = (t: string) => `/finanzen?jahr=${year}${t === "uebersicht" ? "" : `&tab=${t}`}`;

  const [months, euer, vat, profit, open] = await Promise.all([
    monthlyOverview(year),
    euerReport(year),
    vatReport(year, sp.ust === "monat" ? "monat" : "quartal"),
    customerProfitability(`${year}-01-01`, `${year}-12-31`),
    openReceivables(),
  ]);
  const prevYearMonths = await monthlyOverview(String(Number(year) - 1));
  const prevIncome = prevYearMonths.reduce((s, m) => s + m.einnahmen, 0);
  const vatTotal = vat.periods.reduce((s, p) => s + p.zahllast, 0);
  const openTotal = open.reduce((s, o) => s + o.invoice.grossTotal - o.invoice.paidTotal, 0);

  return (
    <>
      <PageHeader
        title="Finanzen & Buchhaltung"
        description="Einnahmen, Ausgaben, Gewinn, Umsatzsteuer und alles für den Steuerberater."
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href={`/finanzen?jahr=${Number(year) - 1}${tab !== "uebersicht" ? `&tab=${tab}` : ""}`} size="icon" aria-label="Vorjahr"><ChevronLeft /></LinkButton>
            <span className="min-w-16 text-center text-lg font-semibold">{year}</span>
            <LinkButton href={`/finanzen?jahr=${Number(year) + 1}${tab !== "uebersicht" ? `&tab=${tab}` : ""}`} size="icon" aria-label="Folgejahr"><ChevronRight /></LinkButton>
          </div>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Einnahmen (netto, bezahlt)"
          value={eur(euer.einnahmenNetto)}
          change={prevIncome ? ((euer.einnahmenNetto - prevIncome) / prevIncome) * 100 : null}
          hint={prevIncome ? `vs. ${Number(year) - 1}` : undefined}
          icon={<TrendingUp />}
        />
        <Stat label="Ausgaben (netto)" value={eur(euer.ausgabenNetto)} icon={<Wallet />} />
        <Stat label="Gewinn" value={eur(euer.gewinn)} hint={euer.einnahmenNetto ? `Marge ${fmtRate((euer.gewinn / euer.einnahmenNetto) * 100, 0)}` : undefined} icon={<PiggyBank />} />
        <Stat label={vat.kleinunternehmer ? "Umsatzsteuer" : "USt-Zahllast (Jahr)"} value={vat.kleinunternehmer ? "§ 19 UStG" : eur(vatTotal)} hint={vat.kleinunternehmer ? "Kleinunternehmer" : `${vat.taxation === "ist" ? "Ist" : "Soll"}-Versteuerung`} icon={<Landmark />} />
      </div>

      <Tabs
        className="mb-6"
        active={tab}
        tabs={[
          { key: "uebersicht", label: "Übersicht", href: base("uebersicht") },
          { key: "euer", label: "EÜR & Gewinnverteilung", href: base("euer") },
          { key: "ust", label: "Umsatzsteuer", href: base("ust") },
          { key: "kunden", label: "Umsatz je Kunde", href: base("kunden") },
          { key: "offen", label: "Offene Posten", href: base("offen"), count: open.length },
          { key: "export", label: "Export für Steuerberater", href: base("export") },
        ]}
      />

      {tab === "uebersicht" && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Einnahmen und Ausgaben pro Monat" description="netto, nach Zahlungsdatum" />
            <CardBody>
              <ColumnChart
                data={months.map((m) => ({ ...m, label: fmtMonthShort(m.month) }))}
                xKey="label"
                format="eur"
                series={[
                  { key: "einnahmen", name: "Einnahmen", color: "var(--chart-1)" },
                  { key: "ausgaben", name: "Ausgaben", color: "var(--chart-2)" },
                ]}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Gewinn pro Monat" />
            <div className="divide-y divide-line">
              {months.map((m) => (
                <div key={m.month} className="flex items-center justify-between px-5 py-2 text-sm">
                  <span className="text-muted">{MONTHS[Number(m.month.slice(5, 7)) - 1]}</span>
                  <span className={`font-medium num ${m.gewinn < 0 ? "text-red-600 dark:text-red-400" : ""}`}>{m.einnahmen || m.ausgaben ? eur(m.gewinn) : "–"}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-surface-2 px-5 py-2.5 text-sm font-semibold">
                <span>Gesamt</span>
                <span className="num">{eur(euer.gewinn)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "euer" && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title={`Einnahmen-Überschuss-Rechnung ${year}`} description="Vereinfachte Darstellung nach Zufluss-/Abflussprinzip (netto). Ersetzt nicht die Anlage EÜR – ist aber die perfekte Vorlage dafür." />
            <div className="overflow-x-auto">
              <table className="table">
                <tbody>
                  <tr className="bg-surface-2"><td className="font-semibold">Betriebseinnahmen (netto)</td><td className="text-right font-semibold num">{eur(euer.einnahmenNetto)}</td></tr>
                  <tr><td className="pl-8 text-muted">vereinnahmte Umsatzsteuer</td><td className="text-right text-muted num">{eur(euer.ustVereinnahmt)}</td></tr>
                  <tr className="bg-surface-2"><td className="font-semibold">Betriebsausgaben (netto)</td><td className="text-right font-semibold num">{eur(euer.ausgabenNetto)}</td></tr>
                  {euer.categories.map(([cat, v]) => (
                    <tr key={cat}><td className="pl-8">{EXPENSE_CATEGORY_MAP[cat]?.label ?? cat}</td><td className="text-right num">{eur(v)}</td></tr>
                  ))}
                  <tr><td className="pl-8 text-muted">gezahlte Vorsteuer</td><td className="text-right text-muted num">{eur(euer.vorsteuer)}</td></tr>
                  <tr className="border-t-2 border-fg"><td className="text-base font-semibold">Gewinn / Verlust</td><td className={`text-right text-base font-semibold num ${euer.gewinn < 0 ? "text-red-600" : ""}`}>{eur(euer.gewinn)}</td></tr>
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <CardHeader title="Gewinnverteilung GbR" description="laut Anteilen in den Einstellungen" />
            <CardBody className="space-y-4">
              {euer.partners.map((p) => (
                <div key={p.name} className="flex items-baseline justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.share} % Anteil</p>
                  </div>
                  <p className="text-lg font-semibold num">{eur(p.amount)}</p>
                </div>
              ))}
              <p className="border-t border-line pt-3 text-xs text-muted">
                Für die gesonderte und einheitliche Gewinnfeststellung (Formular ESt 1 B). Sonderbetriebsausgaben einzelner Gesellschafter
                sind hier nicht enthalten.
              </p>
              <Link href="/einstellungen?tab=firma" className="text-xs font-medium text-accent hover:underline">Anteile anpassen</Link>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "ust" && (
        <Card className="overflow-hidden">
          <CardHeader
            title={`Umsatzsteuer ${year}`}
            description={
              vat.kleinunternehmer
                ? "Ihr seid als Kleinunternehmer (§ 19 UStG) eingestellt – es fällt keine Umsatzsteuer an und Vorsteuer kann nicht gezogen werden."
                : `${vat.taxation === "ist" ? "Ist-Versteuerung: Umsatzsteuer wird fällig, wenn das Geld eingeht." : "Soll-Versteuerung: Umsatzsteuer wird mit Rechnungsdatum fällig."} Werte für die Voranmeldung in ELSTER (Kennzahlen 81, 86, 66).`
            }
            actions={
              <Segmented
                active={sp.ust === "monat" ? "monat" : "quartal"}
                items={[
                  { key: "quartal", label: "Quartal", href: `${base("ust")}` },
                  { key: "monat", label: "Monat", href: `${base("ust")}&ust=monat` },
                ]}
              />
            }
          />
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Zeitraum</th>
                  <th className="text-right">Umsätze 19 % (Kz. 81)</th>
                  <th className="text-right">Umsätze 7 % (Kz. 86)</th>
                  <th className="text-right">Umsatzsteuer</th>
                  <th className="text-right">Vorsteuer (Kz. 66)</th>
                  <th className="text-right">Zahllast</th>
                </tr>
              </thead>
              <tbody>
                {vat.periods.map((p) => (
                  <tr key={p.key}>
                    <td className="font-medium">{p.label}</td>
                    <td className="text-right num">{eur(p.base19)}</td>
                    <td className="text-right num">{eur(p.base7)}</td>
                    <td className="text-right num">{eur(p.ust)}</td>
                    <td className="text-right num">{eur(p.vorsteuer)}</td>
                    <td className={`text-right font-semibold num ${p.zahllast < 0 ? "text-emerald-600" : ""}`}>{eur(p.zahllast)}</td>
                  </tr>
                ))}
                <tr className="bg-surface-2 font-semibold">
                  <td>Summe</td>
                  <td className="text-right num">{eur(vat.periods.reduce((s, p) => s + p.base19, 0))}</td>
                  <td className="text-right num">{eur(vat.periods.reduce((s, p) => s + p.base7, 0))}</td>
                  <td className="text-right num">{eur(vat.periods.reduce((s, p) => s + p.ust, 0))}</td>
                  <td className="text-right num">{eur(vat.periods.reduce((s, p) => s + p.vorsteuer, 0))}</td>
                  <td className="text-right num">{eur(vatTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Negative Zahllast = Erstattung vom Finanzamt. Bitte vor der Abgabe mit euren Kontoauszügen abgleichen.</p>
        </Card>
      )}

      {tab === "kunden" && (
        <Card className="overflow-hidden">
          <CardHeader title={`Umsatz und Deckungsbeitrag je Kunde ${year}`} description="Bezahlte Umsätze (netto) minus Ausgaben, die dem Kunden zugeordnet sind (z. B. Freelancer, Fahrtkosten)." />
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Kunde</th>
                  <th className="text-right">Umsatz</th>
                  <th className="min-w-40">Anteil</th>
                  <th className="text-right">Kosten</th>
                  <th className="text-right">Deckungsbeitrag</th>
                  <th className="text-right">Marge</th>
                </tr>
              </thead>
              <tbody>
                {profit.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted">Noch keine Zahlungseingänge in {year}.</td></tr>
                )}
                {profit.map((r) => {
                  const total = profit.reduce((s, x) => s + x.umsatz, 0) || 1;
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/kunden/${r.id}?tab=finanzen`} className="flex items-center gap-2 font-medium hover:text-accent">
                          <CustomerMark name={r.name} color={r.color} size="sm" />
                          {r.name}
                        </Link>
                      </td>
                      <td className="text-right font-medium num">{eur(r.umsatz)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-surface-3">
                            <div className="h-full rounded-full" style={{ width: `${(r.umsatz / total) * 100}%`, background: "var(--chart-1)" }} />
                          </div>
                          <span className="w-10 text-right text-xs text-muted num">{fmtRate((r.umsatz / total) * 100, 0)}</span>
                        </div>
                      </td>
                      <td className="text-right text-muted num">{eur(r.kosten)}</td>
                      <td className="text-right font-medium num">{eur(r.deckungsbeitrag)}</td>
                      <td className="text-right num">{fmtRate(r.marge, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "offen" && (
        <Card className="overflow-hidden">
          <CardHeader title="Offene Posten" description={`Insgesamt ${eur(openTotal)} offen`} />
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Rechnung</th><th>Kunde</th><th>Fällig</th><th>Alter</th><th className="text-right">Offen</th></tr>
              </thead>
              <tbody>
                {open.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">Keine offenen Posten 🎉</td></tr>}
                {open
                  .sort((a, b) => (a.invoice.dueDate ?? "").localeCompare(b.invoice.dueDate ?? ""))
                  .map(({ invoice: i, customer: c }) => {
                    const days = i.dueDate ? diffDays(today, i.dueDate) : 0;
                    return (
                      <tr key={i.id} className="row-link relative">
                        <td className="font-medium"><Link href={`/rechnungen/${i.id}`} className="after:absolute after:inset-0">{i.number}</Link></td>
                        <td>{c.name}</td>
                        <td>{fmtDate(i.dueDate)}</td>
                        <td>
                          {days > 0 ? (
                            <Badge tone={days > 30 ? "red" : "amber"}>{days} Tage überfällig</Badge>
                          ) : (
                            <Badge tone="neutral">noch {Math.abs(days)} Tage</Badge>
                          )}
                        </td>
                        <td className="text-right font-medium num">{eur(i.grossTotal - i.paidTotal)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "export" && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { href: `/api/export/einnahmen?jahr=${year}`, title: "Einnahmen (CSV)", text: "Alle Zahlungseingänge mit Rechnungsnummer, Kunde, Netto, USt und Brutto.", icon: <Download /> },
            { href: `/api/export/ausgaben?jahr=${year}`, title: "Ausgaben (CSV)", text: "Alle Ausgaben mit Kategorie, Netto, Vorsteuer, Brutto und Beleg-Hinweis.", icon: <Download /> },
            { href: `/api/export/belege?jahr=${year}`, title: "Belege & Rechnungen (ZIP)", text: "Alle Rechnungs-PDFs und hochgeladenen Belege des Jahres in einem Ordner – ideal für den Steuerberater.", icon: <FileArchive /> },
          ].map((e) => (
            <Card key={e.href} className="flex flex-col p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent [&_svg]:size-5">{e.icon}</div>
              <p className="font-semibold">{e.title}</p>
              <p className="mt-1 flex-1 text-sm text-muted">{e.text}</p>
              <LinkButton href={e.href} className="mt-4" variant="secondary">Herunterladen ({year})</LinkButton>
            </Card>
          ))}
          <Card className="p-5 md:col-span-3">
            <p className="text-sm text-muted">
              Tipp: Die CSV-Dateien öffnen sich direkt in Excel/Numbers (Semikolon-getrennt, deutsches Zahlenformat). Für DATEV kann euer
              Steuerberater die Dateien über den Buchungsstapel-Import einlesen oder ihr nutzt den E-Rechnungs-Export (XRechnung) je Rechnung.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
