CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_active_order` ON `categories` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `collection_items` (
	`collection_id` text NOT NULL,
	`tool_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`editorial_note` text,
	PRIMARY KEY(`collection_id`, `tool_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_items_order_unique` ON `collection_items` (`collection_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `collections_published` ON `collections` (`is_published`,`published_at`);--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`cursor` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`fetched_count` integer DEFAULT 0 NOT NULL,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`duplicate_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`error_summary` text
);
--> statement-breakpoint
CREATE INDEX `ingestion_runs_provider_started` ON `ingestion_runs` (`provider`,`started_at`);--> statement-breakpoint
CREATE TABLE `moderation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`actor_identity` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `moderation_events_entity_created` ON `moderation_events` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`submitted_name` text NOT NULL,
	`website_url` text NOT NULL,
	`canonical_domain` text NOT NULL,
	`contact_email` text NOT NULL,
	`description` text NOT NULL,
	`suggested_category_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`turnstile_metadata_json` text NOT NULL,
	`moderation_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`suggested_category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `submissions_status_created` ON `submissions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `submissions_domain_created` ON `submissions` (`canonical_domain`,`created_at`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `tool_categories` (
	`tool_id` text NOT NULL,
	`category_id` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`tool_id`, `category_id`),
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tool_categories_category` ON `tool_categories` (`category_id`,`tool_id`);--> statement-breakpoint
CREATE TABLE `tool_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`tool_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_id` text NOT NULL,
	`source_url` text,
	`raw_json` text NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tool_sources_provider_external_unique` ON `tool_sources` (`provider`,`external_id`);--> statement-breakpoint
CREATE INDEX `tool_sources_tool` ON `tool_sources` (`tool_id`);--> statement-breakpoint
CREATE TABLE `tool_tags` (
	`tool_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`tool_id`, `tag_id`),
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tool_tags_tag` ON `tool_tags` (`tag_id`,`tool_id`);--> statement-breakpoint
CREATE TABLE `tools` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text NOT NULL,
	`description` text NOT NULL,
	`website_url` text NOT NULL,
	`canonical_domain` text NOT NULL,
	`pricing_model` text NOT NULL,
	`status` text DEFAULT 'pending_review' NOT NULL,
	`primary_category_id` text NOT NULL,
	`logo_asset_key` text,
	`screenshot_asset_key` text,
	`is_editor_pick` integer DEFAULT false NOT NULL,
	`source_first_seen_at` integer NOT NULL,
	`published_at` integer,
	`last_checked_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`primary_category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tools_slug_unique` ON `tools` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `tools_canonical_domain_unique` ON `tools` (`canonical_domain`);--> statement-breakpoint
CREATE INDEX `tools_status_published` ON `tools` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `tools_category_status_published` ON `tools` (`primary_category_id`,`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `tools_editor_pick_status` ON `tools` (`is_editor_pick`,`status`);