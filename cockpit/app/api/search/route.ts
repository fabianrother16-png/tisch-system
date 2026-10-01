import { NextResponse } from "next/server";
import { desc, eq, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts, contents, contracts, customers, files, invoices, quotes, tasks } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eur, fmtDate } from "@/lib/format";

export async function GET(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json([], { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);
  const t = `%${q}%`;
  const [cs, ct, inv, quo, con, fil, tas, ctr] = await Promise.all([
    db.select().from(customers).where(or(like(customers.name, t), like(customers.city, t), like(customers.number, t), like(customers.industry, t))).limit(6),
    db.select({ c: contacts, name: customers.name }).from(contacts).innerJoin(customers, eq(customers.id, contacts.customerId)).where(or(like(contacts.name, t), like(contacts.email, t), like(contacts.phone, t))).limit(4),
    db.select({ i: invoices, name: customers.name }).from(invoices).innerJoin(customers, eq(customers.id, invoices.customerId)).where(or(like(invoices.number, t), like(invoices.title, t))).orderBy(desc(invoices.issueDate)).limit(5),
    db.select({ q: quotes, name: customers.name }).from(quotes).innerJoin(customers, eq(customers.id, quotes.customerId)).where(or(like(quotes.number, t), like(quotes.title, t))).orderBy(desc(quotes.issueDate)).limit(4),
    db.select({ c: contents, name: customers.name }).from(contents).innerJoin(customers, eq(customers.id, contents.customerId)).where(like(contents.title, t)).orderBy(desc(contents.updatedAt)).limit(4),
    db.select().from(files).where(or(like(files.name, t), like(files.notes, t))).orderBy(desc(files.createdAt)).limit(4),
    db.select().from(tasks).where(like(tasks.title, t)).limit(3),
    db.select({ c: contracts, name: customers.name }).from(contracts).innerJoin(customers, eq(customers.id, contracts.customerId)).where(like(contracts.title, t)).limit(3),
  ]);
  return NextResponse.json([
    ...cs.map((c) => ({ type: "kunde", label: c.name, sub: [c.number, c.industry, c.city].filter(Boolean).join(" · "), href: `/kunden/${c.id}` })),
    ...ct.map(({ c, name }) => ({ type: "kontakt", label: c.name, sub: `${name}${c.email ? ` · ${c.email}` : ""}`, href: `/kunden/${c.customerId}` })),
    ...inv.map(({ i, name }) => ({ type: "rechnung", label: `${i.number ?? "Entwurf"} · ${i.title}`, sub: `${name} · ${eur(i.grossTotal)} · ${fmtDate(i.issueDate)}`, href: `/rechnungen/${i.id}` })),
    ...quo.map(({ q, name }) => ({ type: "angebot", label: `${q.number} · ${q.title}`, sub: `${name} · ${eur(q.netTotal)} netto`, href: `/angebote/${q.id}` })),
    ...ctr.map(({ c, name }) => ({ type: "vertrag", label: c.title, sub: name, href: `/kunden/${c.customerId}?tab=vertraege` })),
    ...con.map(({ c, name }) => ({ type: "content", label: c.title, sub: name, href: `/content?monat=${c.periodMonth}&kunde=${c.customerId}` })),
    ...fil.map((f) => ({ type: "datei", label: f.name, sub: f.notes ?? undefined, href: `/api/files/${f.id}` })),
    ...tas.map((x) => ({ type: "aufgabe", label: x.title, sub: x.dueDate ? `fällig ${fmtDate(x.dueDate)}` : undefined, href: `/aufgaben?filter=alle` })),
  ]);
}
