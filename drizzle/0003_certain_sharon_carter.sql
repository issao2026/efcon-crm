ALTER TABLE `clients` ADD `whatsapp` varchar(30);--> statement-breakpoint
ALTER TABLE `properties` ADD `propertyType` varchar(50);--> statement-breakpoint
ALTER TABLE `properties` ADD `totalValue` decimal(15,2);--> statement-breakpoint
ALTER TABLE `properties` ADD `items` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `matriculaDocUrl` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `matriculaDocKey` varchar(500);--> statement-breakpoint
ALTER TABLE `properties` ADD `propertyStatus` enum('disponivel','vendido','alugado','em_negociacao') DEFAULT 'disponivel';