import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-serif text-3xl font-semibold">Nicht gefunden</h1>
      <p className="text-sm text-anthracite/60">Diese Seite oder dieser Link existiert nicht (mehr).</p>
      <Link href="/" className="btn-secondary">
        Zur Übersicht
      </Link>
    </div>
  );
}
