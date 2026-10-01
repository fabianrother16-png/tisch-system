import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  activities,
  adCampaigns,
  adStatsDaily,
  baselines,
  contacts,
  contents,
  contracts,
  customers,
  emails,
  events,
  expenses,
  files,
  invoiceItems,
  invoices,
  linkClicks,
  metricsDaily,
  payments,
  postSnapshots,
  posts,
  quoteItems,
  quotes,
  services,
  tasks,
  trackingLinks,
  users,
} from "./db/schema";
import { SERVICE_PRESETS } from "./constants";
import { addDays, addMonths, eachDay, endOfMonth, monthKey, startOfMonth, todayISO } from "./dates";
import { randomToken } from "./crypto";
import { computeTotals, type LineItem } from "./domain/totals";

/*
 * Erfundene Beispieldaten zum Ausprobieren. Alles ist als Demo markiert
 * (Kunden-/Rechnungsnummern mit "D-" bzw. "DEMO-") und lässt sich in den
 * Einstellungen vollständig entfernen, ohne echte Daten oder Nummernkreise
 * zu berühren.
 */

export async function seedServicePresets() {
  const existing = await db.select({ id: services.id }).from(services).limit(1);
  if (existing.length) return;
  await db.insert(services).values(
    SERVICE_PRESETS.map((s, i) => ({ name: s.name, category: s.category, unit: s.unit, unitPrice: 0, taxRate: 19, sortOrder: i })),
  );
}

function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function insertChunked<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>, size = 200) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

type DemoCustomer = {
  key: string;
  name: string;
  industry: string;
  city: string;
  street: string;
  zip: string;
  color: string;
  status: "aktiv" | "lead";
  startMonthsAgo: number;
  instagram?: string;
  tiktok?: string;
  website: string;
  contact: { name: string; position: string; email: string; phone: string };
  contract?: {
    title: string;
    fee: number;
    videos: number;
    posts: number;
    visits: number;
    adBudget?: number;
    minTerm: number;
    renew: number;
    notice: number;
    services: string[];
    conditions?: string;
    startOverride?: string;
  };
  followers?: Record<string, [number, number]>; // Plattform → [Start, heute]
  google?: { rating: [number, number]; reviews: [number, number]; web: [number, number]; calls: [number, number]; routes: [number, number] };
  views?: Record<string, [number, number, number?]>; // Plattform → [min, max, viral]
};

export async function seedDemoData(userId: number) {
  await seedServicePresets();
  const team = await db.select().from(users).where(eq(users.active, true));
  const other = team.find((u) => u.id !== userId) ?? team[0];
  const rnd = prng(42);
  const r = (min: number, max: number) => Math.round(min + rnd() * (max - min));
  const today = todayISO();
  const thisMonth = startOfMonth(today);
  const nowIso = new Date().toISOString();

  const defs: DemoCustomer[] = [
    {
      key: "cafe",
      name: "Café Lindenblatt",
      industry: "Café & Bistro",
      city: "Gütersloh",
      street: "Berliner Straße 21",
      zip: "33330",
      color: "#C1502E",
      status: "aktiv",
      startMonthsAgo: 7,
      instagram: "cafe.lindenblatt",
      tiktok: "lindenblatt.cafe",
      website: "https://www.cafe-lindenblatt.example",
      contact: { name: "Julia Lindner", position: "Inhaberin", email: "julia@cafe-lindenblatt.example", phone: "05241 223344" },
      contract: { title: "Social Media Paket M", fee: 129000, videos: 4, posts: 4, visits: 2, minTerm: 6, renew: 3, notice: 1, services: ["Social Media", "Videoproduktion (Reel/TikTok)", "Google-Profil und Bewertungen"], conditions: "Drehs nur vormittags vor 11 Uhr (vor dem Mittagsgeschäft). Freigabe der Videos durch Julia per WhatsApp." },
      followers: { instagram: [820, 3940], tiktok: [0, 12400] },
      google: { rating: [4.1, 4.6], reviews: [38, 112], web: [45, 162], calls: [22, 58], routes: [60, 190] },
      views: { instagram: [2500, 24000], tiktok: [4000, 65000, 214000] },
    },
    {
      key: "auto",
      name: "Autohaus Brenner",
      industry: "Autohandel & Werkstatt",
      city: "Rheda-Wiedenbrück",
      street: "Industriestraße 8",
      zip: "33378",
      color: "#2563EB",
      status: "aktiv",
      startMonthsAgo: 11,
      instagram: "autohaus.brenner",
      website: "https://www.autohaus-brenner.example",
      contact: { name: "Thomas Brenner", position: "Geschäftsführer", email: "t.brenner@autohaus-brenner.example", phone: "05242 98765" },
      contract: {
        title: "Meta Ads & Video",
        fee: 99000,
        videos: 2,
        posts: 0,
        visits: 1,
        adBudget: 150000,
        minTerm: 12,
        renew: 6,
        notice: 1,
        services: ["Meta Ads und Google Ads", "Videoproduktion (Reel/TikTok)"],
        conditions: "Werbebudget zahlt der Kunde direkt an Meta. Monatliches Reporting bis zum 5. des Folgemonats.",
        startOverride: addDays(addMonths(today, -12), 41),
      },
      followers: { instagram: [1250, 2380] },
      google: { rating: [4.2, 4.4], reviews: [96, 128], web: [110, 175], calls: [70, 96], routes: [85, 120] },
      views: { instagram: [1800, 9500] },
    },
    {
      key: "zahn",
      name: "Zahnarztpraxis Dr. Kaya",
      industry: "Zahnarztpraxis",
      city: "Gütersloh",
      street: "Kökerstraße 3",
      zip: "33330",
      color: "#059669",
      status: "aktiv",
      startMonthsAgo: 9,
      instagram: "zahnarzt.kaya",
      website: "https://www.zahnarzt-kaya.example",
      contact: { name: "Dr. Elif Kaya", position: "Praxisinhaberin", email: "praxis@zahnarzt-kaya.example", phone: "05241 556677" },
      contract: { title: "Google-Profil & Rezensionsmanagement", fee: 49000, videos: 0, posts: 2, visits: 0, minTerm: 12, renew: 12, notice: 3, services: ["Google-Profil und Bewertungen", "NFC-Bewertungskarten", "SEO und Local SEO"] },
      followers: { instagram: [310, 690] },
      google: { rating: [4.3, 4.8], reviews: [52, 131], web: [60, 140], calls: [40, 95], routes: [35, 70] },
      views: { instagram: [300, 1600] },
    },
    {
      key: "holz",
      name: "Tischlerei Holtkamp",
      industry: "Handwerk / Tischlerei",
      city: "Verl",
      street: "Am Sägewerk 12",
      zip: "33415",
      color: "#7C3AED",
      status: "aktiv",
      startMonthsAgo: 5,
      instagram: "tischlerei.holtkamp",
      tiktok: "holtkamp.holz",
      website: "https://www.tischlerei-holtkamp.example",
      contact: { name: "Markus Holtkamp", position: "Tischlermeister", email: "info@tischlerei-holtkamp.example", phone: "05246 112233" },
      contract: { title: "TikTok & Recruiting-Videos", fee: 159000, videos: 6, posts: 0, visits: 1, minTerm: 6, renew: 3, notice: 1, services: ["Videoproduktion (Reel/TikTok)", "Foto und Video", "Social Media"], conditions: "Ziel: 2 neue Azubis bis Sommer. Drehs in der Werkstatt nur mit Schutzbrille im Bild." },
      followers: { tiktok: [0, 28600], instagram: [410, 1720] },
      views: { tiktok: [8000, 92000, 486000], instagram: [1500, 12000] },
    },
    {
      key: "fit",
      name: "Fitnessstudio Pulsschlag",
      industry: "Fitness & Gesundheit",
      city: "Harsewinkel",
      street: "Münsterstraße 40",
      zip: "33428",
      color: "#DB2777",
      status: "lead",
      startMonthsAgo: 0,
      instagram: "pulsschlag.fitness",
      website: "https://www.pulsschlag-fitness.example",
      contact: { name: "Sandra Vogt", position: "Studioleitung", email: "sandra@pulsschlag-fitness.example", phone: "05247 445566" },
    },
  ];

  const ids: Record<string, number> = {};
  let num = 1001;
  for (const d of defs) {
    const startDate = d.contract?.startOverride ?? (d.startMonthsAgo ? addMonths(thisMonth, -d.startMonthsAgo) : null);
    const [c] = await db
      .insert(customers)
      .values({
        number: `D-${num++}`,
        name: d.name,
        industry: d.industry,
        status: d.status,
        email: d.contact.email,
        phone: d.contact.phone,
        website: d.website,
        street: d.street,
        zip: d.zip,
        city: d.city,
        color: d.color,
        ownerId: d.key === "holz" || d.key === "auto" ? other.id : userId,
        startDate,
        source: d.key === "fit" ? "Empfehlung (Café Lindenblatt)" : "Empfehlung",
        instagramHandle: d.instagram ?? null,
        tiktokHandle: d.tiktok ?? null,
        googleBusinessUrl: d.google ? "https://maps.google.com/" : null,
        reportToken: randomToken(18),
        reportEnabled: d.key === "cafe" || d.key === "zahn",
        isDemo: true,
      })
      .returning();
    ids[d.key] = c.id;
    await db.insert(contacts).values({ customerId: c.id, ...d.contact, isPrimary: true });
    if (d.key === "auto") await db.insert(contacts).values({ customerId: c.id, name: "Lena Brenner", position: "Marketing", email: "l.brenner@autohaus-brenner.example", phone: "05242 98766" });

    if (d.contract && startDate) {
      const k = d.contract;
      await db.insert(contracts).values({
        customerId: c.id,
        title: k.title,
        status: "aktiv",
        startDate,
        minTermMonths: k.minTerm,
        autoRenewMonths: k.renew,
        noticePeriod: k.notice,
        noticeUnit: "monate",
        monthlyFee: k.fee,
        setupFee: 0,
        billingInterval: "monatlich",
        autoInvoice: true,
        nextInvoiceDate: thisMonth,
        videosPerMonth: k.videos,
        postsPerMonth: k.posts,
        visitsPerMonth: k.visits,
        adBudgetMonthly: k.adBudget ?? 0,
        services: k.services,
        conditions: k.conditions ?? null,
        signedAt: addDays(startDate, -7),
      });
    }

    // Ausgangswerte (Vorher)
    const base: { platform: string; metric: string; value: number }[] = [];
    for (const [p, [from]] of Object.entries(d.followers ?? {})) base.push({ platform: p, metric: "followers", value: from });
    if (d.google) {
      base.push({ platform: "google", metric: "rating", value: d.google.rating[0] });
      base.push({ platform: "google", metric: "review_count", value: d.google.reviews[0] });
      base.push({ platform: "google", metric: "website_clicks", value: d.google.web[0] });
      base.push({ platform: "google", metric: "call_clicks", value: d.google.calls[0] });
    }
    if (base.length && startDate) await db.insert(baselines).values(base.map((b) => ({ ...b, customerId: c.id, date: addDays(startDate, -1) })));

    // Kennzahlen-Verlauf
    if (startDate) {
      const span = eachDay(addDays(startDate, -30), today);
      const total = span.length;
      const metricRows: (typeof metricsDaily.$inferInsert)[] = [];
      const ease = (i: number) => Math.pow(Math.max(0, (i - 30) / Math.max(1, total - 30)), 1.25);
      span.forEach((date, i) => {
        const weekly = i % 7 === 0 || date === today;
        for (const [p, [from, to]] of Object.entries(d.followers ?? {})) {
          if (weekly) metricRows.push({ customerId: c.id, platform: p, metric: "followers", date, value: Math.round(from + (to - from) * ease(i) * (0.97 + rnd() * 0.03)) });
        }
        if (d.google) {
          const g = d.google;
          if (weekly) {
            metricRows.push({ customerId: c.id, platform: "google", metric: "rating", date, value: Math.round((g.rating[0] + (g.rating[1] - g.rating[0]) * ease(i)) * 10) / 10 });
            metricRows.push({ customerId: c.id, platform: "google", metric: "review_count", date, value: Math.round(g.reviews[0] + (g.reviews[1] - g.reviews[0]) * ease(i)) });
          }
          const f = ease(i);
          const daily = (pair: [number, number]) => Math.max(0, Math.round(((pair[0] + (pair[1] - pair[0]) * f) / 30) * (0.5 + rnd())));
          if (date < today) {
            metricRows.push({ customerId: c.id, platform: "google", metric: "website_clicks", date, value: daily(g.web) });
            metricRows.push({ customerId: c.id, platform: "google", metric: "call_clicks", date, value: daily(g.calls) });
            metricRows.push({ customerId: c.id, platform: "google", metric: "direction_requests", date, value: daily(g.routes) });
            metricRows.push({ customerId: c.id, platform: "google", metric: "impressions", date, value: daily([g.web[0] * 18, g.web[1] * 18]) });
          }
        }
      });
      await insertChunked(metricRows, (chunk) => db.insert(metricsDaily).values(chunk));
    }
  }

  // ── Content & Beiträge ──
  const users2 = [userId, other.id];
  for (const d of defs) {
    if (!d.contract) continue;
    const cid = ids[d.key];
    const k = d.contract;
    const monthsBack = Math.min(5, d.startMonthsAgo);
    let viralUsed = false;
    for (let m = monthsBack; m >= 0; m--) {
      const mStart = addMonths(thisMonth, -m);
      const period = monthKey(mStart);
      const mEnd = endOfMonth(mStart);
      const videoTitles = {
        cafe: ["Latte Art in Zeitlupe", "Neue Herbstkarte", "Behind the Scenes: Frühstück", "Kuchen des Tages", "Team-Vorstellung", "Gäste-Interview"],
        auto: ["Werkstatt-Check in 60 Sekunden", "Fahrzeug der Woche", "Reifenwechsel-Aktion", "Probefahrt-POV"],
        zahn: ["Praxis-Rundgang", "Tipp: Zahnseide richtig nutzen"],
        holz: ["Vom Baumstamm zum Tisch", "Azubi-Alltag", "Drohnenflug über die Werkstatt", "Satisfying: Hobeln", "Meisterstück", "Montage beim Kunden", "Werkzeug-Check"],
        fit: [],
      }[d.key as "cafe"]!;
      const isCurrent = m === 0;
      const videoCount = k.videos;
      const postCount = k.posts;
      for (let i = 0; i < videoCount + postCount; i++) {
        const isVideo = i < videoCount;
        let status = "veroeffentlicht";
        if (isCurrent) {
          const done = d.key === "holz" ? 2 : d.key === "cafe" ? 1 : 0;
          const steps = ["schnitt", "freigabe", "dreh", "geplant"];
          if (i >= done) status = i - done < (d.key === "auto" ? 1 : d.key === "holz" ? 2 : 2) ? steps[(i - done) % steps.length] : "skip";
          if (!isVideo) status = i - videoCount < 1 ? "veroeffentlicht" : "eingeplant";
        } else if (m === 1 && d.key === "holz" && i === videoCount - 1) {
          status = "skip"; // im Vormonat eins weniger geliefert
        }
        if (status === "skip") continue;
        const day = Math.min(Number(mEnd.slice(8, 10)), 3 + Math.round(((i + 1) / (videoCount + postCount + 1)) * 24));
        let publishDate = `${period}-${String(day).padStart(2, "0")}`;
        if (status === "veroeffentlicht" && publishDate > today) publishDate = addDays(today, -1 - i);
        const title = isVideo ? `${videoTitles[i % videoTitles.length]}` : ["Wochenangebot", "Kundenstimme", "Öffnungszeiten Feiertag", "Teamfoto"][i % 4];
        const platforms = isVideo ? Object.keys(d.views ?? { instagram: [0, 0] }) : ["instagram", ...(d.key === "zahn" ? ["facebook"] : [])];
        const [content] = await db
          .insert(contents)
          .values({
            customerId: cid,
            title,
            format: isVideo ? (d.key === "holz" ? "tiktok" : "reel") : "post",
            platforms,
            status,
            assigneeId: users2[i % 2],
            periodMonth: period,
            shootDate: isCurrent && status === "dreh" ? addDays(today, 2) : isCurrent && status === "geplant" ? addDays(today, 6) : addDays(`${period}-01`, i * 3),
            dueDate: isCurrent ? addDays(today, 3 + i * 2) : null,
            publishDate: status === "veroeffentlicht" || status === "eingeplant" ? (status === "eingeplant" ? addDays(today, 4) : publishDate) : null,
            concept: isVideo ? "Hook: Frage in den ersten 2 Sekunden. Schnitte im Takt der Musik, Untertitel einblenden." : null,
            clientApproved: status === "veroeffentlicht" || status === "eingeplant",
          })
          .returning();
        if (status !== "veroeffentlicht") continue;
        for (const p of platforms) {
          const range = d.views?.[p] ?? [300, 1500];
          let views = r(range[0], range[1]);
          if (range[2] && !viralUsed && m === Math.min(2, monthsBack) && isVideo && i === 1) {
            views = range[2];
            viralUsed = true;
          }
          const likes = Math.round(views * (0.04 + rnd() * 0.05));
          const ext = `demo-${cid}-${content.id}-${p}`;
          const url =
            p === "tiktok"
              ? `https://www.tiktok.com/@${d.tiktok}/video/${7400000000000000000 + content.id}`
              : p === "facebook"
                ? `https://www.facebook.com/`
                : `https://www.instagram.com/${d.instagram}/`;
          const [post] = await db
            .insert(posts)
            .values({
              customerId: cid,
              contentId: content.id,
              platform: p,
              externalId: ext,
              url,
              caption: title,
              mediaType: isVideo ? (p === "tiktok" ? "Video" : "Reel") : "Bild",
              publishedAt: publishDate,
              views,
              reach: Math.round(views * 0.82),
              likes,
              comments: Math.round(likes * (0.03 + rnd() * 0.05)),
              shares: Math.round(views * (0.002 + rnd() * 0.008)),
              saves: Math.round(views * (0.003 + rnd() * 0.01)),
              source: "manuell",
              lastSyncedAt: nowIso,
            })
            .returning();
          await db.insert(postSnapshots).values({ postId: post.id, date: today, views: post.views, reach: post.reach, likes: post.likes, comments: post.comments, shares: post.shares, saves: post.saves });
          if (p === platforms[0]) await db.update(contents).set({ publishedUrl: url }).where(eq(contents.id, content.id));
        }
      }
    }
    // Ideen für nächsten Monat
    await db.insert(contents).values(
      ["Saisonales Special", "Kunden-Testimonial"].map((t) => ({ customerId: cid, title: t, format: "reel", platforms: ["instagram"], status: "idee", periodMonth: monthKey(addMonths(thisMonth, 1)) })),
    );
  }

  // ── Werbekampagnen (Autohaus) ──
  const adRows: (typeof adStatsDaily.$inferInsert)[] = [];
  for (const [name, objective, conv] of [
    ["Frühlings-Check Werkstatt", "Leads", [1, 5]],
    ["Gebrauchtwagen Retargeting", "Website-Besuche", [0, 2]],
  ] as const) {
    const [camp] = await db
      .insert(adCampaigns)
      .values({ customerId: ids.auto, platform: "meta", name, objective, status: "aktiv", dailyBudget: 2500, startDate: addDays(today, -95), source: "manuell" })
      .returning();
    for (const date of eachDay(addDays(today, -90), addDays(today, -1))) {
      const impressions = r(1800, 4200);
      adRows.push({ campaignId: camp.id, date, spend: r(2100, 2600), impressions, reach: Math.round(impressions * 0.7), clicks: r(35, 95), conversions: r(conv[0], conv[1]) });
    }
  }
  await insertChunked(adRows, (chunk) => db.insert(adStatsDaily).values(chunk));

  // ── Tracking-Links & Klicks ──
  const linkDefs = [
    { key: "zahn", label: "NFC-Bewertungskarte Empfang", channel: "nfc", slug: "demo-kaya-nfc", target: "https://search.google.com/local/writereview", perDay: [1, 6] },
    { key: "cafe", label: "Website-Link im Google-Profil", channel: "google", slug: "demo-lindenblatt-google", target: "https://www.cafe-lindenblatt.example", perDay: [2, 9] },
    { key: "holz", label: "Karriere-Link TikTok-Bio", channel: "tiktok", slug: "demo-holtkamp-jobs", target: "https://www.tischlerei-holtkamp.example/karriere", perDay: [0, 5] },
  ];
  for (const l of linkDefs) {
    const [link] = await db
      .insert(trackingLinks)
      .values({ customerId: ids[l.key], slug: l.slug, label: l.label, targetUrl: l.target, channel: l.channel })
      .returning();
    const clicks: (typeof linkClicks.$inferInsert)[] = [];
    for (const date of eachDay(addDays(today, -120), today)) {
      const n = r(l.perDay[0], l.perDay[1]);
      for (let i = 0; i < n; i++) clicks.push({ linkId: link.id, date, at: `${date}T${String(r(8, 20)).padStart(2, "0")}:${String(r(0, 59)).padStart(2, "0")}:00.000Z`, device: rnd() < 0.82 ? "mobil" : "desktop", referrer: l.channel === "google" ? "www.google.com" : null });
    }
    await insertChunked(clicks, (chunk) => db.insert(linkClicks).values(chunk));
    await db.update(trackingLinks).set({ clickCount: clicks.length }).where(eq(trackingLinks.id, link.id));
  }

  // ── Rechnungen (Demo-Nummernkreis) ──
  let invSeq = 1;
  for (const d of defs) {
    if (!d.contract) continue;
    const cid = ids[d.key];
    const months = Math.min(6, d.startMonthsAgo);
    for (let m = months; m >= 1; m--) {
      const from = addMonths(thisMonth, -m);
      const to = endOfMonth(from);
      const items: LineItem[] = [{ title: d.contract.title, description: `Leistungszeitraum ${from.split("-").reverse().join(".")} – ${to.split("-").reverse().join(".")}`, quantity: 1, unit: "Monat", unitPrice: d.contract.fee, taxRate: 19 }];
      if (m === months && d.key === "holz") items.push({ title: "Drohnenaufnahmen Werkstatt", description: "inkl. Schnitt, 3 Clips", quantity: 1, unit: "Pauschale", unitPrice: 45000, taxRate: 19 });
      const t = computeTotals(items, 0, false);
      const issue = from;
      const due = addDays(issue, 14);
      const overdue = d.key === "auto" && m === 1;
      const open = (d.key === "cafe" && m === 1) || overdue;
      const issueFinal = overdue ? addDays(today, -23) : d.key === "cafe" && m === 1 ? addDays(today, -6) : issue;
      const dueFinal = overdue ? addDays(today, -9) : d.key === "cafe" && m === 1 ? addDays(today, 8) : due;
      const [inv] = await db
        .insert(invoices)
        .values({
          number: `DEMO-${issueFinal.slice(0, 4)}-${String(invSeq++).padStart(4, "0")}`,
          customerId: cid,
          title: `${d.contract.title} – ${["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"][Number(from.slice(5, 7)) - 1]} ${from.slice(0, 4)}`,
          status: open ? "offen" : "bezahlt",
          issueDate: issueFinal,
          serviceFrom: from,
          serviceTo: to,
          dueDate: dueFinal,
          intro: "vielen Dank für Ihr Vertrauen. Wir berechnen Ihnen folgende Leistungen:",
          outro: "Bitte überweisen Sie den Rechnungsbetrag bis zum {{faellig}} unter Angabe der Rechnungsnummer.",
          netTotal: t.net,
          taxTotal: t.tax,
          grossTotal: t.gross,
          paidTotal: open ? 0 : t.gross,
          finalizedAt: `${issueFinal}T09:00:00.000Z`,
          sentAt: `${issueFinal}T09:05:00.000Z`,
          paidAt: open ? null : addDays(issueFinal, r(3, 13)),
          createdBy: userId,
        })
        .returning();
      await db.insert(invoiceItems).values(items.map((it, i) => ({ invoiceId: inv.id, position: i, title: it.title, description: it.description, quantity: it.quantity, unit: it.unit, unitPrice: it.unitPrice, taxRate: it.taxRate })));
      if (!open) await db.insert(payments).values({ invoiceId: inv.id, date: inv.paidAt!, amount: t.gross, method: "ueberweisung" });
    }
  }

  // ── Angebote ──
  const quoteDefs: { key: string; title: string; status: "versendet" | "angenommen" | "entwurf"; issue: string; items: LineItem[] }[] = [
    {
      key: "fit",
      title: "Social Media Paket S + Imagefilm",
      status: "versendet",
      issue: addDays(today, -12),
      items: [
        { title: "Social Media Paket S", description: "2 Reels, 4 Posts pro Monat, Community-Management", quantity: 1, unit: "Monat", unitPrice: 79000, taxRate: 19 },
        { title: "Imagefilm mit Drohnenaufnahmen", description: "1 Drehtag, Schnitt, 60s + 3 Kurzversionen", quantity: 1, unit: "Pauschale", unitPrice: 189000, taxRate: 19 },
        { title: "Meta Ads und Google Ads", description: "optional, zzgl. Werbebudget", quantity: 1, unit: "Monat", unitPrice: 39000, taxRate: 19, optional: true },
      ],
    },
    {
      key: "holz",
      title: "TikTok & Recruiting-Videos",
      status: "angenommen",
      issue: addMonths(thisMonth, -5),
      items: [{ title: "TikTok & Recruiting-Videos", description: "6 Videos pro Monat inkl. Dreh vor Ort", quantity: 1, unit: "Monat", unitPrice: 159000, taxRate: 19 }],
    },
    {
      key: "cafe",
      title: "NFC-Bewertungskarten für alle Tische",
      status: "entwurf",
      issue: today,
      items: [{ title: "NFC-Bewertungskarten", description: "individuell bedruckt, mit Tracking-Link", quantity: 15, unit: "Stück", unitPrice: 1900, taxRate: 19 }],
    },
  ];
  let qSeq = 1;
  for (const q of quoteDefs) {
    const t = computeTotals(q.items, 0, false);
    const [row] = await db
      .insert(quotes)
      .values({
        number: `DEMO-AN-${q.issue.slice(0, 4)}-${String(qSeq++).padStart(3, "0")}`,
        customerId: ids[q.key],
        title: q.title,
        status: q.status,
        issueDate: q.issue,
        validUntil: addDays(q.issue, 30),
        intro: "vielen Dank für Ihr Interesse. Gerne unterbreiten wir Ihnen folgendes Angebot:",
        outro: "Wir freuen uns auf die Zusammenarbeit.",
        netTotal: t.net,
        taxTotal: t.tax,
        grossTotal: t.gross,
        sentAt: q.status !== "entwurf" ? `${q.issue}T10:00:00.000Z` : null,
        decidedAt: q.status === "angenommen" ? addDays(q.issue, 4) : null,
        createdBy: userId,
      })
      .returning();
    await db.insert(quoteItems).values(q.items.map((it, i) => ({ quoteId: row.id, position: i, title: it.title, description: it.description, quantity: it.quantity, unit: it.unit, unitPrice: it.unitPrice, taxRate: it.taxRate, optional: !!it.optional })));
  }

  // ── Termine ──
  const ev = (o: Partial<typeof events.$inferInsert> & { title: string; start: string }) => ({ type: "meeting", assigneeIds: [userId], isDemo: true, createdBy: userId, ...o });
  await db.insert(events).values([
    ev({ title: "Dreh: Herbstkarte & Latte Art", type: "dreh", start: `${addDays(today, 2)}T08:30`, end: `${addDays(today, 2)}T10:30`, customerId: ids.cafe, location: "Berliner Straße 21, Gütersloh", countsAsVisit: true, assigneeIds: [userId, other.id] }),
    ev({ title: "Erstgespräch Follow-up", type: "meeting", start: `${addDays(today, 1)}T14:00`, end: `${addDays(today, 1)}T15:00`, customerId: ids.fit, location: "Münsterstraße 40, Harsewinkel" }),
    ev({ title: "NFC-Karten übergeben & Team schulen", type: "vor_ort", start: `${addDays(today, 5)}T12:30`, end: `${addDays(today, 5)}T13:15`, customerId: ids.zahn, countsAsVisit: true }),
    ev({ title: "Monats-Call Ads-Reporting", type: "call", start: `${addDays(today, 3)}T09:00`, end: `${addDays(today, 3)}T09:30`, customerId: ids.auto, assigneeIds: [other.id] }),
    ev({ title: "Dreh Werkstatt (Azubi-Serie)", type: "dreh", start: `${addDays(thisMonth, 2) < today ? addDays(thisMonth, 2) : addDays(today, -1)}T07:30`, end: `${addDays(thisMonth, 2) < today ? addDays(thisMonth, 2) : addDays(today, -1)}T11:00`, customerId: ids.holz, countsAsVisit: true, assigneeIds: [other.id] }),
    ev({ title: "Dreh Frühstückskarte", type: "dreh", start: `${addDays(thisMonth, 1) < today ? addDays(thisMonth, 1) : today}T08:00`, end: `${addDays(thisMonth, 1) < today ? addDays(thisMonth, 1) : today}T10:00`, customerId: ids.cafe, countsAsVisit: true }),
    ev({ title: "Steuerberater: Unterlagen Q3", type: "intern", start: `${addDays(today, 8)}T16:00`, end: `${addDays(today, 8)}T17:00`, assigneeIds: [userId, other.id] }),
    ...[1, 2, 3].map((m) =>
      ev({ title: "Dreh vor Ort", type: "dreh", start: `${addDays(addMonths(thisMonth, -m), 8)}T09:00`, end: `${addDays(addMonths(thisMonth, -m), 8)}T11:00`, customerId: ids.cafe, countsAsVisit: true }),
    ),
  ]);

  // ── Aufgaben ──
  await db.insert(tasks).values([
    { title: "Rohmaterial Frühstücks-Dreh sichten", customerId: ids.cafe, assigneeId: userId, dueDate: today, priority: "normal", isDemo: true, createdBy: userId },
    { title: "Angebot Pulsschlag nachfassen", customerId: ids.fit, assigneeId: userId, dueDate: addDays(today, -1), priority: "hoch", isDemo: true, createdBy: userId },
    { title: "15 NFC-Karten bestellen", customerId: ids.zahn, assigneeId: other.id, dueDate: addDays(today, 3), priority: "normal", isDemo: true, createdBy: userId },
    { title: "Verlängerung mit Autohaus Brenner besprechen", customerId: ids.auto, assigneeId: other.id, dueDate: addDays(today, 6), priority: "hoch", isDemo: true, createdBy: userId },
    { title: "Musik-Lizenzen für Reels prüfen", assigneeId: null, priority: "niedrig", isDemo: true, createdBy: userId },
  ]);

  // ── Ausgaben ──
  const exp: (typeof expenses.$inferInsert)[] = [];
  const gross = (g: number, rate = 19) => ({ grossAmount: g, netAmount: Math.round(g / (1 + rate / 100)), taxAmount: g - Math.round(g / (1 + rate / 100)), taxRate: rate });
  for (let m = 5; m >= 0; m--) {
    const ms = addMonths(thisMonth, -m);
    if (ms > today) continue;
    exp.push({ date: addDays(ms, 2), vendor: "Adobe", description: "Creative Cloud (Premiere, After Effects)", category: "software", ...gross(7139), recurring: "monatlich", isDemo: true });
    exp.push({ date: addDays(ms, 4), vendor: "Canva", description: "Canva Pro Team", category: "software", ...gross(2398), recurring: "monatlich", isDemo: true });
    exp.push({ date: addDays(ms, 9), vendor: "Telekom", description: "Mobilfunk Geschäftshandy", category: "telefon", ...gross(3999), recurring: "monatlich", isDemo: true });
    if (addDays(ms, 15) <= today) exp.push({ date: addDays(ms, 15), vendor: "Aral", description: "Tanken – Fahrten zu Kunden", category: "fahrtkosten", ...gross(r(6500, 9800)), isDemo: true });
  }
  exp.push({ date: addMonths(thisMonth, -4), vendor: "DJI Store", description: "DJI Mini 4 Pro Fly More", category: "equipment", ...gross(109900), isDemo: true });
  exp.push({ date: addDays(addMonths(thisMonth, -2), 11), vendor: "Rode", description: "Wireless GO II Funkmikrofon", category: "equipment", ...gross(29900), isDemo: true });
  exp.push({ date: addDays(addMonths(thisMonth, -1), 20), vendor: "Jonas Weber (Cutter)", description: "Schnitt Azubi-Serie", category: "fremdleistung", netAmount: 45000, taxAmount: 0, grossAmount: 45000, taxRate: 0, customerId: ids.holz, isDemo: true });
  exp.push({ date: addDays(today, -3), vendor: "Bürobedarf Müller", description: "Druckerpapier & Toner", category: "buero", ...gross(3490), paymentMethod: "privat_auslage", paidByUserId: other.id, isDemo: true });
  await db.insert(expenses).values(exp);

  // ── Verlauf & E-Mails ──
  await db.insert(activities).values([
    { customerId: ids.cafe, userId, kind: "anruf", title: "Telefonat", body: "Julia wünscht sich mehr Content zur neuen Herbstkarte. Drehtermin für nächste Woche vereinbart.", createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { customerId: ids.auto, userId: other.id, kind: "meeting", title: "Meeting", body: "Kampagne „Frühlings-Check“ läuft sehr gut (Kosten pro Lead gesunken). Thomas überlegt, das Budget zu erhöhen.", createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
    { customerId: ids.zahn, userId, kind: "notiz", title: "Notiz", body: "Praxis ist begeistert von den NFC-Karten – 15 weitere für die Behandlungszimmer gewünscht.", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { customerId: ids.fit, userId, kind: "meeting", title: "Erstgespräch", body: "Ziel: Mitgliederzahl im Januar steigern. Budget ca. 800–1.000 €/Monat. Angebot geschickt.", createdAt: new Date(Date.now() - 12 * 86400000).toISOString() },
  ]);
  await db.insert(emails).values([
    {
      direction: "ein",
      customerId: ids.cafe,
      fromAddr: "Julia Lindner <julia@cafe-lindenblatt.example>",
      toAddr: "hallo@rother-marketing.de",
      subject: "Re: Drehtermin Herbstkarte",
      text: "Hallo ihr beiden,\n\nDonnerstag 8:30 passt super! Ich lege die neuen Kuchen schon bereit.\n\nLiebe Grüße\nJulia",
      messageId: `<demo-1-${randomToken(6)}@demo>`,
      status: "empfangen",
      isRead: false,
      date: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      direction: "ein",
      customerId: ids.fit,
      fromAddr: "Sandra Vogt <sandra@pulsschlag-fitness.example>",
      toAddr: "hallo@rother-marketing.de",
      subject: "Frage zum Angebot",
      text: "Hallo,\n\ndanke für das Angebot! Können wir den Imagefilm auch erst im Januar drehen? Dann ist das Studio frisch renoviert.\n\nViele Grüße\nSandra Vogt",
      messageId: `<demo-2-${randomToken(6)}@demo>`,
      status: "empfangen",
      isRead: false,
      date: new Date(Date.now() - 26 * 3600000).toISOString(),
    },
  ]);
}

/** Entfernt alle Demo-Daten (Kunden inkl. aller verknüpften Daten sowie markierte Ausgaben/Termine/Aufgaben). */
export async function removeDemo(): Promise<number> {
  const demo = await db.select({ id: customers.id }).from(customers).where(eq(customers.isDemo, true));
  const ids = demo.map((d) => d.id);
  if (ids.length) {
    await db.delete(invoices).where(inArray(invoices.customerId, ids));
    await db.delete(quotes).where(inArray(quotes.customerId, ids));
    await db.delete(events).where(inArray(events.customerId, ids));
    await db.delete(emails).where(inArray(emails.customerId, ids));
    await db.delete(expenses).where(inArray(expenses.customerId, ids));
    const demoFiles = await db.select({ id: files.id }).from(files).where(inArray(files.customerId, ids));
    if (demoFiles.length) {
      const { deleteFile } = await import("./storage");
      for (const f of demoFiles) await deleteFile(f.id);
    }
    await db.delete(customers).where(inArray(customers.id, ids));
  }
  await db.delete(expenses).where(eq(expenses.isDemo, true));
  await db.delete(events).where(eq(events.isDemo, true));
  await db.delete(tasks).where(eq(tasks.isDemo, true));
  return ids.length;
}
