CREATE TABLE `invites` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`used_by_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`used_by_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `players` ADD `is_admin` integer DEFAULT false NOT NULL;