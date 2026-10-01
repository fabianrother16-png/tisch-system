import { notFound } from "next/navigation";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { Download, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { customers, linkClicks, trackingLinks } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CopyField } from "@/components/ui/CopyField";
import { ActionButton } from "@/components/ui/form";
import { TrendChart } from "@/components/charts/Charts";
import { LinkForm } from "@/components/links/LinkForm";
import { deleteLink, saveLink, toggleLink } from "@/lib/actions/links";
import { LINK_CHANNEL_MAP } from "@/lib/constants";
import { addDays, eachDay, todayISO } from "@/lib/dates";
import { fmtNumber, fmtRate, fmtTimestamp } from "@/lib/format";
import { appUrl } from "@/lib/env";

export default async function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  const [link] = await db.select().from(trackingLinks).where(eq(trackingLinks.id, id)).limit(1);
  if (!link) notFound();
  const today = todayISO();
  const from = addDays(today, -89);
  const [daily, devices, refs, last, customerRows] = await Promise.all([
    db.select({ date: linkClicks.date, n: sql<number>`count(*)` }).from(linkClicks).where(and(eq(linkClicks.linkId, id), gte(linkClicks.date, from))).groupBy(linkClicks.date),
    db.select({ device: linkClicks.device, n: sql<number>`count(*)` }).from(linkClicks).where(eq(linkClicks.linkId, id)).groupBy(linkClicks.device),
    db.select({ referrer: linkClicks.referrer, n: sql<number>`count(*)` }).from(linkClicks).where(eq(linkClicks.linkId, id)).groupBy(linkClicks.referrer).orderBy(desc(sql`count(*)`)).limit(6),
    db.select().from(linkClicks).where(eq(linkClicks.linkId, id)).orderBy(desc(linkClicks.at)).limit(1),
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
  ]);
  const dmap = new Map(daily.map((d) => [d.date, d.n]));
  const series = eachDay(from, today).map((d) => ({ date: d, n: dmap.get(d) ?? 0 }));
  const last30 = series.slice(-30).reduce((s, x) => s + x.n, 0);
  const prev30 = series.slice(-60, -30).reduce((s, x) => s + x.n, 0);
  const totalDevices = devices.reduce((s, d) => s + d.n, 0) || 1;
  const short = `${appUrl()}/go/${link.slug}`;
  const customer = customerRows.find((c) => c.id === link.customerId);

  return (
    <>
      <PageHeader
        back={{ href: "/links", label: "Tracking-Links" }}
        title={link.label}
        meta={
          <>
            <Badge>{LINK_CHANNEL_MAP[link.channel]?.label ?? link.channel}</Badge>
            {customer && <Badge tone="accent">{customer.name}</Badge>}
            {!link.active && <Badge tone="amber">pausiert</Badge>}
          </>
        }
        actions={
          <>
            <Modal title="Link bearbeiten" trigger={<Button variant="secondary"><Pencil /> Bearbeiten</Button>}>
              <LinkForm action={saveLink.bind(null, id)} link={link} customers={customerRows} baseUrl={appUrl()} />
            </Modal>
            <ActionButton action={toggleLink.bind(null, id, !link.active)} size="md">
              {link.active ? <><Pause /> Pausieren</> : <><Play /> Aktivieren</>}
            </ActionButton>
            <ActionButton action={deleteLink.bind(null, id)} confirm="Link löschen? Gedruckte QR-Codes/NFC-Karten funktionieren danach nicht mehr!" size="md" variant="ghost">
              <Trash2 />
            </ActionButton>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Klicks (30 Tage)" value={fmtNumber(last30)} change={prev30 ? ((last30 - prev30) / prev30) * 100 : null} hint="vs. 30 Tage davor" />
            <Stat label="Klicks gesamt" value={fmtNumber(link.clickCount)} />
            <Stat label="Letzter Klick" value={last[0] ? fmtTimestamp(last[0].at).split(",")[0] : "–"} hint={last[0] ? fmtTimestamp(last[0].at).split(", ")[1] : undefined} />
          </div>
          <Card>
            <CardHeader title="Klicks pro Tag" description="letzte 90 Tage" />
            <CardBody>
              <TrendChart data={series} xKey="date" xFormat="day" area height={240} series={[{ key: "n", name: "Klicks", color: "var(--chart-1)" }]} />
            </CardBody>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="Geräte" />
              <CardBody className="space-y-3">
                {devices.length === 0 && <p className="text-sm text-muted">Noch keine Klicks.</p>}
                {devices.map((d) => (
                  <div key={d.device ?? "?"}>
                    <div className="mb-1 flex justify-between text-sm"><span className="capitalize">{d.device ?? "unbekannt"}</span><span className="num">{fmtNumber(d.n)} · {fmtRate((d.n / totalDevices) * 100, 0)}</span></div>
                    <div className="h-1.5 rounded-full bg-surface-3"><div className="h-full rounded-full" style={{ width: `${(d.n / totalDevices) * 100}%`, background: "var(--chart-1)" }} /></div>
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Herkunft" description="Seite, von der geklickt wurde" />
              <div className="divide-y divide-line">
                {refs.length === 0 && <p className="px-5 py-4 text-sm text-muted">Noch keine Klicks.</p>}
                {refs.map((r) => (
                  <div key={r.referrer ?? "direkt"} className="flex justify-between px-5 py-2.5 text-sm">
                    <span className="truncate">{r.referrer ?? "direkt / NFC / QR / App"}</span>
                    <span className="num">{fmtNumber(r.n)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Kurz-Link" />
            <CardBody className="space-y-3">
              <CopyField value={short} />
              <p className="truncate text-xs text-muted">leitet weiter auf: {link.targetUrl}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="QR-Code" description="Für Flyer, Aufsteller, Visitenkarten" />
            <CardBody className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/links/${id}/qr`} alt={`QR-Code für ${short}`} className="mx-auto w-56 rounded-lg border border-line bg-white p-2" />
              <div className="grid grid-cols-2 gap-2">
                <LinkButton href={`/api/links/${id}/qr?download=1`} size="sm"><Download /> PNG</LinkButton>
                <LinkButton href={`/api/links/${id}/qr?format=svg&download=1`} size="sm"><Download /> SVG (Druck)</LinkButton>
              </div>
              <p className="text-xs text-muted">Für NFC-Karten einfach den Kurz-Link auf die Karte schreiben (z. B. mit der App „NFC Tools“). Das Ziel könnt ihr später jederzeit ändern, ohne die Karte neu zu beschreiben.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
