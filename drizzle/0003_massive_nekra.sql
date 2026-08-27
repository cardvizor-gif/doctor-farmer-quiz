CREATE TABLE `accessRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`requestedName` varchar(120) NOT NULL,
	`status` enum('pending','approved','rejected','activated') NOT NULL DEFAULT 'pending',
	`reviewedByOpenId` varchar(64),
	`reviewedAt` timestamp,
	`inviteCodeHash` varchar(128),
	`inviteCodeExpiresAt` timestamp,
	`inviteCodeUsedAt` timestamp,
	`localOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accessRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_requests_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `access_requests_status_created_idx` ON `accessRequests` (`status`,`createdAt`);