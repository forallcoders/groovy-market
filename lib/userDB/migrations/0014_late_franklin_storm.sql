ALTER TABLE "users_table" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "proxy_wallet" text;--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_address_unique" UNIQUE("address");--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_proxy_wallet_unique" UNIQUE("proxy_wallet");