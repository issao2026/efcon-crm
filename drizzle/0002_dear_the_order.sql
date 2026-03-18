CREATE TABLE `document_group_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`documentId` int,
	`docType` enum('rg','cpf','cnh','comprovante_residencia','matricula','iptu','certidao','escritura','contrato','outro') DEFAULT 'outro',
	`label` varchar(100),
	`status` enum('pendente','enviado','validado','rejeitado') DEFAULT 'pendente',
	`ocrFields` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_group_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dealId` int,
	`personName` varchar(255) NOT NULL,
	`personRole` enum('comprador','vendedor','locador','locatario','fiador','corretor','imovel','outro') DEFAULT 'outro',
	`cpf` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_groups_id` PRIMARY KEY(`id`)
);
