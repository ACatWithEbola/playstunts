CREATE TABLE `shared_tracks` (
	`hash` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bytes` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shared_tracks_created` ON `shared_tracks` (`created_at`,`hash`);