import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentEditor } from "@/components/finance/DocumentEditor";
import { saveQuote } from "@/lib/actions/quotes";
import { getEditorOptions } from "@/lib/domain/editor";
import { addDays, todayISO } from "@/lib/dates";

export const metadata = { title: "Neues Angebot" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ kunde?: string }> }) {
  await requireUser();
  const { kunde } = await searchParams;
  const { customers, services, invoicing } = await getEditorOptions();
  const today = todayISO();
  return (
    <>
      <PageHeader title="Neues Angebot" back={{ href: "/angebote", label: "Angebote" }} />
      <DocumentEditor
        kind="angebot"
        action={saveQuote.bind(null, null)}
        customers={customers}
        services={services}
        kleinunternehmer={invoicing.kleinunternehmer}
        defaultTaxRate={invoicing.defaultTaxRate}
        defaultPaymentDays={invoicing.paymentTermDays}
        initial={{
          customerId: kunde ? Number(kunde) : null,
          title: "",
          issueDate: today,
          validUntil: addDays(today, invoicing.quoteValidityDays),
          intro: invoicing.quoteIntro,
          outro: invoicing.quoteOutro,
          discountPercent: 0,
          items: [],
        }}
      />
    </>
  );
}
