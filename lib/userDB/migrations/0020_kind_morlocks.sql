-- ALTER TABLE "users_table" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "users_table" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_email_unique" UNIQUE("email");