import Link from "next/link";
import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { FolderOpen, Search, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { customers, files, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { UploadForm } from "@/components/files/UploadForm";
import { FileTable } from "@/components/files/FileTable";
import { FILE_CATEGORIES } from "@/lib/constants";
import { fmtBytes } from "@/lib/format";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Ablage" };

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ ordner?: string; kunde?: string; q?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const term = sp.q?.trim();
  const [rows, counts, customerRows, team, [usage]] = await Promise.all([
    db
      .select({ file: files, customerName: customers.name })
      .from(files)
      .leftJoin(customers, eq(customers.id, files.customerId))
      .where(
        and(
          sp.ordner ? eq(files.category, sp.ordner) : undefined,
          sp.kunde === "intern" ? isNull(files.customerId) : sp.kunde ? eq(files.customerId, Number(sp.kunde)) : undefined,
          term ? or(like(files.name, `%${term}%`), like(files.notes, `%${term}%`)) : undefined,
        ),
      )
      .orderBy(desc(files.createdAt))
      .limit(500),
    db.select({ category: files.category, n: sql<number>`count(*)` }).from(files).groupBy(files.category),
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
    db.select({ id: users.id, name: users.name }).from(users),
    db.select({ size: sql<number>`coalesce(sum(${files.size}),0)`, n: sql<number>`count(*)` }).from(files),
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c.category, c.n]));
  const userNames = Object.fromEntries(team.map((u) => [u.id, u.name]));
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ordner: sp.ordner, kunde: sp.kunde, q: term, ...patch })) if (v) p.set(k, v);
    return `/ablage${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Ablage"
        description={`Verträge, Angebote, Rechnungen, Belege und alles andere an einem Ort · ${usage.n} Dateien, ${fmtBytes(usage.size)}`}
        actions={
          <Modal title="Dateien hochladen" trigger={<Button><Upload /> Hochladen</Button>}>
            <UploadForm customers={customerRows} defaultCustomerId={sp.kunde && sp.kunde !== "intern" ? Number(sp.kunde) : undefined} defaultCategory={sp.ordner} />
          </Modal>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-0.5">
          <Link href={link({ ordner: undefined })} className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm", !sp.ordner ? "bg-surface font-medium shadow-xs ring-1 ring-line" : "text-fg-2 hover:bg-surface-3")}>
            <span className="flex items-center gap-2"><FolderOpen className="size-4 text-muted" /> Alle Dateien</span>
            <span className="text-xs text-muted num">{usage.n}</span>
          </Link>
          {FILE_CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={link({ ordner: c.value })}
              className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm", sp.ordner === c.value ? "bg-surface font-medium shadow-xs ring-1 ring-line" : "text-fg-2 hover:bg-surface-3")}
            >
              <span className="flex items-center gap-2"><FolderOpen className="size-4 text-muted" /> {c.label}</span>
              <span className="text-xs text-muted num">{countMap[c.value] ?? 0}</span>
            </Link>
          ))}
        </nav>
        <div>
          <form className="mb-4 flex flex-wrap gap-2">
            {sp.ordner && <input type="hidden" name="ordner" value={sp.ordner} />}
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input name="q" defaultValue={term} placeholder="Dateiname oder Notiz …" className="input pl-9" />
            </div>
            <select name="kunde" defaultValue={sp.kunde ?? ""} className="input w-auto" aria-label="Kunde">
              <option value="">Alle Kunden</option>
              <option value="intern">Intern / GbR</option>
              {customerRows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Button type="submit" variant="secondary">Filtern</Button>
          </form>
          <Card className="overflow-hidden">
            {rows.length === 0 ? (
              <EmptyState icon={<FolderOpen />} title="Keine Dateien" description="Rechnungen, angenommene Angebote, Verträge und Belege landen automatisch hier. Alles andere könnt ihr hochladen." />
            ) : (
              <FileTable rows={rows} customers={customerRows} userNames={userNames} />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
