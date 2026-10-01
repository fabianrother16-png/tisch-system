"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "../db";
import { services, users } from "../db/schema";
import { assertUser } from "../auth";
import { encrypt, hashPassword, randomToken, verifyPassword } from "../crypto";
import { bool, int, money, str } from "../forms";
import { DEFAULTS, getSetting, setSetting, type Partner } from "../settings";
import { getMailConfig } from "../mail";
import { fail, success, type ActionState } from "./types";

function done(msg = "Gespeichert") {
  revalidatePath("/einstellungen");
  return success(msg);
}

export async function saveCompany(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const current = await getSetting("company");
  const keys = Object.keys(DEFAULTS.company) as (keyof typeof DEFAULTS.company)[];
  const next = { ...current };
  for (const k of keys) if (fd.has(k)) next[k] = str(fd, k) ?? "";
  if (!next.name) return fail("Bitte Firmennamen angeben.", { name: "Pflichtfeld" });
  next.iban = next.iban.replace(/\s+/g, " ").toUpperCase();
  await setSetting("company", next);
  return done("Firmendaten gespeichert");
}

export async function savePartners(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const names = fd.getAll("partnerName").map(String);
  const shares = fd.getAll("partnerShare").map((s) => Number(String(s).replace(",", ".")));
  const partners: Partner[] = names.map((name, i) => ({ name: name.trim(), share: shares[i] || 0 })).filter((p) => p.name);
  if (!partners.length) return fail("Mindestens ein Gesellschafter erforderlich.");
  const total = partners.reduce((s, p) => s + p.share, 0);
  if (Math.abs(total - 100) > 0.01) return fail(`Die Anteile ergeben ${total} % – bitte auf 100 % anpassen.`);
  await setSetting("partners", partners);
  return done("Gewinnverteilung gespeichert");
}

export async function saveInvoicing(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const current = await getSetting("invoicing");
  await setSetting("invoicing", {
    ...current,
    kleinunternehmer: bool(fd, "kleinunternehmer"),
    taxationMode: str(fd, "taxationMode") === "soll" ? "soll" : "ist",
    defaultTaxRate: int(fd, "defaultTaxRate", 19),
    paymentTermDays: int(fd, "paymentTermDays", 14),
    quoteValidityDays: int(fd, "quoteValidityDays", 30),
    invoicePrefix: str(fd, "invoicePrefix") ?? "RE",
    quotePrefix: str(fd, "quotePrefix") ?? "AN",
    customerPrefix: str(fd, "customerPrefix") ?? "K",
    invoiceIntro: str(fd, "invoiceIntro") ?? "",
    invoiceOutro: str(fd, "invoiceOutro") ?? "",
    quoteIntro: str(fd, "quoteIntro") ?? "",
    quoteOutro: str(fd, "quoteOutro") ?? "",
    reminderDays: int(fd, "reminderDays", 7),
    reminderFee: money(fd, "reminderFee"),
  });
  return done("Rechnungseinstellungen gespeichert");
}

export async function saveService(serviceId: number | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const name = str(fd, "name");
  if (!name) return fail("Bitte einen Namen angeben.", { name: "Pflichtfeld" });
  const values = {
    name,
    description: str(fd, "description"),
    category: str(fd, "category"),
    unit: str(fd, "unit") ?? "Pauschale",
    unitPrice: money(fd, "unitPrice"),
    taxRate: int(fd, "taxRate", 19),
    active: fd.has("active") ? bool(fd, "active") : true,
  };
  if (serviceId) await db.update(services).set(values).where(eq(services.id, serviceId));
  else {
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${services.sortOrder}), 0)` }).from(services);
    await db.insert(services).values({ ...values, sortOrder: Number(max) + 1 });
  }
  return done(serviceId ? "Leistung gespeichert" : "Leistung angelegt");
}

export async function deleteService(serviceId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(services).where(eq(services.id, serviceId));
  return done("Leistung gelöscht");
}

export async function saveMailSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const current = await getSetting("mail");
  const smtpPassword = str(fd, "smtpPassword");
  const imapPassword = str(fd, "imapPassword");
  await setSetting("mail", {
    ...current,
    smtpHost: str(fd, "smtpHost") ?? "",
    smtpPort: int(fd, "smtpPort", 587),
    smtpSecure: bool(fd, "smtpSecure"),
    smtpUser: str(fd, "smtpUser") ?? "",
    smtpPassword: smtpPassword ? encrypt(smtpPassword) : current.smtpPassword,
    fromName: str(fd, "fromName") ?? "",
    fromAddress: str(fd, "fromAddress") ?? "",
    imapHost: str(fd, "imapHost") ?? "",
    imapPort: int(fd, "imapPort", 993),
    imapUser: str(fd, "imapUser") ?? "",
    imapPassword: imapPassword ? encrypt(imapPassword) : current.imapPassword,
    signature: str(fd, "signature") ?? "",
    bccSelf: bool(fd, "bccSelf"),
  });
  return done("E-Mail-Einstellungen gespeichert");
}

export async function testMailConnection(): Promise<ActionState> {
  await assertUser();
  const cfg = await getMailConfig();
  if (!cfg.smtp) return fail("Bitte zuerst SMTP-Server, Benutzer und Passwort speichern.");
  try {
    const t = nodemailer.createTransport({ host: cfg.smtp.host, port: cfg.smtp.port, secure: cfg.smtp.secure, auth: { user: cfg.smtp.user, pass: cfg.smtp.password } });
    await t.verify();
  } catch (err) {
    return fail(`SMTP-Verbindung fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (cfg.imap) {
    try {
      const { ImapFlow } = await import("imapflow");
      const c = new ImapFlow({ host: cfg.imap.host, port: cfg.imap.port, secure: cfg.imap.port === 993, auth: { user: cfg.imap.user, pass: cfg.imap.password }, logger: false });
      await c.connect();
      await c.logout();
    } catch (err) {
      return fail(`SMTP funktioniert, IMAP nicht: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return success(cfg.imap ? "Versand und Empfang funktionieren ✓" : "Versand funktioniert ✓ (IMAP nicht eingerichtet)");
}

export async function saveMailTemplates(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const current = await getSetting("mailTemplates");
  const next = { ...current };
  for (const key of Object.keys(DEFAULTS.mailTemplates) as (keyof typeof DEFAULTS.mailTemplates)[]) {
    next[key] = { subject: str(fd, `${key}.subject`) ?? current[key].subject, body: str(fd, `${key}.body`) ?? current[key].body };
  }
  await setSetting("mailTemplates", next);
  return done("Vorlagen gespeichert");
}

export async function saveOAuthApps(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const current = await getSetting("oauthApps");
  const next = { ...current };
  for (const app of ["tiktok", "instagram", "meta", "google", "googleAds", "googlePlaces"]) {
    const clientId = str(fd, `${app}.clientId`);
    const clientSecret = str(fd, `${app}.clientSecret`);
    const clear = bool(fd, `${app}.clear`);
    if (clear) {
      delete next[app];
      continue;
    }
    if (clientId == null && clientSecret == null) continue;
    next[app] = {
      clientId: clientId ?? current[app]?.clientId ?? "",
      clientSecret: clientSecret ? encrypt(clientSecret) : current[app]?.clientSecret ?? "",
    };
  }
  await setSetting("oauthApps", next);
  return done("Zugangsdaten gespeichert");
}

// ─── Team ──────────────────────────────────────────────────────────────────

export async function addUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const name = str(fd, "name");
  const email = str(fd, "email")?.toLowerCase();
  const password = str(fd, "password") ?? "";
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Pflichtfeld";
  if (!email || !email.includes("@")) errors.email = "Gültige E-Mail angeben";
  if (password.length < 10) errors.password = "Mindestens 10 Zeichen";
  if (Object.keys(errors).length) return fail("Bitte Eingaben prüfen.", errors);
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email!)).limit(1);
  if (exists) return fail("Diese E-Mail ist bereits vergeben.", { email: "Bereits vergeben" });
  await db.insert(users).values({
    name: name!,
    email: email!,
    passwordHash: await hashPassword(password),
    role: (str(fd, "role") as "inhaber" | "mitarbeiter") ?? "mitarbeiter",
    color: str(fd, "color") ?? "#2563EB",
    calendarToken: randomToken(),
  });
  return done("Zugang angelegt");
}

export async function updateProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await assertUser();
  const name = str(fd, "name");
  const email = str(fd, "email")?.toLowerCase();
  if (!name || !email) return fail("Name und E-Mail sind erforderlich.");
  const [clash] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), ne(users.id, me.id))).limit(1);
  if (clash) return fail("Diese E-Mail ist bereits vergeben.", { email: "Bereits vergeben" });
  await db.update(users).set({ name, email, color: str(fd, "color") ?? me.color }).where(eq(users.id, me.id));
  revalidatePath("/", "layout");
  return success("Profil gespeichert");
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await assertUser();
  const current = str(fd, "current") ?? "";
  const next = str(fd, "next") ?? "";
  if (!(await verifyPassword(current, me.passwordHash))) return fail("Aktuelles Passwort ist falsch.", { current: "Falsch" });
  if (next.length < 10) return fail("Neues Passwort zu kurz.", { next: "Mindestens 10 Zeichen" });
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, me.id));
  return success("Passwort geändert");
}

export async function setUserActive(userId: number, active: boolean): Promise<ActionState> {
  const me = await assertUser();
  if (userId === me.id) return fail("Du kannst dich nicht selbst deaktivieren.");
  await db.update(users).set({ active }).where(eq(users.id, userId));
  return done(active ? "Zugang aktiviert" : "Zugang deaktiviert");
}

export async function resetUserPassword(userId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const password = str(fd, "password") ?? "";
  if (password.length < 10) return fail("Mindestens 10 Zeichen.", { password: "Mindestens 10 Zeichen" });
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, userId));
  return done("Passwort gesetzt");
}

export async function regenerateCalendarToken(): Promise<ActionState> {
  const me = await assertUser();
  await db.update(users).set({ calendarToken: randomToken() }).where(eq(users.id, me.id));
  revalidatePath("/kalender");
  return done("Neuer Kalender-Link erzeugt – bitte im Handy-Kalender neu abonnieren");
}

// ─── Demo-Daten ────────────────────────────────────────────────────────────

export async function removeDemoData(): Promise<ActionState> {
  await assertUser();
  const { removeDemo } = await import("../demo");
  const n = await removeDemo();
  await setSetting("setup", { ...(await getSetting("setup")), demoLoaded: false });
  revalidatePath("/", "layout");
  return success(`Demo-Daten entfernt (${n} Demo-Kunden mit allen Daten)`);
}

export async function loadDemoData(): Promise<ActionState> {
  const me = await assertUser();
  const { seedDemoData } = await import("../demo");
  await seedDemoData(me.id);
  await setSetting("setup", { ...(await getSetting("setup")), demoLoaded: true });
  revalidatePath("/", "layout");
  return success("Demo-Daten geladen");
}
