import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { verifyValue } from "@/lib/session";
import { encrypt } from "@/lib/crypto";
import { applyChoice, exchangeCode } from "@/lib/integrations/providers";
import { providerInfo, type ProviderKey } from "@/lib/integrations/config";
import { syncCustomer } from "@/lib/integrations/sync";
import { logActivity } from "@/lib/domain/activity";
import { appUrl } from "@/lib/env";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(req.url);
  const state = await verifyValue<{ p: string; c: number; u: number }>(url.searchParams.get("state"));
  const user = await getCurrentUser();
  if (!state || !user || state.p !== provider || state.u !== user.id) {
    return NextResponse.redirect(`${appUrl()}/?fehler=${encodeURIComponent("Anmeldung abgelaufen – bitte erneut verbinden.")}`);
  }
  const back = `${appUrl()}/kunden/${state.c}?tab=anbindungen`;
  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (error || !code) return NextResponse.redirect(`${back}&fehler=${encodeURIComponent(error ?? "Verbindung abgebrochen")}`);

  try {
    const tokens = await exchangeCode(provider as ProviderKey, code);
    const values = {
      accessToken: encrypt(tokens.accessToken),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
      expiresAt: tokens.expiresAt ?? null,
      scopes: tokens.scopes ?? null,
      externalId: tokens.externalId ?? null,
      name: tokens.name ?? null,
      status: "aktiv" as const,
      lastError: null,
      config: (tokens.choices ? { choices: JSON.stringify(tokens.choices) } : {}) as Record<string, string>,
    };
    const [existing] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.customerId, state.c), eq(integrations.provider, provider)))
      .limit(1);
    let row;
    if (existing) {
      [row] = await db.update(integrations).set(values).where(eq(integrations.id, existing.id)).returning();
    } else {
      [row] = await db.insert(integrations).values({ ...values, customerId: state.c, provider }).returning();
    }
    // Genau eine Auswahl (Seite, Werbekonto, Standort) → direkt übernehmen
    if (tokens.choices && tokens.choices.length === 1) {
      const chosen = await applyChoice(row, tokens.choices[0].id);
      await db
        .update(integrations)
        .set({
          externalId: chosen.externalId,
          name: chosen.name,
          ...(chosen.accessToken ? { accessToken: encrypt(chosen.accessToken) } : {}),
          ...(chosen.refreshToken ? { refreshToken: encrypt(chosen.refreshToken) } : {}),
        })
        .where(eq(integrations.id, row.id));
    }
    await logActivity({ customerId: state.c, userId: user.id, title: `${providerInfo(provider)?.label} verbunden` });
    const [fresh] = await db.select().from(integrations).where(eq(integrations.id, row.id)).limit(1);
    if (fresh.externalId) await syncCustomer(state.c, 90).catch(() => null);
    return NextResponse.redirect(`${back}&verbunden=${provider}`);
  } catch (err) {
    return NextResponse.redirect(`${back}&fehler=${encodeURIComponent(err instanceof Error ? err.message : String(err))}`);
  }
}
