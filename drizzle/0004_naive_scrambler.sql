CREATE TABLE `orderRequestItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`unit` varchar(24) NOT NULL DEFAULT 'шт.',
	`quantity` decimal(14,3) NOT NULL,
	`unitPrice` decimal(16,2) NOT NULL DEFAULT '0',
	`lineTotal` decimal(16,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderRequestItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`requestDate` timestamp NOT NULL,
	`buyerName` varchar(255) NOT NULL,
	`managerName` varchar(120) NOT NULL,
	`managerEmail` varchar(320),
	`segment` enum('agroholding','dealer','large','medium','small') NOT NULL DEFAULT 'medium',
	`paymentTerms` varchar(32) NOT NULL DEFAULT '100%',
	`paymentDueDate` timestamp,
	`supplyDocuments` text,
	`deliveryDueDate` timestamp,
	`edoStatus` enum('yes','no') NOT NULL DEFAULT 'no',
	`edoProvider` varchar(120),
	`status` enum('draft','submitted','partial','shipped','cancelled') NOT NULL DEFAULT 'draft',
	`totalAmount` decimal(16,2) NOT NULL DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipmentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`requestItemId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`unit` varchar(24) NOT NULL DEFAULT 'шт.',
	`quantity` decimal(14,3) NOT NULL,
	`unitPrice` decimal(16,2) NOT NULL DEFAULT '0',
	`lineTotal` decimal(16,2) NOT NULL DEFAULT '0',
	CONSTRAINT `shipmentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`shipmentDate` timestamp NOT NULL,
	`documentNumber` varchar(120),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orderRequestItems` ADD CONSTRAINT `orderRequestItems_requestId_orderRequests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `orderRequests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderRequests` ADD CONSTRAINT `orderRequests_farmId_farms_id_fk` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipmentItems` ADD CONSTRAINT `shipmentItems_shipmentId_shipments_id_fk` FOREIGN KEY (`shipmentId`) REFERENCES `shipments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipmentItems` ADD CONSTRAINT `shipmentItems_requestItemId_orderRequestItems_id_fk` FOREIGN KEY (`requestItemId`) REFERENCES `orderRequestItems`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_requestId_orderRequests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `orderRequests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_request_items_request_idx` ON `orderRequestItems` (`requestId`);--> statement-breakpoint
CREATE INDEX `order_requests_owner_updated_idx` ON `orderRequests` (`ownerOpenId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `order_requests_farm_idx` ON `orderRequests` (`farmId`);--> statement-breakpoint
CREATE INDEX `order_requests_status_idx` ON `orderRequests` (`status`);--> statement-breakpoint
CREATE INDEX `shipment_items_shipment_idx` ON `shipmentItems` (`shipmentId`);--> statement-breakpoint
CREATE INDEX `shipment_items_request_item_idx` ON `shipmentItems` (`requestItemId`);--> statement-breakpoint
CREATE INDEX `shipments_request_date_idx` ON `shipments` (`requestId`,`shipmentDate`);