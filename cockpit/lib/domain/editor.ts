import { asc, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { customers, services } from "../db/schema";
import { getSetting } from "../settings";

export async function getEditorOptions() {
  const [customerRows, serviceRows, invoicing] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, paymentTermDays: customers.paymentTermDays })
      .from(customers)
      .where(ne(customers.status, "ehemalig"))
      .orderBy(asc(customers.name)),
    db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder), asc(services.name)),
    getSetting("invoicing"),
  ]);
  return { customers: customerRows, services: serviceRows, invoicing };
}
