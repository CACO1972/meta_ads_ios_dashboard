CREATE TABLE `leadPatientMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int NOT NULL,
	`patientId` int NOT NULL,
	`matchScore` int NOT NULL,
	`matchMethod` varchar(50) NOT NULL,
	`matchDetails` json,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadPatientMatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metaAdsLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nombre` varchar(100),
	`apellido` varchar(100),
	`email` varchar(255),
	`telefono` varchar(50),
	`campaignId` varchar(100),
	`campaignName` varchar(255),
	`adId` varchar(100),
	`adName` varchar(255),
	`adsetId` varchar(100),
	`adsetName` varchar(255),
	`costPerResult` decimal(15,2),
	`spend` decimal(15,2),
	`leadTimestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metaAdsLeads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leadPatientMatches` ADD CONSTRAINT `leadPatientMatches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leadPatientMatches` ADD CONSTRAINT `leadPatientMatches_leadId_metaAdsLeads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `metaAdsLeads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leadPatientMatches` ADD CONSTRAINT `leadPatientMatches_patientId_dentalinkPatients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `dentalinkPatients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leadPatientMatches` ADD CONSTRAINT `leadPatientMatches_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `metaAdsLeads` ADD CONSTRAINT `metaAdsLeads_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;