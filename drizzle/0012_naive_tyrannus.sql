CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientOpenId` varchar(64) NOT NULL,
	`workspaceId` int,
	`kind` enum('task','news','system') NOT NULL DEFAULT 'system',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`href` varchar(255),
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientOpenId_users_openId_fk` FOREIGN KEY (`recipientOpenId`) REFERENCES `users`(`openId`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notifications_recipient_read_created_idx` ON `notifications` (`recipientOpenId`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_workspace_idx` ON `notifications` (`workspaceId`);