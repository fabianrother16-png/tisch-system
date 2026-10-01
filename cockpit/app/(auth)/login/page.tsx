import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!(await hasAnyUser())) redirect("/setup");
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;
  return (
    <div className="card w-full max-w-sm p-6 sm:p-8">
      <h1 className="text-lg font-semibold">Willkommen zurück</h1>
      <p className="mt-1 text-sm text-muted">Melde dich mit deinem Konto an.</p>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
