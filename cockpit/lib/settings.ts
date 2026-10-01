import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./db/schema";

export type CompanySettings = {
  name: string;
  claim: string;
  legalForm: string;
  owners: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  taxNumber: string;
  vatId: string;
  bankName: string;
  iban: string;
  bic: string;
  accentColor: string;
};

export type InvoicingSettings = {
  kleinunternehmer: boolean;
  taxationMode: "ist" | "soll";
  defaultTaxRate: number;
  paymentTermDays: number;
  quoteValidityDays: number;
  invoicePrefix: string;
  quotePrefix: string;
  customerPrefix: string;
  invoiceIntro: string;
  invoiceOutro: string;
  quoteIntro: string;
  quoteOutro: string;
  reminderDays: number;
  reminderFee: number;
};

export type Partner = { name: string; share: number };

export type MailSettings = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string; // verschlüsselt
  fromName: string;
  fromAddress: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword: string; // verschlüsselt
  signature: string;
  bccSelf: boolean;
};

export type MailTemplate = { subject: string; body: string };
export type MailTemplates = Record<"angebot" | "rechnung" | "mahnung" | "report", MailTemplate>;

export type OAuthApps = Record<string, { clientId: string; clientSecret: string }>; // Secrets verschlüsselt

export const DEFAULTS = {
  company: {
    name: "Rother Marketing",
    claim: "Marketing mit Gesicht.",
    legalForm: "GbR",
    owners: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    email: "",
    phone: "",
    website: "",
    taxNumber: "",
    vatId: "",
    bankName: "",
    iban: "",
    bic: "",
    accentColor: "#7A5C33",
  } as CompanySettings,
  invoicing: {
    kleinunternehmer: false,
    taxationMode: "ist",
    defaultTaxRate: 19,
    paymentTermDays: 14,
    quoteValidityDays: 30,
    invoicePrefix: "RE",
    quotePrefix: "AN",
    customerPrefix: "K",
    invoiceIntro: "vielen Dank für Ihr Vertrauen. Wir berechnen Ihnen folgende Leistungen:",
    invoiceOutro: "Bitte überweisen Sie den Rechnungsbetrag bis zum {{faellig}} unter Angabe der Rechnungsnummer.",
    quoteIntro: "vielen Dank für Ihr Interesse. Gerne unterbreiten wir Ihnen folgendes Angebot:",
    quoteOutro: "Wir freuen uns auf die Zusammenarbeit. Bei Fragen sind wir jederzeit für Sie da.",
    reminderDays: 7,
    reminderFee: 0,
  } as InvoicingSettings,
  partners: [
    { name: "Gesellschafter 1", share: 50 },
    { name: "Gesellschafter 2", share: 50 },
  ] as Partner[],
  mail: {
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
    fromName: "",
    fromAddress: "",
    imapHost: "",
    imapPort: 993,
    imapUser: "",
    imapPassword: "",
    signature: "",
    bccSelf: false,
  } as MailSettings,
  mailTemplates: {
    angebot: {
      subject: "Ihr Angebot {{nummer}} – {{firma}}",
      body: "Hallo {{ansprechpartner}},\n\nanbei erhalten Sie unser Angebot {{nummer}} über {{betrag}}.\nDas Angebot ist gültig bis {{gueltig_bis}}.\n\nBei Fragen melden Sie sich jederzeit gerne.\n\nViele Grüße\n{{absender}}",
    },
    rechnung: {
      subject: "Rechnung {{nummer}} – {{firma}}",
      body: "Hallo {{ansprechpartner}},\n\nanbei erhalten Sie unsere Rechnung {{nummer}} über {{betrag}}.\nBitte überweisen Sie den Betrag bis zum {{faellig}}.\n\nVielen Dank für die gute Zusammenarbeit!\n\nViele Grüße\n{{absender}}",
    },
    mahnung: {
      subject: "Zahlungserinnerung: Rechnung {{nummer}}",
      body: "Hallo {{ansprechpartner}},\n\nsicher ist es Ihnen im Alltag durchgerutscht: Unsere Rechnung {{nummer}} vom {{datum}} über {{offen}} ist seit dem {{faellig}} fällig.\n\nWir bitten um Ausgleich innerhalb der nächsten 7 Tage. Sollte sich Ihre Zahlung mit dieser Erinnerung überschnitten haben, betrachten Sie diese bitte als gegenstandslos.\n\nViele Grüße\n{{absender}}",
    },
    report: {
      subject: "Ihr Marketing-Report – {{firma}}",
      body: "Hallo {{ansprechpartner}},\n\nunter folgendem Link finden Sie jederzeit Ihren aktuellen Report mit allen Zahlen zu Ihren Kanälen:\n\n{{link}}\n\nViele Grüße\n{{absender}}",
    },
  } as MailTemplates,
  oauthApps: {} as OAuthApps,
  /** Verbindung zur Website: geheimer Schlüssel (verschlüsselt) für eingehende Anfragen */
  website: { key: "", lastReceivedAt: "", received: 0 } as { key: string; lastReceivedAt: string; received: number },
  setup: { demoLoaded: false, completedAt: "" },
};

export type SettingsKey = keyof typeof DEFAULTS;
export type SettingsValue<K extends SettingsKey> = (typeof DEFAULTS)[K];

export async function getSetting<K extends SettingsKey>(key: K): Promise<SettingsValue<K>> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const fallback = DEFAULTS[key];
  if (!row) return structuredClone(fallback);
  try {
    const parsed = JSON.parse(row.value);
    if (Array.isArray(fallback)) return parsed as SettingsValue<K>;
    return { ...fallback, ...parsed } as SettingsValue<K>;
  } catch {
    return structuredClone(fallback);
  }
}

export async function setSetting<K extends SettingsKey>(key: K, value: SettingsValue<K>): Promise<void> {
  const json = JSON.stringify(value);
  const updatedAt = new Date().toISOString();
  await db
    .insert(settings)
    .values({ key, value: json, updatedAt })
    .onConflictDoUpdate({ target: settings.key, set: { value: json, updatedAt } });
}

/** Ersetzt {{platzhalter}} in Vorlagen */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => vars[k.toLowerCase()] ?? "");
}
