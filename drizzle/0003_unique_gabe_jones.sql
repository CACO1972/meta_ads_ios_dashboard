CREATE TABLE `audienceInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('meta','tiktok','google','combined') NOT NULL,
	`ageDistribution` json,
	`genderDistribution` json,
	`locationDistribution` json,
	`topComunas` json,
	`socioeconomicDistribution` json,
	`topInterests` json,
	`deviceUsage` json,
	`peakActivityTimes` json,
	`bestPerformingSegments` json,
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audienceInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentGuides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('video','photo','testimonial','educational','promotional','behind_scenes') NOT NULL,
	`platform` enum('all','meta','tiktok','google','instagram','youtube') NOT NULL,
	`serviceId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`script` text,
	`shotList` json,
	`equipmentNeeded` json,
	`locationSuggestions` json,
	`estimatedDuration` int,
	`recommendedPostTime` json,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_production','completed','published') NOT NULL DEFAULT 'pending',
	`reasoning` text,
	`expectedEngagement` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentGuides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `globalCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`objective` varchar(100) NOT NULL,
	`serviceId` int,
	`totalBudget` decimal(15,2) NOT NULL,
	`metaBudget` decimal(15,2),
	`tiktokBudget` decimal(15,2),
	`googleBudget` decimal(15,2),
	`targetAgeMin` int,
	`targetAgeMax` int,
	`targetGender` enum('all','male','female'),
	`targetLocations` json,
	`targetInterests` json,
	`targetSocioeconomic` enum('all','high','medium-high','medium','medium-low','low'),
	`strategy` text NOT NULL,
	`expectedResults` json,
	`status` enum('draft','pending_approval','approved','active','paused','completed','rejected') NOT NULL DEFAULT 'draft',
	`approvedAt` timestamp,
	`rejectedAt` timestamp,
	`rejectionReason` text,
	`metaCampaignId` varchar(100),
	`tiktokCampaignId` varchar(100),
	`googleCampaignId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `globalCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('meta','tiktok','google') NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accountId` varchar(255),
	`platformConfig` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformCredentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audienceInsights` ADD CONSTRAINT `audienceInsights_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentGuides` ADD CONSTRAINT `contentGuides_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentGuides` ADD CONSTRAINT `contentGuides_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `globalCampaigns` ADD CONSTRAINT `globalCampaigns_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `globalCampaigns` ADD CONSTRAINT `globalCampaigns_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platformCredentials` ADD CONSTRAINT `platformCredentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;