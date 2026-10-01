import { and, desc, eq, gte, like } from "drizzle-orm";
import { db } from "../db";
import { activities, customers, tasks } from "../db/schema";

/** Website-Anfragen der letzten 3 Tage, deren Rückmelde-Aufgabe noch offen ist */
export async function recentWebsiteInquiries() {
  const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const [rows, open] = await Promise.all([
    db
      .select({ a: activities, name: customers.name })
      .from(activities)
      .innerJoin(customers, eq(customers.id, activities.customerId))
      .where(and(eq(activities.kind, "anfrage"), gte(activities.createdAt, since)))
      .orderBy(desc(activities.createdAt)),
    db
      .select({ customerId: tasks.customerId })
      .from(tasks)
      .where(and(eq(tasks.status, "offen"), like(tasks.title, "Rückmeldung an%"))),
  ]);
  const openSet = new Set(open.map((t) => t.customerId));
  // Pro Kunde nur der neueste Eintrag
  const seen = new Set<number | null>();
  return rows.filter(({ a }) => {
    if (!openSet.has(a.customerId) || seen.has(a.customerId)) return false;
    seen.add(a.customerId);
    return true;
  });
}
