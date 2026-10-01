import { count, desc, eq } from "drizzle-orm";
import { ClipboardPen, Plus, RefreshCw } from "lucide-react";
import { db } from "@/lib/db";
import { integrations, posts, type Customer } from "@/lib/db/schema";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Tabs";
import { ActionButton } from "@/components/ui/form";
import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";
import { PostForm } from "@/components/performance/PostForm";
import { MetricsForm } from "@/components/performance/MetricsForm";
import { PostsTable } from "@/components/performance/PostsTable";
import { saveAccountMetrics, savePost, syncCustomerNow } from "@/lib/actions/performance";
import { buildPerformanceData } from "@/lib/domain/report";
import { RANGE_OPTIONS } from "@/lib/domain/performance";
import { todayISO } from "@/lib/dates";

export async function PerformanceTab({ customer, range }: { customer: Customer; range?: string }) {
  const id = customer.id;
  const today = todayISO();
  const [data, recent, [conn]] = await Promise.all([
    buildPerformanceData(id, range),
    db.select().from(posts).where(eq(posts.customerId, id)).orderBy(desc(posts.publishedAt)).limit(50),
    db.select({ n: count() }).from(integrations).where(eq(integrations.customerId, id)),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          active={data.range.key}
          items={RANGE_OPTIONS.map((o) => ({ key: o.key, label: o.label, href: `/kunden/${id}?tab=performance&zeitraum=${o.key}` }))}
        />
        <div className="flex flex-wrap gap-2">
          {(conn.n > 0 || customer.googlePlaceId) && (
            <ActionButton action={syncCustomerNow.bind(null, id)} size="md">
              <RefreshCw /> Jetzt aktualisieren
            </ActionButton>
          )}
          <Modal title="Kennzahlen eintragen" size="lg" trigger={<Button variant="secondary"><ClipboardPen /> Kennzahlen eintragen</Button>}>
            <MetricsForm action={saveAccountMetrics.bind(null, id)} today={today} />
          </Modal>
          <Modal title="Beitrag erfassen" size="lg" trigger={<Button><Plus /> Beitrag</Button>}>
            <PostForm action={savePost.bind(null, id, null)} today={today} />
          </Modal>
        </div>
      </div>
      <PerformanceDashboard data={data} editable today={today} />
      {recent.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader title="Alle Beiträge" description="Die letzten 50 – Zahlen von manuell erfassten Beiträgen über das Stift-Symbol aktualisieren" />
          <PostsTable posts={recent} editable today={today} viralThreshold={data.viralThreshold} />
        </Card>
      )}
    </div>
  );
}
