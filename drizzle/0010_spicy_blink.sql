ALTER TABLE `users` ADD `lastActivityAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `activeSeconds` int DEFAULT 0 NOT NULL;