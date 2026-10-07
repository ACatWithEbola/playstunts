CREATE TABLE `run_history` (
	`id` text PRIMARY KEY NOT NULL,
	`rules` text NOT NULL,
	`track_hash` text NOT NULL,
	`car_code` text NOT NULL,
	`ticks` integer NOT NULL,
	`record` text NOT NULL,
	`created_at` integer NOT NULL,
	`driver_key` text NOT NULL,
	`route_assessment` text DEFAULT 'not_assessed' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `run_history_driver_track` ON `run_history` (`rules`,`track_hash`,`driver_key`,`created_at`,`id`);