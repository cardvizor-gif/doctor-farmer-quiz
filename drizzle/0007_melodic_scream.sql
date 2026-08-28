ALTER TABLE `users` ADD `status` enum('active','archived') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `archivedByOpenId` varchar(64);