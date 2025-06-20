ALTER TABLE "events_table" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events_table" ADD COLUMN "execute_at" timestamp DEFAULT now() NOT NULL;