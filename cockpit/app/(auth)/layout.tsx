import { LogoMark } from "@/components/shell/Logo";
import { Toaster } from "@/components/ui/toast";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <LogoMark className="size-10" />
        <div className="leading-none">
          <p className="font-serif text-2xl font-semibold tracking-tight">SICHTWERK</p>
          <p className="mt-1 text-[11px] font-medium tracking-[0.25em] text-muted uppercase">Cockpit</p>
        </div>
      </div>
      {children}
      <Toaster />
    </div>
  );
}
