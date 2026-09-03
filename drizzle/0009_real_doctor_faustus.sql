CREATE TABLE `inviteCodeHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`encryptedCode` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`issuedByOpenId` varchar(64) NOT NULL,
	`usedAt` timestamp,
	`usedByOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inviteCodeHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accessRequests` ADD `position` varchar(160);--> statement-breakpoint
ALTER TABLE `users` ADD `position` varchar(160);--> statement-breakpoint
ALTER TABLE `inviteCodeHistory` ADD CONSTRAINT `inviteCodeHistory_requestId_accessRequests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `accessRequests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `invite_code_history_request_created_idx` ON `inviteCodeHistory` (`requestId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `invite_code_history_hash_idx` ON `inviteCodeHistory` (`codeHash`);