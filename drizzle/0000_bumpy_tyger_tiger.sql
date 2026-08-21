CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_token_hash` text NOT NULL,
	`creator_name` text NOT NULL,
	`recipient_name` text NOT NULL,
	`title` text NOT NULL,
	`level` text NOT NULL,
	`questions_json` text NOT NULL,
	`premium` integer DEFAULT 0 NOT NULL,
	`view_once` integer DEFAULT 0 NOT NULL,
	`closed` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`respondent_name` text NOT NULL,
	`answers_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_responses_game_created` ON `responses` (`game_id`,`created_at`);