CREATE TABLE `metaAdsCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appId` varchar(255) NOT NULL,
	`appSecret` text NOT NULL,
	`accessToken` text NOT NULL,
	`adAccountId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metaAdsCredentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `metaAdsCredentials` ADD CONSTRAINT `metaAdsCredentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;