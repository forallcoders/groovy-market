ALTER TABLE "users_table" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_referral_code_unique" UNIQUE("referral_code");