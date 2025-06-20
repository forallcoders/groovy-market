ALTER TABLE "users_table" RENAME COLUMN "capsule_id" TO "para_id";--> statement-breakpoint
ALTER TABLE "users_table" DROP CONSTRAINT "users_table_capsule_id_unique";--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_para_id_unique" UNIQUE("para_id");