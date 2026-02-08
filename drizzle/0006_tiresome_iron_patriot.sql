CREATE TABLE `automationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ruleId` int,
	`campaignId` varchar(100),
	`campaignName` varchar(255),
	`ruleType` varchar(50) NOT NULL,
	`conditionsMet` json NOT NULL,
	`actionTaken` varchar(100) NOT NULL,
	`actionDetails` json,
	`metricsSnapshot` json,
	`success` boolean NOT NULL,
	`errorMessage` text,
	`isSimulation` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ruleType` varchar(50) NOT NULL,
	`conditions` json NOT NULL,
	`actions` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`cooldownHours` int DEFAULT 24,
	`lastExecutedAt` timestamp,
	`executionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` varchar(100) NOT NULL,
	`campaignName` varchar(255),
	`objective` varchar(100),
	`spend` decimal(15,2),
	`impressions` int,
	`clicks` int,
	`results` int,
	`cpr` decimal(15,2),
	`ctr` decimal(10,4),
	`cpc` decimal(15,2),
	`cprTrend` varchar(20),
	`performanceScore` int,
	`snapshotDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `automationLogs` ADD CONSTRAINT `automationLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automationLogs` ADD CONSTRAINT `automationLogs_ruleId_automationRules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `automationRules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automationRules` ADD CONSTRAINT `automationRules_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaignSnapshots` ADD CONSTRAINT `campaignSnapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;