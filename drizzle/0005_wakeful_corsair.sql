CREATE TABLE `supportAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`pagePath` varchar(255) NOT NULL DEFAULT '/',
	`status` enum('new','in_progress','resolved') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `supportAttachments` ADD CONSTRAINT `supportAttachments_ticketId_supportTickets_id_fk` FOREIGN KEY (`ticketId`) REFERENCES `supportTickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `support_attachments_ticket_idx` ON `supportAttachments` (`ticketId`);--> statement-breakpoint
CREATE INDEX `support_tickets_owner_updated_idx` ON `supportTickets` (`ownerOpenId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `support_tickets_status_updated_idx` ON `supportTickets` (`status`,`updatedAt`);