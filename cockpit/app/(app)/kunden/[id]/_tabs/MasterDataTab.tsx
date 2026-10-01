import { eq } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { users, type Customer } from "@/lib/db/schema";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ActionButton } from "@/components/ui/form";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { deleteCustomer, updateCustomer } from "@/lib/actions/customers";
import { fmtTimestamp } from "@/lib/format";

export async function MasterDataTab({ customer, currentUserId }: { customer: Customer; currentUserId: number }) {
  const team = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true));
  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <CustomerForm action={updateCustomer.bind(null, customer.id)} customer={customer} users={team} key={`${customer.updatedAt}-${currentUserId}`} />
      </Card>
      <Card className="border-red-200 dark:border-red-500/20">
        <CardHeader title="Kunde löschen" description={`Angelegt am ${fmtTimestamp(customer.createdAt)}`} />
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Löscht den Kunden mit Kontakten, Verträgen, Content, Zahlen und Terminen. Kunden mit Rechnungen oder Angeboten bleiben aus
            steuerlichen Gründen erhalten – setzt sie stattdessen auf „Ehemalig“.
          </p>
          <ActionButton action={deleteCustomer.bind(null, customer.id)} confirm={`„${customer.name}“ endgültig löschen?`} variant="danger" size="md">
            <Trash2 /> Löschen
          </ActionButton>
        </CardBody>
      </Card>
    </div>
  );
}
