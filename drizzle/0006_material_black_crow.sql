ALTER TABLE `games` ADD `encryption_public_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `responses` ADD `encrypted_payload` text DEFAULT '' NOT NULL;--> statement-breakpoint
DELETE FROM `abuse_reports` WHERE `game_id` IN (SELECT `id` FROM `games` WHERE `encryption_public_key` = '');--> statement-breakpoint
DELETE FROM `responses` WHERE `game_id` IN (SELECT `id` FROM `games` WHERE `encryption_public_key` = '') OR `encrypted_payload` = '';--> statement-breakpoint
DELETE FROM `games` WHERE `encryption_public_key` = '';--> statement-breakpoint
DELETE FROM `product_events` WHERE `event_type` = 'matched';
