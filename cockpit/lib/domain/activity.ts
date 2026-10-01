import { db } from "../db";
import { activities } from "../db/schema";

export async function logActivity(entry: {
  customerId?: number | null;
  userId?: number | null;
  kind?: string;
  title: string;
  body?: string | null;
  refType?: string;
  refId?: number;
}) {
  await db.insert(activities).values({
    customerId: entry.customerId ?? null,
    userId: entry.userId ?? null,
    kind: entry.kind ?? "system",
    title: entry.title,
    body: entry.body ?? null,
    refType: entry.refType ?? null,
    refId: entry.refId ?? null,
  });
}
