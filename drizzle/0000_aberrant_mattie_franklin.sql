CREATE TABLE `farms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`district` varchar(160),
	`settlement` varchar(160),
	`contactName` varchar(160),
	`contactRole` varchar(160),
	`phone` varchar(64),
	`email` varchar(320),
	`totalArea` decimal(12,1) NOT NULL DEFAULT '0',
	`crops` text,
	`technology` varchar(160),
	`salesStage` enum('lead','diagnostics','proposal','negotiation','client') NOT NULL DEFAULT 'lead',
	`potentialValue` decimal(14,2) NOT NULL DEFAULT '0',
	`nextAction` text,
	`nextActionAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`crop` varchar(160) NOT NULL,
	`technology` varchar(160),
	`area` decimal(12,1) NOT NULL,
	`costPerHectare` decimal(14,2) NOT NULL DEFAULT '0',
	`totalCost` decimal(14,2) NOT NULL DEFAULT '0',
	`status` enum('draft','sent','approved','declined') NOT NULL DEFAULT 'draft',
	`schemeJson` text NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `farms_sales_stage_idx` ON `farms` (`salesStage`);--> statement-breakpoint
CREATE INDEX `farms_updated_at_idx` ON `farms` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `proposals_farm_idx` ON `proposals` (`farmId`);--> statement-breakpoint
CREATE INDEX `proposals_status_idx` ON `proposals` (`status`);