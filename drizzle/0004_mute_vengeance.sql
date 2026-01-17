CREATE TABLE `dentalinkAppointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dentalinkId` int NOT NULL,
	`patientId` int,
	`dentalinkPatientId` int NOT NULL,
	`dentistId` int,
	`sucursalId` int,
	`estadoId` int,
	`fecha` varchar(10) NOT NULL,
	`horaInicio` varchar(5) NOT NULL,
	`duracion` int NOT NULL,
	`comentarios` text,
	`estadoNombre` varchar(100),
	`estadoColor` varchar(20),
	`lastSyncAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dentalinkAppointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dentalinkCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiToken` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dentalinkCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `dentalinkCredentials_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `dentalinkPatients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dentalinkId` int NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`apellidos` varchar(255) NOT NULL,
	`rut` varchar(20) NOT NULL,
	`email` varchar(320),
	`celular` varchar(20),
	`telefono` varchar(20),
	`fechaNacimiento` varchar(10),
	`sexo` enum('M','F'),
	`direccion` text,
	`comuna` varchar(100),
	`ciudad` varchar(100),
	`dentalinkCreatedAt` timestamp,
	`dentalinkUpdatedAt` timestamp,
	`lastSyncAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dentalinkPatients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dentalinkTreatments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dentalinkId` int NOT NULL,
	`patientId` int,
	`dentalinkPatientId` int NOT NULL,
	`dentistId` int,
	`sucursalId` int,
	`nombre` varchar(255) NOT NULL,
	`fecha` varchar(10) NOT NULL,
	`finalizado` boolean NOT NULL DEFAULT false,
	`expirado` boolean NOT NULL DEFAULT false,
	`bloqueado` boolean NOT NULL DEFAULT false,
	`total` decimal(15,2) NOT NULL,
	`pagado` decimal(15,2) NOT NULL,
	`saldo` decimal(15,2) NOT NULL,
	`lastSyncAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dentalinkTreatments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadToPatientConversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` varchar(255) NOT NULL,
	`leadName` varchar(255),
	`leadPhone` varchar(20),
	`leadEmail` varchar(320),
	`leadSource` varchar(100),
	`campaignId` varchar(255),
	`campaignName` varchar(255),
	`adId` varchar(255),
	`adName` varchar(255),
	`leadCreatedAt` timestamp,
	`patientId` int,
	`dentalinkPatientId` int,
	`conversionStatus` enum('pending','matched','converted','appointment_scheduled','treatment_started','treatment_completed','lost') NOT NULL DEFAULT 'pending',
	`matchingConfidence` decimal(5,2),
	`matchingMethod` varchar(50),
	`daysToConversion` int,
	`appointmentDate` timestamp,
	`treatmentValue` decimal(15,2),
	`paidAmount` decimal(15,2),
	`notes` text,
	`matchedAt` timestamp,
	`convertedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadToPatientConversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dentalinkAppointments` ADD CONSTRAINT `dentalinkAppointments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dentalinkAppointments` ADD CONSTRAINT `dentalinkAppointments_patientId_dentalinkPatients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `dentalinkPatients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dentalinkCredentials` ADD CONSTRAINT `dentalinkCredentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dentalinkPatients` ADD CONSTRAINT `dentalinkPatients_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dentalinkTreatments` ADD CONSTRAINT `dentalinkTreatments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dentalinkTreatments` ADD CONSTRAINT `dentalinkTreatments_patientId_dentalinkPatients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `dentalinkPatients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leadToPatientConversions` ADD CONSTRAINT `leadToPatientConversions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leadToPatientConversions` ADD CONSTRAINT `leadToPatientConversions_patientId_dentalinkPatients_id_fk` FOREIGN KEY (`patientId`) REFERENCES `dentalinkPatients`(`id`) ON DELETE no action ON UPDATE no action;