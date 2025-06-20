ALTER TABLE "users_table" ADD COLUMN "dynamic_id" text;--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_dynamic_id_unique" UNIQUE("dynamic_id");