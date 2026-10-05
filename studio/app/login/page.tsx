import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-anthracite px-4">
      <div className="w-full max-w-sm rounded-3xl bg-cream p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <div>
            <div className="font-serif text-xl font-semibold">SICHTWERK</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-terracotta">Studio</div>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
