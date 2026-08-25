ALTER TABLE `farms` ADD `ownerOpenId` varchar(64);--> statement-breakpoint
CREATE INDEX `farms_owner_updated_at_idx` ON `farms` (`ownerOpenId`,`updatedAt`);