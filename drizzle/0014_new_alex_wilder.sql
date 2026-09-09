CREATE TABLE `catalogImportBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`status` enum('preview','applied','rejected') NOT NULL DEFAULT 'preview',
	`rowCount` int NOT NULL DEFAULT 0,
	`summaryJson` text NOT NULL,
	`importedByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`appliedAt` timestamp,
	CONSTRAINT `catalogImportBatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `catalogProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`catalogId` varchar(80) NOT NULL,
	`name` varchar(255) NOT NULL,
	`preparativeForm` varchar(80),
	`category` varchar(120),
	`productGroup` varchar(120),
	`active` int NOT NULL DEFAULT 1,
	`registrationStatus` varchar(80),
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`pricePrepayment` decimal(14,2),
	`price5050` decimal(14,2),
	`price7030` decimal(14,2),
	`priceDeferred` decimal(14,2),
	`fullDataJson` text NOT NULL,
	`updatedByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalogProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalogProducts_catalogId_unique` UNIQUE(`catalogId`)
);
--> statement-breakpoint
CREATE INDEX `catalog_imports_created_idx` ON `catalogImportBatches` (`createdAt`);--> statement-breakpoint
CREATE INDEX `catalog_imports_status_idx` ON `catalogImportBatches` (`status`);--> statement-breakpoint
CREATE INDEX `catalog_products_active_idx` ON `catalogProducts` (`active`);--> statement-breakpoint
CREATE INDEX `catalog_products_group_idx` ON `catalogProducts` (`productGroup`);--> statement-breakpoint
CREATE INDEX `catalog_products_updated_idx` ON `catalogProducts` (`updatedAt`);