import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCalendarItems } from "@/lib/domain/calendar";
import { addDays, todayISO } from "@/lib/dates";
import { EVENT_TYPE_MAP } from "@/lib/constants";
import { getSetting } from "@/lib/settings";

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 74) {
    let cut = 74;
    while (Buffer.byteLength(rest.slice(0, cut)) > 74) cut--;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

const dt = (local: string) => local.replace(/[-:]/g, "").slice(0, 13) + "00"; // 2026-10-01T10:00 → 20261001T100000
const d = (iso: string) => iso.replace(/-/g, "");

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/, "");
  const [user] = await db.select().from(users).where(eq(users.calendarToken, token)).limit(1);
  if (!user || !user.active) return new Response("Nicht gefunden", { status: 404 });

  const today = todayISO();
  const company = await getSetting("company");
  const items = await getCalendarItems(addDays(today, -60), addDays(today, 365), { deadlines: true, userId: user.id });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${company.name} Cockpit//DE`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`${company.name} Cockpit`)}`,
    "X-WR-TIMEZONE:Europe/Berlin",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Berlin",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  for (const item of items) {
    lines.push("BEGIN:VEVENT", `UID:${item.key}@cockpit`, `DTSTAMP:${stamp}`);
    if (item.allDay || !item.time) {
      lines.push(`DTSTART;VALUE=DATE:${d(item.date)}`, `DTEND;VALUE=DATE:${d(addDays(item.endDate && item.endDate > item.date ? item.endDate : item.date, 1))}`);
    } else {
      const start = `${item.date}T${item.time}`;
      const end = item.event?.end && item.event.end.length > 10 ? item.event.end : `${item.date}T${String(Math.min(23, Number(item.time.slice(0, 2)) + 1)).padStart(2, "0")}:${item.time.slice(3, 5)}`;
      lines.push(`DTSTART;TZID=Europe/Berlin:${dt(start)}`, `DTEND;TZID=Europe/Berlin:${dt(end)}`);
    }
    const summary = item.customerName && !item.title.includes(item.customerName) ? `${item.title} (${item.customerName})` : item.title;
    lines.push(fold(`SUMMARY:${esc(summary)}`));
    const desc = [EVENT_TYPE_MAP[item.type]?.label, item.event?.notes].filter(Boolean).join("\n");
    if (desc) lines.push(fold(`DESCRIPTION:${esc(desc)}`));
    if (item.event?.location) lines.push(fold(`LOCATION:${esc(item.event.location)}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="cockpit.ics"',
      "Cache-Control": "no-store",
    },
  });
}
