DROP TABLE "pinata_groups_table" CASCADE;--> statement-breakpoint
ALTER TABLE "brackets_table" ADD COLUMN "status" text DEFAULT 'not-created' NOT NULL;--> statement-breakpoint
ALTER TABLE "brackets_table" DROP COLUMN "token_cid";