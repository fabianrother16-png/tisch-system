"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { emails } from "../db/schema";
import { assertUser } from "../auth";
import { optInt, str } from "../forms";
import { isUpload, MAX_UPLOAD_BYTES } from "../storage";
import { sendMail } from "../mail";
import { fetchInbox } from "../inbox";
import { logActivity } from "../domain/activity";
import { fail, success, type ActionState } from "./types";

export async function composeMail(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser();
  const to = str(fd, "to");
  const subject = str(fd, "subject");
  if (!to) return fail("Bitte Empfänger angeben.", { to: "Pflichtfeld" });
  if (!subject) return fail("Bitte Betreff angeben.", { subject: "Pflichtfeld" });
  const attachments = [];
  let total = 0;
  for (const f of fd.getAll("attachments")) {
    if (!isUpload(f)) continue;
    total += f.size;
    if (total > MAX_UPLOAD_BYTES) return fail("Anhänge sind zusammen größer als 10 MB.");
    attachments.push({ filename: f.name, content: Buffer.from(await f.arrayBuffer()), contentType: f.type || undefined });
  }
  const customerId = optInt(fd, "customerId");
  const res = await sendMail({
    to,
    cc: str(fd, "cc"),
    subject,
    text: str(fd, "body") ?? "",
    attachments,
    customerId,
    userId: user.id,
    inReplyTo: str(fd, "inReplyTo"),
  });
  revalidatePath("/mail");
  if (customerId) revalidatePath(`/kunden/${customerId}`);
  if (!res.ok) return fail(res.error ?? "Versand fehlgeschlagen");
  if (customerId) await logActivity({ customerId, userId: user.id, kind: "email", title: `E-Mail gesendet: ${subject}`, body: `an ${to}`, refType: "email", refId: res.emailId });
  return success("E-Mail gesendet", { redirectTo: "/mail?ordner=gesendet" });
}

export async function fetchMailNow(): Promise<ActionState> {
  await assertUser();
  try {
    const msg = await fetchInbox(30);
    revalidatePath("/mail");
    return success(msg);
  } catch (err) {
    return fail(`Abruf fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function setMailRead(emailId: number, isRead: boolean): Promise<ActionState> {
  await assertUser();
  await db.update(emails).set({ isRead }).where(eq(emails.id, emailId));
  revalidatePath("/mail");
  return success();
}

export async function assignMailCustomer(emailId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await assertUser();
  const customerId = optInt(fd, "customerId");
  await db.update(emails).set({ customerId }).where(eq(emails.id, emailId));
  revalidatePath("/mail");
  revalidatePath(`/mail/${emailId}`);
  if (customerId) revalidatePath(`/kunden/${customerId}`);
  return success("Zuordnung gespeichert");
}

export async function deleteMail(emailId: number): Promise<ActionState> {
  await assertUser();
  await db.delete(emails).where(eq(emails.id, emailId));
  revalidatePath("/mail");
  return success("Aus dem Cockpit entfernt (im Postfach bleibt sie erhalten)", { redirectTo: "/mail" });
}
