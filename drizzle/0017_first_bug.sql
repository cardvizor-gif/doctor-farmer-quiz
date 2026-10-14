CREATE TABLE `salesPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`managerOpenId` varchar(64) NOT NULL,
	`periodKey` varchar(7) NOT NULL,
	`planAmount` decimal(16,2) NOT NULL,
	`assignedByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salesPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_plans_workspace_manager_period_unique` UNIQUE(`workspaceId`,`managerOpenId`,`periodKey`)
);
--> statement-breakpoint
ALTER TABLE `salesPlans` ADD CONSTRAINT `salesPlans_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `salesPlans` ADD CONSTRAINT `salesPlans_managerOpenId_users_openId_fk` FOREIGN KEY (`managerOpenId`) REFERENCES `users`(`openId`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `salesPlans` ADD CONSTRAINT `salesPlans_assignedByOpenId_users_openId_fk` FOREIGN KEY (`assignedByOpenId`) REFERENCES `users`(`openId`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sales_plans_manager_period_idx` ON `salesPlans` (`managerOpenId`,`periodKey`);--> statement-breakpoint
CREATE INDEX `sales_plans_workspace_period_idx` ON `salesPlans` (`workspaceId`,`periodKey`);