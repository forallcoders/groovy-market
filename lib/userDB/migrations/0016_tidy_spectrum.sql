ALTER TABLE "users_table" ALTER COLUMN "address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "evm_address" SET NOT NULL;