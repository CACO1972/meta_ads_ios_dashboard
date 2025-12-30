CREATE TABLE `aiCopilotConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`promptMaestro` text,
	`maxCPR` decimal(15,2),
	`minROI` decimal(10,2),
	`maxFrequency` decimal(5,2),
	`maxDailySpend` decimal(15,2),
	`autoApproveHighConfidence` boolean NOT NULL DEFAULT false,
	`autoApproveThreshold` decimal(5,2) DEFAULT '0.95',
	`analysisInterval` int NOT NULL DEFAULT 60,
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`highPriorityOnly` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiCopilotConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `aiCopilotConfig_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` decimal(15,2) NOT NULL,
	`ltv` decimal(15,2) NOT NULL,
	`cprTarget` decimal(15,2) NOT NULL,
	`cprMax` decimal(15,2) NOT NULL,
	`roiMin` decimal(10,2) NOT NULL DEFAULT '5',
	`keywords` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suggestionApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`suggestionId` int NOT NULL,
	`userId` int NOT NULL,
	`decision` enum('approved','rejected','postponed') NOT NULL,
	`notes` text,
	`postponeUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suggestionApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suggestionExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`suggestionId` int NOT NULL,
	`success` boolean NOT NULL,
	`errorMessage` text,
	`actualRevenue` decimal(15,2),
	`actualProfit` decimal(15,2),
	`actualSavings` decimal(15,2),
	`actualROI` decimal(10,2),
	`apiResponse` json,
	`rolledBack` boolean NOT NULL DEFAULT false,
	`rollbackReason` text,
	`rollbackAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suggestionExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('budget','audience','creative','schedule','service','objective','placement','device','location','strategy') NOT NULL,
	`priority` enum('high','medium','low') NOT NULL,
	`action` varchar(100) NOT NULL,
	`targetType` enum('ad','adset','campaign') NOT NULL,
	`targetId` varchar(100) NOT NULL,
	`targetName` varchar(255) NOT NULL,
	`serviceName` varchar(100),
	`currentState` json NOT NULL,
	`proposedState` json NOT NULL,
	`estimatedRevenue` decimal(15,2),
	`estimatedProfit` decimal(15,2),
	`estimatedSavings` decimal(15,2),
	`estimatedROI` decimal(10,2),
	`confidence` decimal(5,2) NOT NULL,
	`risk` enum('low','medium','high') NOT NULL,
	`reasoning` text NOT NULL,
	`monitoringConfig` json,
	`status` enum('pending','approved','rejected','executed','failed','rolled_back','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`approvedAt` timestamp,
	`executedAt` timestamp,
	CONSTRAINT `suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aiCopilotConfig` ADD CONSTRAINT `aiCopilotConfig_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestionApprovals` ADD CONSTRAINT `suggestionApprovals_suggestionId_suggestions_id_fk` FOREIGN KEY (`suggestionId`) REFERENCES `suggestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestionApprovals` ADD CONSTRAINT `suggestionApprovals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestionExecutions` ADD CONSTRAINT `suggestionExecutions_suggestionId_suggestions_id_fk` FOREIGN KEY (`suggestionId`) REFERENCES `suggestions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suggestions` ADD CONSTRAINT `suggestions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;