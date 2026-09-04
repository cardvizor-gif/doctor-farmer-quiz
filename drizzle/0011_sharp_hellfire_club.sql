CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regions_id` PRIMARY KEY(`id`),
	CONSTRAINT `regions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `salesTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`creatorOpenId` varchar(64) NOT NULL,
	`assigneeOpenId` varchar(64) NOT NULL,
	`farmId` int,
	`proposalId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueAt` timestamp,
	`priority` enum('low','normal','high') NOT NULL DEFAULT 'normal',
	`status` enum('todo','in_progress','done','cancelled') NOT NULL DEFAULT 'todo',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salesTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaceMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userOpenId` varchar(64) NOT NULL,
	`membershipRole` enum('manager','rop','cluster_director','deputy_ceo','ceo') NOT NULL DEFAULT 'manager',
	`assignedByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_members_user_unique` UNIQUE(`workspaceId`,`userOpenId`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`regionId` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_region_unique` UNIQUE(`regionId`)
);
--> statement-breakpoint
ALTER TABLE `accessRequests` ADD `regionId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `primaryRegionId` int;--> statement-breakpoint
ALTER TABLE `salesTasks` ADD CONSTRAINT `salesTasks_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `salesTasks` ADD CONSTRAINT `salesTasks_creatorOpenId_users_openId_fk` FOREIGN KEY (`creatorOpenId`) REFERENCES `users`(`openId`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `salesTasks` ADD CONSTRAINT `salesTasks_assigneeOpenId_users_openId_fk` FOREIGN KEY (`assigneeOpenId`) REFERENCES `users`(`openId`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `salesTasks` ADD CONSTRAINT `salesTasks_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `salesTasks` ADD CONSTRAINT `salesTasks_proposalId_proposals_id_fk` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceMembers` ADD CONSTRAINT `workspaceMembers_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceMembers` ADD CONSTRAINT `workspaceMembers_userOpenId_users_openId_fk` FOREIGN KEY (`userOpenId`) REFERENCES `users`(`openId`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_regionId_regions_id_fk` FOREIGN KEY (`regionId`) REFERENCES `regions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sales_tasks_workspace_due_idx` ON `salesTasks` (`workspaceId`,`dueAt`);--> statement-breakpoint
CREATE INDEX `sales_tasks_assignee_status_idx` ON `salesTasks` (`assigneeOpenId`,`status`);--> statement-breakpoint
CREATE INDEX `sales_tasks_creator_idx` ON `salesTasks` (`creatorOpenId`);--> statement-breakpoint
CREATE INDEX `workspace_members_user_idx` ON `workspaceMembers` (`userOpenId`);--> statement-breakpoint
CREATE INDEX `workspace_members_role_idx` ON `workspaceMembers` (`membershipRole`);--> statement-breakpoint
CREATE INDEX `workspaces_active_idx` ON `workspaces` (`isActive`);--> statement-breakpoint
ALTER TABLE `accessRequests` ADD CONSTRAINT `accessRequests_regionId_regions_id_fk` FOREIGN KEY (`regionId`) REFERENCES `regions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_primaryRegionId_regions_id_fk` FOREIGN KEY (`primaryRegionId`) REFERENCES `regions`(`id`) ON DELETE set null ON UPDATE no action;