import { notFound } from "next/navigation";
import { and, count, eq, inArray } from "drizzle-orm";
import { ExternalLink, FileText, Phone, Mail, Receipt, Globe, CalendarPlus, Clapperboard } from "lucide-react";
import { db } from "@/lib/db";
import { contacts, contents, contracts, customers, emails, files, invoices, posts, quotes, adCampaigns } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { CustomerMark } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { PlatformIcon } from "@/components/PlatformIcon";
import { CUSTOMER_STATUS_MAP } from "@/lib/constants";
import { OverviewTab } from "./_tabs/OverviewTab";
import { ContractsTab } from "./_tabs/ContractsTab";
import { TimelineTab } from "./_tabs/TimelineTab";
import { MasterDataTab } from "./_tabs/MasterDataTab";
import { PerformanceTab } from "./_tabs/PerformanceTab";
import { ContentTab } from "./_tabs/ContentTab";
import { AdsTab } from "./_tabs/AdsTab";
import { FinanceTab } from "./_tabs/FinanceTab";
import { FilesTab } from "./_tabs/FilesTab";
import { ConnectTab } from "./_tabs/ConnectTab";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, Number(id))).limit(1);
  return { title: c?.name ?? "Kunde" };
}

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const { id: idParam } = await params;
  const sp = await searchParams;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) notFound();
  const tab = sp.tab ?? "uebersicht";

  const [[contentCount], [postCount], [contractCount], [fileCount], [invoiceCount], [quoteCount], [mailCount], [adCount], primary] =
    await Promise.all([
      db.select({ n: count() }).from(contents).where(and(eq(contents.customerId, id))),
      db.select({ n: count() }).from(posts).where(eq(posts.customerId, id)),
      db.select({ n: count() }).from(contracts).where(and(eq(contracts.customerId, id), inArray(contracts.status, ["aktiv", "gekuendigt", "entwurf"]))),
      db.select({ n: count() }).from(files).where(eq(files.customerId, id)),
      db.select({ n: count() }).from(invoices).where(eq(invoices.customerId, id)),
      db.select({ n: count() }).from(quotes).where(eq(quotes.customerId, id)),
      db.select({ n: count() }).from(emails).where(eq(emails.customerId, id)),
      db.select({ n: count() }).from(adCampaigns).where(eq(adCampaigns.customerId, id)),
      db.select().from(contacts).where(and(eq(contacts.customerId, id), eq(contacts.isPrimary, true))).limit(1),
    ]);

  const base = `/kunden/${id}`;
  const tabs = [
    { key: "uebersicht", label: "Übersicht" },
    { key: "performance", label: "Performance", count: postCount.n },
    { key: "content", label: "Content", count: contentCount.n },
    { key: "werbung", label: "Werbung", count: adCount.n },
    { key: "vertraege", label: "Verträge", count: contractCount.n },
    { key: "finanzen", label: "Finanzen", count: invoiceCount.n + quoteCount.n },
    { key: "dateien", label: "Dateien", count: fileCount.n },
    { key: "verlauf", label: "Verlauf & Mails", count: mailCount.n },
    { key: "anbindungen", label: "Anbindungen & Report" },
    { key: "stammdaten", label: "Stammdaten" },
  ].map((t) => ({ ...t, href: t.key === "uebersicht" ? base : `${base}?tab=${t.key}` }));

  const channels = [
    customer.website && { href: customer.website, icon: <Globe className="size-4" />, label: "Website" },
    customer.instagramHandle && { href: `https://instagram.com/${customer.instagramHandle}`, icon: <PlatformIcon platform="instagram" />, label: `@${customer.instagramHandle}` },
    customer.tiktokHandle && { href: `https://tiktok.com/@${customer.tiktokHandle}`, icon: <PlatformIcon platform="tiktok" />, label: `@${customer.tiktokHandle}` },
    customer.facebookUrl && { href: customer.facebookUrl, icon: <PlatformIcon platform="facebook" />, label: "Facebook" },
    customer.youtubeUrl && { href: customer.youtubeUrl, icon: <PlatformIcon platform="youtube" />, label: "YouTube" },
    customer.googleBusinessUrl && { href: customer.googleBusinessUrl, icon: <PlatformIcon platform="google" />, label: "Google-Profil" },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[];

  const contactEmail = primary[0]?.email ?? customer.email;
  const contactPhone = primary[0]?.phone ?? customer.phone;

  return (
    <>
      <PageHeader
        back={{ href: "/kunden", label: "Kunden" }}
        title={
          <span className="flex items-center gap-4">
            <CustomerMark name={customer.name} color={customer.color} size="lg" />
            <span>{customer.name}</span>
          </span>
        }
        meta={
          <>
            <StatusBadge value={customer.status} map={CUSTOMER_STATUS_MAP} />
            <Badge>{customer.number}</Badge>
            {customer.industry && <span className="text-sm text-muted">{customer.industry}</span>}
            {customer.city && <span className="text-sm text-muted">· {customer.city}</span>}
            {customer.isDemo && <Badge tone="amber">Demo</Badge>}
          </>
        }
        actions={
          <>
            {contactEmail && (
              <LinkButton href={`/mail?neu=1&kunde=${id}`} size="md">
                <Mail /> E-Mail
              </LinkButton>
            )}
            {contactPhone && (
              <LinkButton href={`tel:${contactPhone.replace(/\s/g, "")}`} size="md">
                <Phone /> Anrufen
              </LinkButton>
            )}
            <LinkButton href={`/content?neu=1&kunde=${id}`}>
              <Clapperboard /> Content
            </LinkButton>
            <LinkButton href={`/kalender?neu=1&kunde=${id}`}>
              <CalendarPlus /> Termin
            </LinkButton>
            <LinkButton href={`/angebote/neu?kunde=${id}`}>
              <FileText /> Angebot
            </LinkButton>
            <LinkButton href={`/rechnungen/neu?kunde=${id}`} variant="primary">
              <Receipt /> Rechnung
            </LinkButton>
          </>
        }
      />

      {channels.length > 0 && (
        <div className="-mt-3 mb-5 flex flex-wrap gap-2">
          {channels.map((ch) => (
            <a
              key={ch.href}
              href={ch.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-fg-2 transition-colors hover:border-line-strong hover:text-fg"
            >
              {ch.icon}
              {ch.label}
              <ExternalLink className="size-3 text-muted" />
            </a>
          ))}
        </div>
      )}

      <Tabs tabs={tabs} active={tab} className="mb-6" />

      {tab === "uebersicht" && <OverviewTab customer={customer} />}
      {tab === "performance" && <PerformanceTab customer={customer} range={sp.zeitraum} />}
      {tab === "content" && <ContentTab customer={customer} />}
      {tab === "werbung" && <AdsTab customer={customer} range={sp.zeitraum} />}
      {tab === "vertraege" && <ContractsTab customer={customer} />}
      {tab === "finanzen" && <FinanceTab customer={customer} />}
      {tab === "dateien" && <FilesTab customer={customer} />}
      {tab === "verlauf" && <TimelineTab customer={customer} />}
      {tab === "anbindungen" && <ConnectTab customer={customer} flash={{ connected: sp.verbunden, error: sp.fehler }} />}
      {tab === "stammdaten" && <MasterDataTab customer={customer} currentUserId={user.id} />}
    </>
  );
}
