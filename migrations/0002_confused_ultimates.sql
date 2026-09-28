CREATE TABLE `task_items` (
	`task_id` text NOT NULL,
	`tool_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`best_for` text NOT NULL,
	`key_difference` text NOT NULL,
	`limitation` text NOT NULL,
	PRIMARY KEY(`task_id`, `tool_id`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_items_order_unique` ON `task_items` (`task_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `task_items_tool` ON `task_items` (`tool_id`,`task_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`outcome` text NOT NULL,
	`guidance` text NOT NULL,
	`sort_order` integer NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_slug_unique` ON `tasks` (`slug`);--> statement-breakpoint
CREATE INDEX `tasks_published_order` ON `tasks` (`is_published`,`sort_order`);