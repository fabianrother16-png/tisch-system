"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ClientDangerZone({ clientId, name }: { clientId: string; name: string }) {
  const router = useRouter();
  async function remove() {
    if (!window.confirm(`„${name}“ wirklich löschen? Die Ergebnisse bleiben erhalten, verlieren aber die Zuordnung.`)) return;
    const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/kunden");
      router.refresh();
    }
  }
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
      <h2 className="text-sm font-semibold text-red-900">Kunden löschen</h2>
      <p className="mt-1 text-xs text-red-900/70">
        Denkt an die DSGVO: Endet die Zusammenarbeit, sollten Kundendaten nach Ablauf der Aufbewahrungsfristen gelöscht werden.
      </p>
      <button className="btn mt-3 border border-red-300 bg-white text-red-800 hover:bg-red-100" onClick={remove}>
        <Trash2 className="h-4 w-4" /> Kunden löschen
      </button>
    </section>
  );
}
