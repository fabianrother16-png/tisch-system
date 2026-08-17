import Link from "next/link";
import { company } from "@/lib/content";

export default function NotFound() {
  return (
    <div className="tile-pattern flex min-h-screen flex-col items-center justify-center bg-slate-700 px-6 text-center text-white">
      <p className="font-display text-6xl font-semibold text-terracotta-300">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Diese Seite gibt es nicht.
      </h1>
      <p className="mt-3 max-w-sm text-sm text-slate-200/80">
        Vielleicht wurde der Link falsch eingegeben. Zurück zur Startseite von{" "}
        {company.name}.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Zur Startseite
      </Link>
    </div>
  );
}
