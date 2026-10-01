import { LogoMark } from "@/components/shell/Logo";
import { Toaster } from "@/components/ui/toast";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <LogoMark className="h-10 w-auto text-accent" />
        <div className="leading-none">
          <p className="text-[15px] font-bold tracking-[0.1em] uppercase">
            Rother <span className="font-normal">Marketing</span>
          </p>
          <p className="mt-2 font-serif text-lg text-muted italic">Cockpit – Marketing mit Gesicht.</p>
        </div>
      </div>
      {children}
      <Toaster />
    </div>
  );
}
