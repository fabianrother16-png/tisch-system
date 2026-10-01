import { redirect } from "next/navigation";
import { connection } from "next/server";
import { hasAnyUser } from "@/lib/auth";
import { SetupForm } from "./SetupForm";

export const metadata = { title: "Einrichtung" };

export default async function SetupPage() {
  await connection();
  if (await hasAnyUser()) redirect("/login");
  return (
    <div className="card w-full max-w-xl p-6 sm:p-8">
      <h1 className="text-lg font-semibold">Einrichtung</h1>
      <p className="mt-1 text-sm text-muted">
        Lege eure Zugänge an. Alles Weitere (Firmendaten, Bankverbindung, E-Mail, Anbindungen) könnt ihr danach in den
        Einstellungen ergänzen.
      </p>
      <SetupForm />
    </div>
  );
}
