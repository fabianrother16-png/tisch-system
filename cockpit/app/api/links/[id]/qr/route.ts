import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trackingLinks } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { appUrl } from "@/lib/env";
import { contentDisposition } from "@/lib/http";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Nicht angemeldet", { status: 401 });
  const id = Number((await params).id);
  const [link] = await db.select().from(trackingLinks).where(eq(trackingLinks.id, id)).limit(1);
  if (!link) return new Response("Nicht gefunden", { status: 404 });
  const url = `${appUrl()}/go/${link.slug}`;
  const sp = new URL(req.url).searchParams;
  const format = sp.get("format") === "svg" ? "svg" : "png";
  const download = sp.has("download");
  const name = `QR_${link.slug}.${format}`;
  if (format === "svg") {
    const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#1E1A17", light: "#FFFFFF" } });
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": contentDisposition(name, download) } });
  }
  const png = await QRCode.toBuffer(url, { type: "png", width: 1024, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1E1A17", light: "#FFFFFF" } });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Content-Disposition": contentDisposition(name, download) } });
}
