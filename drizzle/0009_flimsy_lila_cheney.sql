CREATE TABLE `leaderboard_reset_backups` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`purged_at` integer DEFAULT 0 NOT NULL,
	`purge_token` text DEFAULT '' NOT NULL
);
