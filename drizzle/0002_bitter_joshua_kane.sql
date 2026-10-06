CREATE TABLE `shared_replays` (
	`id` text PRIMARY KEY NOT NULL,
	`replay` text NOT NULL,
	`track_name` text NOT NULL,
	`created_at` integer NOT NULL
);
