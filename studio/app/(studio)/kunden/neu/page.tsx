import { ClientForm } from "@/components/ClientForm";

export const metadata = { title: "Neuer Kunde" };

export default function NeuerKundePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="h-page">Neuer Kunde</h1>
        <p className="text-sm text-anthracite/60">Trag mindestens Name, Ort und Website ein – den Rest kann der Strategie-Agent recherchieren.</p>
      </div>
      <ClientForm />
    </div>
  );
}
