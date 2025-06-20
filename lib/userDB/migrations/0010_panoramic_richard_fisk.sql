ALTER TABLE "pregen_wallets" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "pregen_wallets" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pregen_wallets" DROP COLUMN "cosmos_address";--> statement-breakpoint
ALTER TABLE "pregen_wallets" DROP COLUMN "sei_address";--> statement-breakpoint
ALTER TABLE "pregen_wallets" DROP COLUMN "noble_address";