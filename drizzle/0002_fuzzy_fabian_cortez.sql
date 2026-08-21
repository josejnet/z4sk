CREATE TABLE `product_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`game_id` text NOT NULL,
	`locale` text NOT NULL,
	`level` text NOT NULL,
	`country` text NOT NULL,
	`pack_slug` text NOT NULL,
	`source` text NOT NULL,
	`library_version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_product_events_type_created` ON `product_events` (`event_type`,`created_at`);