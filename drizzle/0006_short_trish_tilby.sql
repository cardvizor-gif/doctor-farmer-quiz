CREATE TABLE `userPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userOpenId` varchar(64) NOT NULL,
	`permission` varchar(64) NOT NULL,
	`grantedByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userPermissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_permissions_user_permission_unique` UNIQUE(`userOpenId`,`permission`)
);
--> statement-breakpoint
CREATE INDEX `user_permissions_user_idx` ON `userPermissions` (`userOpenId`);