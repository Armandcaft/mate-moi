ALTER TABLE `players` ADD `is_owner` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `players_one_owner` ON `players` (`is_owner`) WHERE "players"."is_owner" = 1;