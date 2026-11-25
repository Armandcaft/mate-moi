ALTER TABLE `players` ADD `must_change_pin` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `failed_logins` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `locked_until` integer;