import { asc, desc, eq } from "drizzle-orm";
import { FolderOpen, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { customers, files, users, type Customer } from "@/lib/db/schema";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { UploadForm } from "@/components/files/UploadForm";
import { FileTable } from "@/components/files/FileTable";

export async function FilesTab({ customer }: { customer: Customer }) {
  const [rows, customerRows, team] = await Promise.all([
    db.select().from(files).where(eq(files.customerId, customer.id)).orderBy(desc(files.createdAt)),
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Dateien"
        icon={<FolderOpen />}
        description="Verträge, Angebote, Rechnungen, Briefings, Designs – alles zu diesem Kunden"
        actions={
          <Modal title="Dateien hochladen" trigger={<Button size="sm"><Upload /> Hochladen</Button>}>
            <UploadForm customers={customerRows} defaultCustomerId={customer.id} defaultCategory="briefing" />
          </Modal>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={<FolderOpen />} title="Noch keine Dateien" />
      ) : (
        <FileTable rows={rows.map((f) => ({ file: f, customerName: customer.name }))} customers={customerRows} userNames={Object.fromEntries(team.map((u) => [u.id, u.name]))} showCustomer={false} />
      )}
    </Card>
  );
}
