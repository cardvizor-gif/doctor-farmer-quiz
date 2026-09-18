CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`workspaceId` int,
	`title` varchar(255) NOT NULL,
	`season` varchar(32),
	`crop` varchar(160),
	`area` decimal(12,1) NOT NULL DEFAULT '0',
	`potentialValue` decimal(14,2) NOT NULL DEFAULT '0',
	`probability` int NOT NULL DEFAULT 50,
	`stage` enum('new','contacted','qualified','proposal','sent','negotiation','confirmed','won','lost') NOT NULL DEFAULT 'new',
	`nextAction` text,
	`nextActionAt` timestamp,
	`lostReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orderRequests` ADD `dealId` int;--> statement-breakpoint
ALTER TABLE `proposals` ADD `dealId` int;--> statement-breakpoint
ALTER TABLE `salesTasks` ADD `dealId` int;--> statement-breakpoint
ALTER TABLE `deals` ADD CONSTRAINT `deals_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deals` ADD CONSTRAINT `deals_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `deals_farm_idx` ON `deals` (`farmId`);--> statement-breakpoint
CREATE INDEX `deals_owner_stage_idx` ON `deals` (`ownerOpenId`,`stage`);--> statement-breakpoint
CREATE INDEX `deals_workspace_idx` ON `deals` (`workspaceId`);--> statement-breakpoint
ALTER TABLE `orderRequests` ADD CONSTRAINT `orderRequests_dealId_deals_id_fk` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_dealId_deals_id_fk` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `salesTasks` ADD CONSTRAINT `salesTasks_dealId_deals_id_fk` FOREIGN KEY (`dealId`) REFERENCES `deals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_requests_deal_idx` ON `orderRequests` (`dealId`);--> statement-breakpoint
CREATE INDEX `proposals_deal_idx` ON `proposals` (`dealId`);--> statement-breakpoint
CREATE INDEX `sales_tasks_deal_idx` ON `salesTasks` (`dealId`);