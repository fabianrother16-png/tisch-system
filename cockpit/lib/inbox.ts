import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { inArray } from "drizzle-orm";
import { db } from "./db";
import { contacts, customers, emails } from "./db/schema";
import { getMailConfig } from "./mail";

/** Ordnet eine Absender-Adresse einem Kunden zu (exakte Adresse oder gleiche Firmen-Domain). */
export async function customerMatcher() {
  const [cs, ct] = await Promise.all([
    db.select({ id: customers.id, email: customers.email, website: customers.website }).from(customers),
    db.select({ customerId: contacts.customerId, email: contacts.email }).from(contacts),
  ]);
  const exact = new Map<string, number>();
  const domains = new Map<string, number>();
  const generic = /^(gmail|googlemail|gmx|web|t-online|outlook|hotmail|yahoo|icloud|me|live|aol|freenet|posteo|mail)\./i;
  const addDomain = (d: string | null | undefined, id: number) => {
    if (!d) return;
    const dom = d.toLowerCase().replace(/^www\./, "");
    if (!generic.test(dom)) domains.set(dom, id);
  };
  for (const c of cs) {
    if (c.email) {
      exact.set(c.email.toLowerCase(), c.id);
      addDomain(c.email.split("@")[1], c.id);
    }
    if (c.website) {
      try {
        addDomain(new URL(c.website.startsWith("http") ? c.website : `https://${c.website}`).hostname, c.id);
      } catch {}
    }
  }
  for (const c of ct) {
    if (c.email) {
      exact.set(c.email.toLowerCase(), c.customerId);
      addDomain(c.email.split("@")[1], c.customerId);
    }
  }
  return (address: string | null | undefined): number | null => {
    if (!address) return null;
    const a = address.toLowerCase();
    return exact.get(a) ?? domains.get(a.split("@")[1] ?? "") ?? null;
  };
}

/** Holt neue E-Mails der letzten 14 Tage aus dem Posteingang. */
export async function fetchInbox(days = 14): Promise<string> {
  const cfg = await getMailConfig();
  if (!cfg.imap) return "Kein IMAP-Postfach eingerichtet";
  const client = new ImapFlow({
    host: cfg.imap.host,
    port: cfg.imap.port,
    secure: cfg.imap.port === 993,
    auth: { user: cfg.imap.user, pass: cfg.imap.password },
    logger: false,
  });
  const match = await customerMatcher();
  let imported = 0;
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - days * 86400000);
      const uids = (await client.search({ since }, { uid: true })) || [];
      const recent = uids.slice(-200);
      const parsedList: { messageId: string; raw: Buffer }[] = [];
      if (recent.length) {
        for await (const msg of client.fetch(recent, { envelope: true, source: true }, { uid: true })) {
          const id = msg.envelope?.messageId;
          if (id && msg.source) parsedList.push({ messageId: id, raw: msg.source });
        }
      }
      const existing = parsedList.length
        ? new Set(
            (await db.select({ id: emails.messageId }).from(emails).where(inArray(emails.messageId, parsedList.map((p) => p.messageId)))).map((r) => r.id),
          )
        : new Set<string | null>();
      for (const item of parsedList) {
        if (existing.has(item.messageId)) continue;
        const mail = await simpleParser(item.raw);
        const from = mail.from?.value[0]?.address ?? "";
        if (from.toLowerCase() === cfg.fromAddress.toLowerCase()) continue;
        const to = Array.isArray(mail.to) ? mail.to.map((t) => t.text).join(", ") : mail.to?.text ?? "";
        await db.insert(emails).values({
          direction: "ein",
          customerId: match(from),
          fromAddr: mail.from?.text ?? from,
          toAddr: to,
          cc: Array.isArray(mail.cc) ? mail.cc.map((c) => c.text).join(", ") : mail.cc?.text ?? null,
          subject: mail.subject ?? "(kein Betreff)",
          text: mail.text?.slice(0, 50000) ?? null,
          html: typeof mail.html === "string" ? mail.html.slice(0, 200000) : null,
          messageId: item.messageId,
          inReplyTo: mail.inReplyTo ?? null,
          status: "empfangen",
          attachments: mail.attachments.map((a) => a.filename ?? "Anhang"),
          isRead: false,
          date: (mail.date ?? new Date()).toISOString(),
        });
        imported++;
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => null);
  }
  return `${imported} neue E-Mail${imported === 1 ? "" : "s"}`;
}
