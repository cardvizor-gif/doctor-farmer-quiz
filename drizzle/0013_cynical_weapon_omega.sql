CREATE TABLE `supportMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`authorOpenId` varchar(64) NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `supportMessages` ADD CONSTRAINT `supportMessages_ticketId_supportTickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `supportTickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supportMessages` ADD CONSTRAINT `supportMessages_authorOpenId_users_openId_fk` FOREIGN KEY (`authorOpenId`) REFERENCES `users`(`openId`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `support_messages_ticket_created_idx` ON `supportMessages` (`ticketId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `support_messages_author_idx` ON `supportMessages` (`authorOpenId`);