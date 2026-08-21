CREATE TABLE `privacy_status` (
	`id` text PRIMARY KEY NOT NULL,
	`last_run_at` text NOT NULL,
	`last_source` text NOT NULL,
	`last_expired_games` integer DEFAULT 0 NOT NULL,
	`last_deleted_responses` integer DEFAULT 0 NOT NULL,
	`total_expired_games` integer DEFAULT 0 NOT NULL,
	`total_deleted_responses` integer DEFAULT 0 NOT NULL
);
