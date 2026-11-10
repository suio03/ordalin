CREATE TABLE `account_signals` (
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`value_hash` text NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `kind`, `value_hash`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_signals_kind_value` ON `account_signals` (`kind`,`value_hash`,`last_seen_at`);--> statement-breakpoint
CREATE TABLE `credit_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`delta` integer NOT NULL,
	`kind` text NOT NULL,
	`reference` text NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_ledger_kind_reference` ON `credit_ledger` (`kind`,`reference`);--> statement-breakpoint
CREATE INDEX `credit_ledger_user_created` ON `credit_ledger` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `free_claims` (
	`user_id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`order_id` text NOT NULL,
	`capture_id` text,
	`quantity` integer NOT NULL,
	`credits` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`payer_email` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_order_unique` ON `payments` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_capture_unique` ON `payments` (`capture_id`);--> statement-breakpoint
CREATE INDEX `payments_user_created` ON `payments` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_sessions_user` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_sessions_expires` ON `user_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`google_sub` text NOT NULL,
	`email` text NOT NULL,
	`email_normalized` text NOT NULL,
	`name` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`last_login_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);--> statement-breakpoint
CREATE INDEX `users_email_normalized` ON `users` (`email_normalized`);--> statement-breakpoint
ALTER TABLE `submissions` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `funding` text;--> statement-breakpoint
CREATE INDEX `submissions_user_created` ON `submissions` (`user_id`,`created_at`);