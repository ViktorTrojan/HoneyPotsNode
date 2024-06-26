CREATE TABLE `attack` (
	`service` varchar(20) NOT NULL,
	`fk_attacker` int NOT NULL,
	`fk_credential` int NOT NULL,
	CONSTRAINT `attack_fk_attacker_fk_credential_pk` PRIMARY KEY(`fk_attacker`,`fk_credential`)
);
--> statement-breakpoint
CREATE TABLE `attacker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ip` varchar(45) NOT NULL,
	`location` varchar(255),
	`reported` boolean NOT NULL DEFAULT false,
	CONSTRAINT `attacker_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credential` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	CONSTRAINT `credential_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attack` ADD CONSTRAINT `attack_fk_attacker_attacker_id_fk` FOREIGN KEY (`fk_attacker`) REFERENCES `attacker`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attack` ADD CONSTRAINT `attack_fk_credential_credential_id_fk` FOREIGN KEY (`fk_credential`) REFERENCES `credential`(`id`) ON DELETE no action ON UPDATE no action;