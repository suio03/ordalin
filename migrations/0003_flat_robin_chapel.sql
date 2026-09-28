CREATE TABLE `submission_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_hash` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `submission_attempts_actor_action_created` ON `submission_attempts` (`actor_hash`,`action`,`created_at`);--> statement-breakpoint
CREATE TABLE `submission_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`website_url` text NOT NULL,
	`canonical_domain` text NOT NULL,
	`candidate_json` text NOT NULL,
	`actor_hash` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `submission_drafts_domain_status` ON `submission_drafts` (`canonical_domain`,`status`);--> statement-breakpoint
CREATE INDEX `submission_drafts_expires` ON `submission_drafts` (`expires_at`);