CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer,
	`user_id` integer,
	`kind` text DEFAULT 'notiz' NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`ref_type` text,
	`ref_id` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_customer_idx` ON `activities` (`customer_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ad_campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`platform` text NOT NULL,
	`external_id` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'aktiv' NOT NULL,
	`objective` text,
	`daily_budget` integer,
	`start_date` text,
	`end_date` text,
	`source` text DEFAULT 'manuell' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ad_campaigns_customer_idx` ON `ad_campaigns` (`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ad_campaigns_external_unique` ON `ad_campaigns` (`platform`,`external_id`);--> statement-breakpoint
CREATE TABLE `ad_stats_daily` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`date` text NOT NULL,
	`spend` integer DEFAULT 0 NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`reach` integer DEFAULT 0 NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`conversions` real DEFAULT 0 NOT NULL,
	`conversion_value` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `ad_campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ad_stats_unique` ON `ad_stats_daily` (`campaign_id`,`date`);--> statement-breakpoint
CREATE TABLE `baselines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`platform` text NOT NULL,
	`metric` text NOT NULL,
	`value` real NOT NULL,
	`date` text,
	`note` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `baselines_unique` ON `baselines` (`customer_id`,`platform`,`metric`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`name` text NOT NULL,
	`position` text,
	`email` text,
	`phone` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contacts_customer_idx` ON `contacts` (`customer_id`);--> statement-breakpoint
CREATE TABLE `contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`title` text NOT NULL,
	`format` text DEFAULT 'reel' NOT NULL,
	`platforms` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'idee' NOT NULL,
	`assignee_id` integer,
	`period_month` text NOT NULL,
	`shoot_date` text,
	`due_date` text,
	`publish_date` text,
	`concept` text,
	`notes` text,
	`published_url` text,
	`client_approved` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `contents_customer_idx` ON `contents` (`customer_id`);--> statement-breakpoint
CREATE INDEX `contents_period_idx` ON `contents` (`period_month`);--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'aktiv' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`min_term_months` integer DEFAULT 0 NOT NULL,
	`notice_period` integer DEFAULT 0 NOT NULL,
	`notice_unit` text DEFAULT 'monate' NOT NULL,
	`auto_renew_months` integer DEFAULT 0 NOT NULL,
	`monthly_fee` integer DEFAULT 0 NOT NULL,
	`setup_fee` integer DEFAULT 0 NOT NULL,
	`billing_interval` text DEFAULT 'monatlich' NOT NULL,
	`auto_invoice` integer DEFAULT false NOT NULL,
	`next_invoice_date` text,
	`videos_per_month` integer DEFAULT 0 NOT NULL,
	`posts_per_month` integer DEFAULT 0 NOT NULL,
	`visits_per_month` integer DEFAULT 0 NOT NULL,
	`ad_budget_monthly` integer DEFAULT 0 NOT NULL,
	`services` text DEFAULT '[]' NOT NULL,
	`conditions` text,
	`notes` text,
	`file_id` integer,
	`signed_at` text,
	`cancelled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contracts_customer_idx` ON `contracts` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`name` text NOT NULL,
	`industry` text,
	`status` text DEFAULT 'aktiv' NOT NULL,
	`email` text,
	`phone` text,
	`website` text,
	`street` text,
	`zip` text,
	`city` text,
	`country` text DEFAULT 'Deutschland',
	`vat_id` text,
	`color` text DEFAULT '#C1502E' NOT NULL,
	`owner_id` integer,
	`start_date` text,
	`source` text,
	`instagram_handle` text,
	`tiktok_handle` text,
	`facebook_url` text,
	`youtube_url` text,
	`google_business_url` text,
	`google_place_id` text,
	`payment_term_days` integer,
	`report_token` text NOT NULL,
	`report_enabled` integer DEFAULT false NOT NULL,
	`notes` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_number_unique` ON `customers` (`number`);--> statement-breakpoint
CREATE INDEX `customers_status_idx` ON `customers` (`status`);--> statement-breakpoint
CREATE TABLE `emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`direction` text NOT NULL,
	`customer_id` integer,
	`from_addr` text NOT NULL,
	`to_addr` text NOT NULL,
	`cc` text,
	`subject` text NOT NULL,
	`text` text,
	`html` text,
	`message_id` text,
	`in_reply_to` text,
	`status` text NOT NULL,
	`error` text,
	`ref_type` text,
	`ref_id` integer,
	`attachments` text DEFAULT '[]' NOT NULL,
	`user_id` integer,
	`is_read` integer DEFAULT true NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emails_message_id_unique` ON `emails` (`message_id`);--> statement-breakpoint
CREATE INDEX `emails_date_idx` ON `emails` (`date`);--> statement-breakpoint
CREATE INDEX `emails_customer_idx` ON `emails` (`customer_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'meeting' NOT NULL,
	`start` text NOT NULL,
	`end` text,
	`all_day` integer DEFAULT false NOT NULL,
	`location` text,
	`customer_id` integer,
	`content_id` integer,
	`assignee_ids` text DEFAULT '[]' NOT NULL,
	`counts_as_visit` integer DEFAULT false NOT NULL,
	`notes` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `events_start_idx` ON `events` (`start`);--> statement-breakpoint
CREATE INDEX `events_customer_idx` ON `events` (`customer_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`vendor` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'sonstiges' NOT NULL,
	`net_amount` integer NOT NULL,
	`tax_rate` integer DEFAULT 19 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`gross_amount` integer NOT NULL,
	`customer_id` integer,
	`paid_by_user_id` integer,
	`payment_method` text DEFAULT 'geschaeftskonto' NOT NULL,
	`reimbursed` integer DEFAULT false NOT NULL,
	`recurring` text DEFAULT 'nein' NOT NULL,
	`receipt_file_id` integer,
	`notes` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `expenses_date_idx` ON `expenses` (`date`);--> statement-breakpoint
CREATE INDEX `expenses_customer_idx` ON `expenses` (`customer_id`);--> statement-breakpoint
CREATE TABLE `file_blobs` (
	`key` text PRIMARY KEY NOT NULL,
	`data` blob NOT NULL
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer,
	`name` text NOT NULL,
	`category` text DEFAULT 'sonstiges' NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`ref_type` text,
	`ref_id` integer,
	`notes` text,
	`uploaded_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_storage_key_unique` ON `files` (`storage_key`);--> statement-breakpoint
CREATE INDEX `files_customer_idx` ON `files` (`customer_id`);--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`provider` text NOT NULL,
	`external_id` text,
	`name` text,
	`access_token` text,
	`refresh_token` text,
	`expires_at` text,
	`scopes` text,
	`config` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'aktiv' NOT NULL,
	`last_sync_at` text,
	`last_error` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `integrations_customer_idx` ON `integrations` (`customer_id`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text DEFAULT 'Pauschale' NOT NULL,
	`unit_price` integer DEFAULT 0 NOT NULL,
	`tax_rate` integer DEFAULT 19 NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invoice_items_invoice_idx` ON `invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text,
	`kind` text DEFAULT 'rechnung' NOT NULL,
	`customer_id` integer NOT NULL,
	`quote_id` integer,
	`contract_id` integer,
	`cancels_invoice_id` integer,
	`title` text NOT NULL,
	`status` text DEFAULT 'entwurf' NOT NULL,
	`issue_date` text NOT NULL,
	`service_from` text,
	`service_to` text,
	`due_date` text,
	`intro` text,
	`outro` text,
	`discount_percent` real DEFAULT 0 NOT NULL,
	`net_total` integer DEFAULT 0 NOT NULL,
	`tax_total` integer DEFAULT 0 NOT NULL,
	`gross_total` integer DEFAULT 0 NOT NULL,
	`paid_total` integer DEFAULT 0 NOT NULL,
	`finalized_at` text,
	`sent_at` text,
	`paid_at` text,
	`reminder_level` integer DEFAULT 0 NOT NULL,
	`last_reminder_at` text,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE INDEX `invoices_customer_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE TABLE `link_clicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` integer NOT NULL,
	`at` text NOT NULL,
	`date` text NOT NULL,
	`device` text,
	`referrer` text,
	`country` text,
	FOREIGN KEY (`link_id`) REFERENCES `tracking_links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `link_clicks_link_date_idx` ON `link_clicks` (`link_id`,`date`);--> statement-breakpoint
CREATE TABLE `metrics_daily` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`platform` text NOT NULL,
	`metric` text NOT NULL,
	`date` text NOT NULL,
	`value` real NOT NULL,
	`source` text DEFAULT 'manuell' NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `metrics_daily_unique` ON `metrics_daily` (`customer_id`,`platform`,`metric`,`date`);--> statement-breakpoint
CREATE INDEX `metrics_daily_lookup` ON `metrics_daily` (`customer_id`,`platform`,`metric`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`method` text DEFAULT 'ueberweisung' NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payments_invoice_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `payments_date_idx` ON `payments` (`date`);--> statement-breakpoint
CREATE TABLE `post_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`date` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`reach` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`saves` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_snapshots_unique` ON `post_snapshots` (`post_id`,`date`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`content_id` integer,
	`platform` text NOT NULL,
	`external_id` text,
	`url` text,
	`caption` text,
	`media_type` text,
	`thumbnail_url` text,
	`published_at` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`reach` integer DEFAULT 0 NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`saves` integer DEFAULT 0 NOT NULL,
	`source` text DEFAULT 'manuell' NOT NULL,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_customer_idx` ON `posts` (`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `posts_external_unique` ON `posts` (`platform`,`external_id`);--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quote_id` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text DEFAULT 'Pauschale' NOT NULL,
	`unit_price` integer DEFAULT 0 NOT NULL,
	`tax_rate` integer DEFAULT 19 NOT NULL,
	`optional` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quote_items_quote_idx` ON `quote_items` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`customer_id` integer NOT NULL,
	`contact_id` integer,
	`title` text NOT NULL,
	`status` text DEFAULT 'entwurf' NOT NULL,
	`issue_date` text NOT NULL,
	`valid_until` text,
	`intro` text,
	`outro` text,
	`discount_percent` real DEFAULT 0 NOT NULL,
	`net_total` integer DEFAULT 0 NOT NULL,
	`tax_total` integer DEFAULT 0 NOT NULL,
	`gross_total` integer DEFAULT 0 NOT NULL,
	`sent_at` text,
	`decided_at` text,
	`invoice_id` integer,
	`contract_id` integer,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_number_unique` ON `quotes` (`number`);--> statement-breakpoint
CREATE INDEX `quotes_customer_idx` ON `quotes` (`customer_id`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`unit` text DEFAULT 'Pauschale' NOT NULL,
	`unit_price` integer DEFAULT 0 NOT NULL,
	`tax_rate` integer DEFAULT 19 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`customer_id` integer,
	`assignee_id` integer,
	`due_date` text,
	`priority` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'offen' NOT NULL,
	`completed_at` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE TABLE `tracking_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`target_url` text NOT NULL,
	`channel` text DEFAULT 'sonstiges' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`click_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracking_links_slug_unique` ON `tracking_links` (`slug`);--> statement-breakpoint
CREATE INDEX `tracking_links_customer_idx` ON `tracking_links` (`customer_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'inhaber' NOT NULL,
	`color` text DEFAULT '#C1502E' NOT NULL,
	`calendar_token` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_login_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);