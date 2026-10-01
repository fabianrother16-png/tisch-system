import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentEditor } from "@/components/finance/DocumentEditor";
import { saveInvoice } from "@/lib/actions/invoices";
import { getEditorOptions } from "@/lib/domain/editor";
import { addDays, endOfMonth, startOfMonth, todayISO } from "@/lib/dates";

export const metadata = { title: "Neue Rechnung" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ kunde?: string }> }) {
  await requireUser();
  const { kunde } = await searchParams;
  const { customers, services, invoicing } = await getEditorOptions();
  const today = todayISO();
  const customerId = kunde ? Number(kunde) : null;
  const customer = customers.find((c) => c.id === customerId);
  return (
    <>
      <PageHeader
        title="Neue Rechnung"
        description="Wird als Entwurf gespeichert. Die Rechnungsnummer wird erst beim Festschreiben bzw. Versenden vergeben."
        back={{ href: "/rechnungen", label: "Rechnungen" }}
      />
      <DocumentEditor
        kind="rechnung"
        action={saveInvoice.bind(null, null)}
        customers={customers}
        services={services}
        kleinunternehmer={invoicing.kleinunternehmer}
        defaultTaxRate={invoicing.defaultTaxRate}
        defaultPaymentDays={invoicing.paymentTermDays}
        initial={{
          customerId,
          title: "",
          issueDate: today,
          serviceFrom: startOfMonth(today),
          serviceTo: endOfMonth(today),
          dueDate: addDays(today, customer?.paymentTermDays ?? invoicing.paymentTermDays),
          intro: invoicing.invoiceIntro,
          outro: invoicing.invoiceOutro,
          discountPercent: 0,
          items: [],
        }}
      />
    </>
  );
}
