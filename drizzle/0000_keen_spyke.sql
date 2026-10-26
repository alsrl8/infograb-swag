CREATE TABLE `receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`product` text NOT NULL,
	`name` text NOT NULL,
	`device` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_product_per_name` ON `receipts` (`product`,`name`);