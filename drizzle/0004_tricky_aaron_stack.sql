ALTER TABLE `global_scores` ADD `driver_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `global_scores_driver_car` ON `global_scores` (`rules`,`track_hash`,`car_code`,`driver_key`,`ticks`);
