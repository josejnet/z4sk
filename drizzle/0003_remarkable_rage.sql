CREATE TABLE `abuse_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`reason` text NOT NULL,
	`country` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_abuse_reports_game` ON `abuse_reports` (`game_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`identifier_hash` text NOT NULL,
	`scope` text NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`identifier_hash`, `scope`, `window_start`)
);
