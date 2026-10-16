CREATE TABLE `score_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`submission` text NOT NULL,
	`track_hash` text NOT NULL,
	`track_name` text NOT NULL,
	`car_code` text NOT NULL,
	`ticks` integer NOT NULL,
	`record` text NOT NULL,
	`physics_engine` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`retry_at` integer DEFAULT 0 NOT NULL,
	`verified_id` text,
	`error` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `score_submissions_state_created` ON `score_submissions` (`state`,`created_at`);--> statement-breakpoint
CREATE INDEX `score_submissions_track` ON `score_submissions` (`track_hash`,`state`);