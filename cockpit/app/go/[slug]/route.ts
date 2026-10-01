import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { linkClicks, trackingLinks } from "@/lib/db/schema";
import { todayISO } from "@/lib/dates";

const BOT = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|headless/i;

function device(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobil";
  return "desktop";
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [link] = await db.select().from(trackingLinks).where(eq(trackingLinks.slug, slug.toLowerCase())).limit(1);
  if (!link || !link.active) {
    return new Response("Dieser Link ist nicht (mehr) aktiv.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const ua = req.headers.get("user-agent") ?? "";
  if (!BOT.test(ua)) {
    // Datensparsam: keine IP-Adressen, nur Gerätetyp, Herkunftsseite (Domain) und Land
    let referrer: string | null = null;
    try {
      const ref = req.headers.get("referer");
      referrer = ref ? new URL(ref).hostname : null;
    } catch {}
    await db.insert(linkClicks).values({
      linkId: link.id,
      at: new Date().toISOString(),
      date: todayISO(),
      device: device(ua),
      referrer,
      country: req.headers.get("x-vercel-ip-country") ?? null,
    });
    await db.update(trackingLinks).set({ clickCount: sql`${trackingLinks.clickCount} + 1` }).where(eq(trackingLinks.id, link.id));
  }
  return new Response(null, { status: 302, headers: { Location: link.targetUrl, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" } });
}
