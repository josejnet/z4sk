CREATE TABLE `question_metrics` (
	`question_hash` text NOT NULL,
	`locale` text NOT NULL,
	`level` text NOT NULL,
	`library_version` text NOT NULL,
	`selected_count` integer DEFAULT 0 NOT NULL,
	`completed_count` integer DEFAULT 0 NOT NULL,
	`total_answer_chars` integer DEFAULT 0 NOT NULL,
	`last_completed_at` text,
	PRIMARY KEY(`question_hash`, `locale`, `level`, `library_version`)
);
--> statement-breakpoint
CREATE TABLE `trend_metrics` (
	`question_hash` text NOT NULL,
	`country` text NOT NULL,
	`locale` text NOT NULL,
	`level` text NOT NULL,
	`completed_count` integer DEFAULT 0 NOT NULL,
	`total_answer_chars` integer DEFAULT 0 NOT NULL,
	`last_completed_at` text NOT NULL,
	PRIMARY KEY(`question_hash`, `country`, `locale`, `level`)
);
--> statement-breakpoint
ALTER TABLE `games` ADD `locale` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `library_version` text DEFAULT '2026.08' NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `double_blind` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `creator_interest` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `pack_slug` text DEFAULT 'original' NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `opened_at` text;--> statement-breakpoint
ALTER TABLE `responses` ADD `reactions_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `responses` ADD `matched` integer DEFAULT 0 NOT NULL;