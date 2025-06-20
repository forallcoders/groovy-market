CREATE TABLE "bracket_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"contract_address" text,
	"referrer_id" integer,
	"rewards_claimed" boolean DEFAULT false,
	"rewards_amount" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bracket_referrals" ADD CONSTRAINT "bracket_referrals_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_referrals" ADD CONSTRAINT "bracket_referrals_referrer_id_users_table_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users_table"("id") ON DELETE set null ON UPDATE no action;