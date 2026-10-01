import Link from "next/link";
import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { Link2, Plus, QrCode } from "lucide-react";
import { db } from "@/lib/db";
import { customers, linkClicks, trackingLinks } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { CustomerMark } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkForm } from "@/components/links/LinkForm";
import { saveLink } from "@/lib/actions/links";
import { LINK_CHANNEL_MAP } from "@/lib/constants";
import { addDays, todayISO } from "@/lib/dates";
import { fmtNumber } from "@/lib/format";
import { appUrl } from "@/lib/env";

export const metadata = { title: "Tracking-Links" };

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ neu?: string; kunde?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const since = addDays(todayISO(), -29);
  const [rows, recent, customerRows] = await Promise.all([
    db.select({ link: trackingLinks, customer: customers }).from(trackingLinks).leftJoin(customers, eq(customers.id, trackingLinks.customerId)).orderBy(desc(trackingLinks.createdAt)),
    db.select({ linkId: linkClicks.linkId, n: sql<number>`count(*)` }).from(linkClicks).where(gte(linkClicks.date, since)).groupBy(linkClicks.linkId),
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
  ]);
  const recentMap = new Map(recent.map((r) => [r.linkId, r.n]));
  const base = appUrl();
  return (
    <>
      <PageHeader
        title="Tracking-Links & QR-Codes"
        description="Eigene Kurzlinks für NFC-Bewertungskarten, Google-Profil, Bio-Links und Flyer – jeder Klick wird gezählt."
        actions={
          <Modal title="Neuer Tracking-Link" defaultOpen={sp.neu === "1"} trigger={<Button><Plus /> Neuer Link</Button>}>
            <LinkForm action={saveLink.bind(null, null)} customers={customerRows} baseUrl={base} defaultCustomerId={sp.kunde ? Number(sp.kunde) : undefined} />
          </Modal>
        }
      />
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Link2 />}
            title="Noch keine Tracking-Links"
            description="Beispiel: Legt für jede NFC-Bewertungskarte einen Link an, der auf den Google-Bewertungslink des Kunden weiterleitet. So seht ihr, wie oft die Karte genutzt wird – und könnt das dem Kunden zeigen."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Link</th><th>Kunde</th><th>Kanal</th><th>Kurz-Adresse</th><th className="text-right">30 Tage</th><th className="text-right">Gesamt</th><th /></tr>
              </thead>
              <tbody>
                {rows.map(({ link: l, customer: c }) => (
                  <tr key={l.id} className="row-link relative">
                    <td>
                      <Link href={`/links/${l.id}`} className="after:absolute after:inset-0">
                        <span className="block font-medium">{l.label}</span>
                        <span className="block max-w-72 truncate text-xs text-muted">→ {l.targetUrl}</span>
                      </Link>
                    </td>
                    <td>{c ? <span className="flex items-center gap-2"><CustomerMark name={c.name} color={c.color} size="sm" />{c.name}</span> : <span className="text-muted">intern</span>}</td>
                    <td><Badge>{LINK_CHANNEL_MAP[l.channel]?.label ?? l.channel}</Badge></td>
                    <td className="font-mono text-xs">/go/{l.slug}{!l.active && <Badge tone="amber" className="ml-2">pausiert</Badge>}</td>
                    <td className="text-right font-medium num">{fmtNumber(recentMap.get(l.id) ?? 0)}</td>
                    <td className="text-right num">{fmtNumber(l.clickCount)}</td>
                    <td className="text-right"><QrCode className="ml-auto size-4 text-muted" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
