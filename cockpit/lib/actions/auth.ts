"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword, randomToken, verifyPassword } from "../crypto";
import { endSession, hasAnyUser, startSession } from "../auth";
import { setSetting, getSetting, DEFAULTS } from "../settings";
import { fail, type ActionState } from "./types";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  if (!email || !password) return fail("Bitte E-Mail und Passwort eingeben.");
  const [user] = await db.select().from(users).where(eq(sql`lower(${users.email})`, email)).limit(1);
  // Immer hashen, damit die Antwortzeit nichts über existierende Konten verrät
  const valid = user ? await verifyPassword(password, user.passwordHash) : await hashPassword(password).then(() => false);
  if (!user || !valid || !user.active) return fail("E-Mail oder Passwort ist falsch.");
  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id));
  await startSession(user.id);
  redirect(/^\/(?![\/\\])/.test(next) ? next : "/");
}

export async function logoutAction() {
  await endSession();
  redirect("/login");
}

const setupSchema = z.object({
  companyName: z.string().trim().min(1, "Bitte Firmennamen angeben"),
  name: z.string().trim().min(2, "Bitte Namen angeben"),
  email: z.email("Ungültige E-Mail-Adresse"),
  password: z.string().min(10, "Mindestens 10 Zeichen"),
  partnerName: z.string().trim().optional(),
  partnerEmail: z.union([z.literal(""), z.email("Ungültige E-Mail-Adresse")]).optional(),
  partnerPassword: z.string().optional(),
});

export async function setupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (await hasAnyUser()) return fail("Die Einrichtung wurde bereits abgeschlossen.");
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Bitte Eingaben prüfen.", Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
  }
  const d = parsed.data;
  if (d.partnerEmail && (!d.partnerPassword || d.partnerPassword.length < 10)) {
    return fail("Bitte Eingaben prüfen.", { partnerPassword: "Mindestens 10 Zeichen" });
  }
  const [owner] = await db
    .insert(users)
    .values({
      name: d.name,
      email: d.email.toLowerCase(),
      passwordHash: await hashPassword(d.password),
      role: "inhaber",
      color: "#C1502E",
      calendarToken: randomToken(),
    })
    .returning();
  const partners = [{ name: d.name, share: 50 }];
  if (d.partnerEmail && d.partnerName) {
    await db.insert(users).values({
      name: d.partnerName,
      email: d.partnerEmail.toLowerCase(),
      passwordHash: await hashPassword(d.partnerPassword!),
      role: "inhaber",
      color: "#2563EB",
      calendarToken: randomToken(),
    });
    partners.push({ name: d.partnerName, share: 50 });
  } else {
    partners[0].share = 100;
  }
  const company = await getSetting("company");
  await setSetting("company", {
    ...company,
    name: d.companyName,
    owners: partners.map((p) => p.name).join(" & "),
  });
  await setSetting("partners", partners);
  await setSetting("invoicing", { ...DEFAULTS.invoicing, ...(await getSetting("invoicing")) });

  const { seedServicePresets, seedDemoData } = await import("../demo");
  await seedServicePresets();
  if (formData.get("demo") === "on") await seedDemoData(owner.id);
  await setSetting("setup", { demoLoaded: formData.get("demo") === "on", completedAt: new Date().toISOString() });

  await startSession(owner.id);
  redirect("/");
}
