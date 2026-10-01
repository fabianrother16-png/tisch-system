import { and, count, eq, gte, inArray, isNull, lt, lte, or } from "drizzle-orm";
import { db } from "../db";
import { contracts, customers, emails, invoices, tasks } from "../db/schema";
import { addDays, todayISO } from "../dates";
import { contractTerm } from "./contracts";

export async function getNavBadges(userId: number): Promise<Record<string, number>> {
  const today = todayISO();
  const [[overdue], [openTasks], [unread], activeContracts, [newLeads]] = await Promise.all([
    db
      .select({ n: count() })
      .from(invoices)
      .where(and(inArray(invoices.status, ["offen", "teilbezahlt"]), lt(invoices.dueDate, today))),
    db
      .select({ n: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.status, "offen"),
          or(eq(tasks.assigneeId, userId), isNull(tasks.assigneeId)),
          lte(tasks.dueDate, today),
        ),
      ),
    db.select({ n: count() }).from(emails).where(and(eq(emails.direction, "ein"), eq(emails.isRead, false))),
    db.select().from(contracts).where(eq(contracts.status, "aktiv")),
    db
      .select({ n: count() })
      .from(customers)
      .where(and(eq(customers.status, "lead"), eq(customers.source, "Website-Kontaktformular"), gte(customers.createdAt, new Date(Date.now() - 7 * 86400000).toISOString()))),
  ]);
  const soon = addDays(today, 30);
  const contractAlerts = activeContracts.filter((c) => {
    const t = contractTerm(c, today);
    return t.noticeDeadline != null && t.noticeDeadline >= today && t.noticeDeadline <= soon;
  }).length;
  return {
    invoices: overdue.n,
    tasks: openTasks.n,
    mail: unread.n,
    contracts: contractAlerts,
    leads: newLeads.n,
  };
}
