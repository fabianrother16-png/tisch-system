import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { createCustomer } from "@/lib/actions/customers";

export const metadata = { title: "Neuer Kunde" };

export default async function NewCustomerPage() {
  const me = await requireUser();
  const team = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true));
  return (
    <>
      <PageHeader title="Neuer Kunde" back={{ href: "/kunden", label: "Kunden" }} />
      <Card className="p-5 sm:p-6">
        <CustomerForm action={createCustomer} users={team} isNew customer={undefined} key={me.id} />
      </Card>
    </>
  );
}
