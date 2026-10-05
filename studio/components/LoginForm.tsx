"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (!res.ok) {
      setError(((await res.json()) as { error?: string }).error ?? "Anmeldung fehlgeschlagen.");
      return;
    }
    router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="label" htmlFor="password">
        Passwort
      </label>
      <input id="password" type="password" autoFocus autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full" disabled={busy || !password}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Anmelden
      </button>
    </form>
  );
}
