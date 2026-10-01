import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { todayISO } from "@/lib/dates";

/** Vollständige Datensicherung als JSON (ohne Dateiinhalte und ohne gespeicherte Zugangstokens). */
export async function GET() {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const tables = {
    customers: schema.customers,
    contacts: schema.contacts,
    baselines: schema.baselines,
    contracts: schema.contracts,
    services: schema.services,
    quotes: schema.quotes,
    quoteItems: schema.quoteItems,
    invoices: schema.invoices,
    invoiceItems: schema.invoiceItems,
    payments: schema.payments,
    expenses: schema.expenses,
    contents: schema.contents,
    posts: schema.posts,
    postSnapshots: schema.postSnapshots,
    metricsDaily: schema.metricsDaily,
    adCampaigns: schema.adCampaigns,
    adStatsDaily: schema.adStatsDaily,
    trackingLinks: schema.trackingLinks,
    linkClicks: schema.linkClicks,
    events: schema.events,
    tasks: schema.tasks,
    activities: schema.activities,
    files: schema.files,
    emails: schema.emails,
  };
  const data: Record<string, unknown[]> = {};
  for (const [name, table] of Object.entries(tables)) data[name] = await db.select().from(table);
  const users = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role }).from(schema.users);
  const settings = (await db.select().from(schema.settings)).filter((s) => !["oauthApps", "mail"].includes(s.key));
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, users, settings, ...data }, null, 1);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="cockpit-sicherung-${todayISO()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
