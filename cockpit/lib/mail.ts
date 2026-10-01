import nodemailer from "nodemailer";
import { db } from "./db";
import { emails } from "./db/schema";
import { decrypt } from "./crypto";
import { getSetting } from "./settings";

export type MailConfig = {
  smtp: { host: string; port: number; secure: boolean; user: string; password: string } | null;
  imap: { host: string; port: number; user: string; password: string } | null;
  from: string;
  fromAddress: string;
  signature: string;
  bccSelf: boolean;
};

/** Einstellungen aus der Oberfläche, ersatzweise aus Umgebungsvariablen */
export async function getMailConfig(): Promise<MailConfig> {
  const s = await getSetting("mail");
  const company = await getSetting("company");
  const smtpHost = s.smtpHost || process.env.SMTP_HOST || "";
  const smtpUser = s.smtpUser || process.env.SMTP_USER || "";
  const smtpPassword = decrypt(s.smtpPassword) || process.env.SMTP_PASSWORD || "";
  const smtpPort = Number(s.smtpHost ? s.smtpPort : process.env.SMTP_PORT || 587);
  const imapHost = s.imapHost || process.env.IMAP_HOST || "";
  const imapUser = s.imapUser || process.env.IMAP_USER || smtpUser;
  const imapPassword = decrypt(s.imapPassword) || process.env.IMAP_PASSWORD || smtpPassword;
  const fromAddress = s.fromAddress || process.env.SMTP_FROM || smtpUser || company.email;
  const fromName = s.fromName || company.name;
  return {
    smtp: smtpHost && smtpUser ? { host: smtpHost, port: smtpPort, secure: s.smtpHost ? s.smtpSecure || smtpPort === 465 : smtpPort === 465, user: smtpUser, password: smtpPassword } : null,
    imap: imapHost && imapUser ? { host: imapHost, port: Number(s.imapHost ? s.imapPort : process.env.IMAP_PORT || 993), user: imapUser, password: imapPassword } : null,
    from: fromName ? `"${fromName.replace(/"/g, "")}" <${fromAddress}>` : fromAddress,
    fromAddress,
    signature: s.signature,
    bccSelf: s.bccSelf,
  };
}

export type OutgoingMail = {
  to: string;
  cc?: string | null;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
  customerId?: number | null;
  refType?: string;
  refId?: number;
  userId?: number;
  inReplyTo?: string | null;
};

export async function sendMail(mail: OutgoingMail): Promise<{ ok: boolean; error?: string; emailId?: number }> {
  const cfg = await getMailConfig();
  const body = cfg.signature ? `${mail.text}\n\n--\n${cfg.signature}` : mail.text;
  const base = {
    direction: "aus" as const,
    customerId: mail.customerId ?? null,
    fromAddr: cfg.fromAddress || "(nicht konfiguriert)",
    toAddr: mail.to,
    cc: mail.cc ?? null,
    subject: mail.subject,
    text: body,
    refType: mail.refType ?? null,
    refId: mail.refId ?? null,
    attachments: (mail.attachments ?? []).map((a) => a.filename),
    userId: mail.userId ?? null,
    inReplyTo: mail.inReplyTo ?? null,
    date: new Date().toISOString(),
  };

  if (!cfg.smtp) {
    const [row] = await db
      .insert(emails)
      .values({ ...base, status: "fehler", error: "Kein E-Mail-Postfach eingerichtet (Einstellungen → E-Mail)." })
      .returning();
    return { ok: false, error: "Kein E-Mail-Postfach eingerichtet. Bitte unter Einstellungen → E-Mail die SMTP-Daten eintragen.", emailId: row.id };
  }

  try {
    const transport = nodemailer.createTransport({
      host: cfg.smtp.host,
      port: cfg.smtp.port,
      secure: cfg.smtp.secure,
      auth: { user: cfg.smtp.user, pass: cfg.smtp.password },
    });
    const info = await transport.sendMail({
      from: cfg.from,
      to: mail.to,
      cc: mail.cc || undefined,
      bcc: cfg.bccSelf ? cfg.fromAddress : undefined,
      subject: mail.subject,
      text: body,
      inReplyTo: mail.inReplyTo || undefined,
      references: mail.inReplyTo || undefined,
      attachments: mail.attachments,
    });
    const [row] = await db.insert(emails).values({ ...base, status: "gesendet", messageId: info.messageId ?? null }).returning();
    return { ok: true, emailId: row.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const [row] = await db.insert(emails).values({ ...base, status: "fehler", error: message }).returning();
    return { ok: false, error: `Versand fehlgeschlagen: ${message}`, emailId: row.id };
  }
}
