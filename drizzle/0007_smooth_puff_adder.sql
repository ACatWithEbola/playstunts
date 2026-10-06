CREATE TABLE `replay_assessment_lock` (
	`key` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`lease_until` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `shared_replays` ADD `assessment_version` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `shared_replays` ADD `assessed_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `shared_replays` ADD `assessment_retry_at` integer DEFAULT 0 NOT NULL;