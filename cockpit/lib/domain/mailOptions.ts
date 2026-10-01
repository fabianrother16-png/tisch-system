import { asc, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { contacts, customers } from "../db/schema";

export async function mailCustomerOptions() {
  const [cs, primary] = await Promise.all([
    db.select({ id: customers.id, name: customers.name, email: customers.email }).from(customers).where(ne(customers.status, "ehemalig")).orderBy(asc(customers.name)),
    db.select().from(contacts).where(eq(contacts.isPrimary, true)),
  ]);
  return cs.map((c) => {
    const p = primary.find((x) => x.customerId === c.id);
    return { id: c.id, name: c.name, email: p?.email ?? c.email, contactName: p?.name ?? null };
  });
}
