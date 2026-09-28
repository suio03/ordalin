CREATE TABLE `import_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`external_id` text NOT NULL,
	`discovery_url` text NOT NULL,
	`website_url` text NOT NULL,
	`canonical_domain` text NOT NULL,
	`status` text DEFAULT 'discovered' NOT NULL,
	`candidate_json` text NOT NULL,
	`analysis_json` text,
	`decision_reasons_json` text DEFAULT '[]' NOT NULL,
	`tool_id` text,
	`error_summary` text,
	`discovered_at` integer NOT NULL,
	`analyzed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_candidates_provider_external_unique` ON `import_candidates` (`provider`,`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `import_candidates_domain_unique` ON `import_candidates` (`canonical_domain`);--> statement-breakpoint
CREATE INDEX `import_candidates_status_updated` ON `import_candidates` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `import_candidates_tool` ON `import_candidates` (`tool_id`);