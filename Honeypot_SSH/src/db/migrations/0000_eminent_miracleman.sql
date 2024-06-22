CREATE TABLE `executed_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`command` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`fk_login` int,
	CONSTRAINT `executed_commands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`username` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`ip` varchar(45) NOT NULL,
	`location` varchar(255),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `executed_commands` ADD CONSTRAINT `executed_commands_fk_login_login_attempts_id_fk` FOREIGN KEY (`fk_login`) REFERENCES `login_attempts`(`id`) ON DELETE no action ON UPDATE no action;