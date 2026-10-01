import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { signValue } from "@/lib/session";
import { authorizeUrl } from "@/lib/integrations/providers";
import { PROVIDERS, type ProviderKey } from "@/lib/integrations/config";
import { appUrl } from "@/lib/env";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login`);
  const { provider } = await params;
  const customerId = Number(new URL(req.url).searchParams.get("kunde"));
  const back = `${appUrl()}/kunden/${customerId}?tab=anbindungen`;
  if (!PROVIDERS.some((p) => p.key === provider) || !customerId) return NextResponse.redirect(back);
  try {
    const state = await signValue({ p: provider, c: customerId, u: user.id }, "20m");
    return NextResponse.redirect(await authorizeUrl(provider as ProviderKey, state));
  } catch (err) {
    return NextResponse.redirect(`${back}&fehler=${encodeURIComponent(err instanceof Error ? err.message : String(err))}`);
  }
}
