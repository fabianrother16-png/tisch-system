import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/*
 * Konventionen
 * - Geldbeträge immer in Cent (integer)
 * - Reine Datumswerte als Text "YYYY-MM-DD"
 * - Termine als lokale Wandzeit "YYYY-MM-DDTHH:mm" (Europe/Berlin)
 * - Zeitstempel (created_at usw.) als ISO-String in UTC
 */

const now = () => new Date().toISOString();

// ─── Team & Einstellungen ──────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["inhaber", "mitarbeiter"] }).notNull().default("inhaber"),
  color: text("color").notNull().default("#C1502E"),
  calendarToken: text("calendar_token").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().$defaultFn(now),
});

// ─── Kunden ────────────────────────────────────────────────────────────────

export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: text("number").notNull().unique(),
    name: text("name").notNull(),
    industry: text("industry"),
    status: text("status", { enum: ["lead", "aktiv", "pausiert", "ehemalig"] })
      .notNull()
      .default("aktiv"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    street: text("street"),
    zip: text("zip"),
    city: text("city"),
    country: text("country").default("Deutschland"),
    vatId: text("vat_id"),
    color: text("color").notNull().default("#C1502E"),
    ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
    startDate: text("start_date"),
    source: text("source"),
    instagramHandle: text("instagram_handle"),
    tiktokHandle: text("tiktok_handle"),
    facebookUrl: text("facebook_url"),
    youtubeUrl: text("youtube_url"),
    googleBusinessUrl: text("google_business_url"),
    googlePlaceId: text("google_place_id"),
    paymentTermDays: integer("payment_term_days"),
    reportToken: text("report_token").notNull(),
    reportEnabled: integer("report_enabled", { mode: "boolean" }).notNull().default(false),
    notes: text("notes"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(now),
    updatedAt: text("updated_at").notNull().$defaultFn(now),
  },
  (t) => [index("customers_status_idx").on(t.status)],
);

export const contacts = sqliteTable(
  "contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: text("position"),
    email: text("email"),
    phone: text("phone"),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    notes: text("notes"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("contacts_customer_idx").on(t.customerId)],
);

/** Ausgangswerte vor Beginn der Zusammenarbeit – Basis für "Was hat sich durch uns verändert?" */
export const baselines = sqliteTable(
  "baselines",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    metric: text("metric").notNull(),
    value: real("value").notNull(),
    date: text("date"),
    note: text("note"),
  },
  (t) => [uniqueIndex("baselines_unique").on(t.customerId, t.platform, t.metric)],
);

export const contracts = sqliteTable(
  "contracts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status", { enum: ["entwurf", "aktiv", "gekuendigt", "beendet"] })
      .notNull()
      .default("aktiv"),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    minTermMonths: integer("min_term_months").notNull().default(0),
    noticePeriod: integer("notice_period").notNull().default(0),
    noticeUnit: text("notice_unit", { enum: ["tage", "wochen", "monate"] })
      .notNull()
      .default("monate"),
    autoRenewMonths: integer("auto_renew_months").notNull().default(0),
    monthlyFee: integer("monthly_fee").notNull().default(0),
    setupFee: integer("setup_fee").notNull().default(0),
    billingInterval: text("billing_interval", {
      enum: ["monatlich", "quartalsweise", "halbjaehrlich", "jaehrlich", "einmalig"],
    })
      .notNull()
      .default("monatlich"),
    autoInvoice: integer("auto_invoice", { mode: "boolean" }).notNull().default(false),
    nextInvoiceDate: text("next_invoice_date"),
    videosPerMonth: integer("videos_per_month").notNull().default(0),
    postsPerMonth: integer("posts_per_month").notNull().default(0),
    visitsPerMonth: integer("visits_per_month").notNull().default(0),
    adBudgetMonthly: integer("ad_budget_monthly").notNull().default(0),
    services: text("services", { mode: "json" }).$type<string[]>().notNull().default([]),
    conditions: text("conditions"),
    notes: text("notes"),
    fileId: integer("file_id"),
    signedAt: text("signed_at"),
    cancelledAt: text("cancelled_at"),
    createdAt: text("created_at").notNull().$defaultFn(now),
    updatedAt: text("updated_at").notNull().$defaultFn(now),
  },
  (t) => [index("contracts_customer_idx").on(t.customerId)],
);

// ─── Angebote & Rechnungen ─────────────────────────────────────────────────

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  unit: text("unit").notNull().default("Pauschale"),
  unitPrice: integer("unit_price").notNull().default(0),
  taxRate: integer("tax_rate").notNull().default(19),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const quotes = sqliteTable(
  "quotes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: text("number").notNull().unique(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    contactId: integer("contact_id"),
    title: text("title").notNull(),
    status: text("status", {
      enum: ["entwurf", "versendet", "angenommen", "abgelehnt", "abgelaufen"],
    })
      .notNull()
      .default("entwurf"),
    issueDate: text("issue_date").notNull(),
    validUntil: text("valid_until"),
    intro: text("intro"),
    outro: text("outro"),
    discountPercent: real("discount_percent").notNull().default(0),
    netTotal: integer("net_total").notNull().default(0),
    taxTotal: integer("tax_total").notNull().default(0),
    grossTotal: integer("gross_total").notNull().default(0),
    sentAt: text("sent_at"),
    decidedAt: text("decided_at"),
    invoiceId: integer("invoice_id"),
    contractId: integer("contract_id"),
    createdBy: integer("created_by"),
    createdAt: text("created_at").notNull().$defaultFn(now),
    updatedAt: text("updated_at").notNull().$defaultFn(now),
  },
  (t) => [index("quotes_customer_idx").on(t.customerId)],
);

export const quoteItems = sqliteTable(
  "quote_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quoteId: integer("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    title: text("title").notNull(),
    description: text("description"),
    quantity: real("quantity").notNull().default(1),
    unit: text("unit").notNull().default("Pauschale"),
    unitPrice: integer("unit_price").notNull().default(0),
    taxRate: integer("tax_rate").notNull().default(19),
    optional: integer("optional", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("quote_items_quote_idx").on(t.quoteId)],
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: text("number").unique(),
    kind: text("kind", { enum: ["rechnung", "storno"] }).notNull().default("rechnung"),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    quoteId: integer("quote_id"),
    contractId: integer("contract_id"),
    cancelsInvoiceId: integer("cancels_invoice_id"),
    title: text("title").notNull(),
    status: text("status", {
      enum: ["entwurf", "offen", "teilbezahlt", "bezahlt", "storniert"],
    })
      .notNull()
      .default("entwurf"),
    issueDate: text("issue_date").notNull(),
    serviceFrom: text("service_from"),
    serviceTo: text("service_to"),
    dueDate: text("due_date"),
    intro: text("intro"),
    outro: text("outro"),
    discountPercent: real("discount_percent").notNull().default(0),
    netTotal: integer("net_total").notNull().default(0),
    taxTotal: integer("tax_total").notNull().default(0),
    grossTotal: integer("gross_total").notNull().default(0),
    paidTotal: integer("paid_total").notNull().default(0),
    finalizedAt: text("finalized_at"),
    sentAt: text("sent_at"),
    paidAt: text("paid_at"),
    reminderLevel: integer("reminder_level").notNull().default(0),
    lastReminderAt: text("last_reminder_at"),
    createdBy: integer("created_by"),
    createdAt: text("created_at").notNull().$defaultFn(now),
    updatedAt: text("updated_at").notNull().$defaultFn(now),
  },
  (t) => [
    index("invoices_customer_idx").on(t.customerId),
    index("invoices_status_idx").on(t.status),
  ],
);

export const invoiceItems = sqliteTable(
  "invoice_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    title: text("title").notNull(),
    description: text("description"),
    quantity: real("quantity").notNull().default(1),
    unit: text("unit").notNull().default("Pauschale"),
    unitPrice: integer("unit_price").notNull().default(0),
    taxRate: integer("tax_rate").notNull().default(19),
  },
  (t) => [index("invoice_items_invoice_idx").on(t.invoiceId)],
);

export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    amount: integer("amount").notNull(),
    method: text("method").notNull().default("ueberweisung"),
    note: text("note"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("payments_invoice_idx").on(t.invoiceId), index("payments_date_idx").on(t.date)],
);

export const expenses = sqliteTable(
  "expenses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    vendor: text("vendor").notNull(),
    description: text("description"),
    category: text("category").notNull().default("sonstiges"),
    netAmount: integer("net_amount").notNull(),
    taxRate: integer("tax_rate").notNull().default(19),
    taxAmount: integer("tax_amount").notNull().default(0),
    grossAmount: integer("gross_amount").notNull(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    paidByUserId: integer("paid_by_user_id"),
    paymentMethod: text("payment_method", { enum: ["geschaeftskonto", "privat_auslage"] })
      .notNull()
      .default("geschaeftskonto"),
    reimbursed: integer("reimbursed", { mode: "boolean" }).notNull().default(false),
    recurring: text("recurring", { enum: ["nein", "monatlich", "jaehrlich"] })
      .notNull()
      .default("nein"),
    receiptFileId: integer("receipt_file_id"),
    notes: text("notes"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("expenses_date_idx").on(t.date), index("expenses_customer_idx").on(t.customerId)],
);

// ─── Content-Produktion & Performance ──────────────────────────────────────

export const contents = sqliteTable(
  "contents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    format: text("format").notNull().default("reel"),
    platforms: text("platforms", { mode: "json" }).$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("idee"),
    assigneeId: integer("assignee_id").references(() => users.id, { onDelete: "set null" }),
    periodMonth: text("period_month").notNull(),
    shootDate: text("shoot_date"),
    dueDate: text("due_date"),
    publishDate: text("publish_date"),
    concept: text("concept"),
    notes: text("notes"),
    publishedUrl: text("published_url"),
    clientApproved: integer("client_approved", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(now),
    updatedAt: text("updated_at").notNull().$defaultFn(now),
  },
  (t) => [
    index("contents_customer_idx").on(t.customerId),
    index("contents_period_idx").on(t.periodMonth),
  ],
);

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    contentId: integer("content_id"),
    platform: text("platform").notNull(),
    externalId: text("external_id"),
    url: text("url"),
    caption: text("caption"),
    mediaType: text("media_type"),
    thumbnailUrl: text("thumbnail_url"),
    publishedAt: text("published_at").notNull(),
    views: integer("views").notNull().default(0),
    reach: integer("reach").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    shares: integer("shares").notNull().default(0),
    saves: integer("saves").notNull().default(0),
    source: text("source", { enum: ["manuell", "api"] }).notNull().default("manuell"),
    lastSyncedAt: text("last_synced_at"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [
    index("posts_customer_idx").on(t.customerId),
    uniqueIndex("posts_external_unique").on(t.platform, t.externalId),
  ],
);

export const postSnapshots = sqliteTable(
  "post_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    views: integer("views").notNull().default(0),
    reach: integer("reach").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    shares: integer("shares").notNull().default(0),
    saves: integer("saves").notNull().default(0),
  },
  (t) => [uniqueIndex("post_snapshots_unique").on(t.postId, t.date)],
);

/** Tageswerte auf Kontoebene (Follower, Profilaufrufe, Google-Klicks, Bewertungen …) */
export const metricsDaily = sqliteTable(
  "metrics_daily",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    metric: text("metric").notNull(),
    date: text("date").notNull(),
    value: real("value").notNull(),
    source: text("source", { enum: ["manuell", "api"] }).notNull().default("manuell"),
  },
  (t) => [
    uniqueIndex("metrics_daily_unique").on(t.customerId, t.platform, t.metric, t.date),
    index("metrics_daily_lookup").on(t.customerId, t.platform, t.metric),
  ],
);

export const adCampaigns = sqliteTable(
  "ad_campaigns",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    externalId: text("external_id"),
    name: text("name").notNull(),
    status: text("status").notNull().default("aktiv"),
    objective: text("objective"),
    dailyBudget: integer("daily_budget"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    source: text("source", { enum: ["manuell", "api"] }).notNull().default("manuell"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [
    index("ad_campaigns_customer_idx").on(t.customerId),
    uniqueIndex("ad_campaigns_external_unique").on(t.platform, t.externalId),
  ],
);

export const adStatsDaily = sqliteTable(
  "ad_stats_daily",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => adCampaigns.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    spend: integer("spend").notNull().default(0),
    impressions: integer("impressions").notNull().default(0),
    reach: integer("reach").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    conversions: real("conversions").notNull().default(0),
    conversionValue: integer("conversion_value").notNull().default(0),
  },
  (t) => [uniqueIndex("ad_stats_unique").on(t.campaignId, t.date)],
);

export const integrations = sqliteTable(
  "integrations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    externalId: text("external_id"),
    name: text("name"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: text("expires_at"),
    scopes: text("scopes"),
    config: text("config", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
    status: text("status", { enum: ["aktiv", "fehler", "getrennt"] }).notNull().default("aktiv"),
    lastSyncAt: text("last_sync_at"),
    lastError: text("last_error"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("integrations_customer_idx").on(t.customerId)],
);

export const trackingLinks = sqliteTable(
  "tracking_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    targetUrl: text("target_url").notNull(),
    channel: text("channel").notNull().default("sonstiges"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    clickCount: integer("click_count").notNull().default(0),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("tracking_links_customer_idx").on(t.customerId)],
);

export const linkClicks = sqliteTable(
  "link_clicks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    linkId: integer("link_id")
      .notNull()
      .references(() => trackingLinks.id, { onDelete: "cascade" }),
    at: text("at").notNull(),
    date: text("date").notNull(),
    device: text("device"),
    referrer: text("referrer"),
    country: text("country"),
  },
  (t) => [index("link_clicks_link_date_idx").on(t.linkId, t.date)],
);

// ─── Organisation ──────────────────────────────────────────────────────────

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    type: text("type").notNull().default("meeting"),
    start: text("start").notNull(),
    end: text("end"),
    allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
    location: text("location"),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    contentId: integer("content_id"),
    assigneeIds: text("assignee_ids", { mode: "json" }).$type<number[]>().notNull().default([]),
    countsAsVisit: integer("counts_as_visit", { mode: "boolean" }).notNull().default(false),
    notes: text("notes"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdBy: integer("created_by"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("events_start_idx").on(t.start), index("events_customer_idx").on(t.customerId)],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    assigneeId: integer("assignee_id").references(() => users.id, { onDelete: "set null" }),
    dueDate: text("due_date"),
    priority: text("priority", { enum: ["niedrig", "normal", "hoch"] }).notNull().default("normal"),
    status: text("status", { enum: ["offen", "erledigt"] }).notNull().default("offen"),
    completedAt: text("completed_at"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdBy: integer("created_by"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("tasks_status_idx").on(t.status)],
);

export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    userId: integer("user_id"),
    kind: text("kind").notNull().default("notiz"),
    title: text("title").notNull(),
    body: text("body"),
    refType: text("ref_type"),
    refId: integer("ref_id"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("activities_customer_idx").on(t.customerId, t.createdAt)],
);

// ─── Ablage & Kommunikation ────────────────────────────────────────────────

export const files = sqliteTable(
  "files",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("sonstiges"),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    storageKey: text("storage_key").notNull().unique(),
    refType: text("ref_type"),
    refId: integer("ref_id"),
    notes: text("notes"),
    uploadedBy: integer("uploaded_by"),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("files_customer_idx").on(t.customerId)],
);

export const fileBlobs = sqliteTable("file_blobs", {
  key: text("key").primaryKey(),
  data: blob("data", { mode: "buffer" }).notNull(),
});

export const emails = sqliteTable(
  "emails",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    direction: text("direction", { enum: ["aus", "ein"] }).notNull(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    fromAddr: text("from_addr").notNull(),
    toAddr: text("to_addr").notNull(),
    cc: text("cc"),
    subject: text("subject").notNull(),
    text: text("text"),
    html: text("html"),
    messageId: text("message_id").unique(),
    inReplyTo: text("in_reply_to"),
    status: text("status", { enum: ["gesendet", "fehler", "empfangen"] }).notNull(),
    error: text("error"),
    refType: text("ref_type"),
    refId: integer("ref_id"),
    attachments: text("attachments", { mode: "json" }).$type<string[]>().notNull().default([]),
    userId: integer("user_id"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(true),
    date: text("date").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("emails_date_idx").on(t.date), index("emails_customer_idx").on(t.customerId)],
);

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Content = typeof contents.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type TrackingLink = typeof trackingLinks.$inferSelect;
export type CalendarEvent = typeof events.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type StoredFile = typeof files.$inferSelect;
export type Email = typeof emails.$inferSelect;
