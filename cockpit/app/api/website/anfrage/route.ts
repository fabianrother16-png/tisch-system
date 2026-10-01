import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { activities, contacts, customers, tasks } from "@/lib/db/schema";
import { randomToken } from "@/lib/crypto";
import { nextCustomerNumber } from "@/lib/domain/numbering";
import { CUSTOMER_COLORS } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { getSetting, setSetting } from "@/lib/settings";
import { nextWorkday, sameSecret, websiteKey } from "@/lib/website";

/*
  Eingang für Anfragen aus dem Kontaktformular der Website (rother-marketing-website,
  app/api/kontakt). Die Website prüft die Anfrage selbst (Pflichtfelder, Spam,
  Drosselung) und übergibt sie hier mit dem geheimen Schlüssel aus
  Einstellungen → Anbindungen → Website.

  Ergebnis im Cockpit: Interessent (bzw. vorhandener Kunde), Ansprechpartner,
  Verlaufseintrag „Anfrage über die Website“ und Aufgabe „Rückmeldung“ für den
  nächsten Werktag. Antwort: { ok: true, kundeId, neu }.
*/

const kurz = (n: number) => z.string().trim().max(n).optional().transform((v) => (v ? v : undefined));

const Anfrage = z.object({
  betrieb: z.string().trim().min(1).max(120),
  branche: kurz(80),
  interessen: z.array(z.string().trim().max(80)).max(12).optional().default([]),
  weg: z.enum(["telefon", "email"]),
  name: kurz(80),
  telefon: kurz(40),
  email: z.union([z.literal(""), z.email().max(254)]).optional().transform((v) => (v ? v.toLowerCase() : undefined)),
  wunschtermin: kurz(80),
  nachricht: kurz(2000),
  seite: kurz(300),
});

function antwort(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const key = await websiteKey();
  if (!key) return antwort({ ok: false, fehler: "Website-Anbindung im Cockpit nicht eingerichtet" }, 503);
  const auth = req.headers.get("authorization") ?? "";
  if (!sameSecret(auth.replace(/^Bearer\s+/i, ""), key)) return antwort({ ok: false, fehler: "Nicht berechtigt" }, 401);

  const text = await req.text();
  if (text.length > 20_000) return antwort({ ok: false, fehler: "Zu groß" }, 413);
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return antwort({ ok: false, fehler: "Kein gültiges JSON" }, 400);
  }
  const parsed = Anfrage.safeParse(roh);
  if (!parsed.success) return antwort({ ok: false, fehler: "Ungültige Anfrage", felder: parsed.error.issues.map((i) => i.path.join(".")) }, 422);
  const a = parsed.data;

  // Bekannter Kunde? (gleiche E-Mail beim Kunden oder einem Kontakt, sonst gleicher Name)
  let customerId: number | null = null;
  if (a.email) {
    const [byContact] = await db.select({ id: contacts.customerId }).from(contacts).where(sql`lower(${contacts.email}) = ${a.email}`).limit(1);
    const [byCustomer] = byContact ? [] : await db.select({ id: customers.id }).from(customers).where(sql`lower(${customers.email}) = ${a.email}`).limit(1);
    customerId = byContact?.id ?? byCustomer?.id ?? null;
  }
  if (!customerId) {
    const [byName] = await db.select({ id: customers.id }).from(customers).where(sql`lower(${customers.name}) = ${a.betrieb.toLowerCase()}`).limit(1);
    customerId = byName?.id ?? null;
  }

  const neu = !customerId;
  if (!customerId) {
    const [{ n }] = await db.select({ n: count() }).from(customers);
    const [c] = await db
      .insert(customers)
      .values({
        number: await nextCustomerNumber(),
        name: a.betrieb,
        industry: a.branche ?? null,
        status: "lead",
        email: a.email ?? null,
        phone: a.telefon ?? null,
        source: "Website-Kontaktformular",
        color: CUSTOMER_COLORS[n % CUSTOMER_COLORS.length],
        reportToken: randomToken(18),
        notes: a.interessen.length ? `Interessiert an: ${a.interessen.join(", ")}` : null,
      })
      .returning();
    customerId = c.id;
  }

  if (a.name || a.email || a.telefon) {
    const [existing] = a.email
      ? await db.select({ id: contacts.id }).from(contacts).where(and(eq(contacts.customerId, customerId), sql`lower(${contacts.email}) = ${a.email}`)).limit(1)
      : [];
    if (!existing) {
      const [{ n: contactCount }] = await db.select({ n: count() }).from(contacts).where(eq(contacts.customerId, customerId));
      await db.insert(contacts).values({
        customerId,
        name: a.name ?? a.betrieb,
        email: a.email ?? null,
        phone: a.telefon ?? null,
        isPrimary: contactCount === 0,
        notes: "Über das Kontaktformular der Website",
      });
    }
  }

  const zeilen = [
    `Rückmeldung gewünscht per ${a.weg === "email" ? "E-Mail" : "Telefon"}`,
    a.name && `Name: ${a.name}`,
    a.telefon && `Telefon: ${a.telefon}`,
    a.email && `E-Mail: ${a.email}`,
    a.branche && `Branche: ${a.branche}`,
    a.interessen.length ? `Interessen: ${a.interessen.join(", ")}` : null,
    a.wunschtermin && `Wunschtermin: ${a.wunschtermin}`,
    a.nachricht && `\n${a.nachricht}`,
  ].filter(Boolean);

  await db.insert(activities).values({
    customerId,
    kind: "anfrage",
    title: "Anfrage über die Website",
    body: zeilen.join("\n"),
  });

  const kontakt = a.weg === "email" ? a.email : a.telefon;
  await db.insert(tasks).values({
    title: `Rückmeldung an ${a.name ?? a.betrieb} per ${a.weg === "email" ? "E-Mail" : "Telefon"}${kontakt ? ` (${kontakt})` : ""}`,
    description: a.nachricht ?? (a.interessen.length ? `Interessen: ${a.interessen.join(", ")}` : null),
    customerId,
    assigneeId: null,
    dueDate: nextWorkday(todayISO()),
    priority: "hoch",
  });

  const s = await getSetting("website");
  await setSetting("website", { ...s, lastReceivedAt: new Date().toISOString(), received: (s.received ?? 0) + 1 });

  return antwort({ ok: true, kundeId: customerId, neu });
}
