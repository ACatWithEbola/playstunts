CREATE TABLE `global_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`rules` text NOT NULL,
	`track_hash` text NOT NULL,
	`car_code` text NOT NULL,
	`ticks` integer NOT NULL,
	`record` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `global_scores_track_time` ON `global_scores` (`rules`,`track_hash`,`ticks`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `score_requests` (
	`bucket` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
