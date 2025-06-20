CREATE TABLE "brackets_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"initial_owner" text NOT NULL,
	"token_id" integer,
	"prediction" text NOT NULL,
	"is_submitted" boolean DEFAULT false NOT NULL,
	"tournament_id" integer NOT NULL,
	"token_cid" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"data" json NOT NULL,
	"contract_address" text NOT NULL,
	"retries" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard_points_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	"points" integer NOT NULL,
	"match_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"home_team" integer NOT NULL,
	"away_team" integer NOT NULL,
	"home_points" integer DEFAULT 0 NOT NULL,
	"away_points" integer DEFAULT 0 NOT NULL,
	"winner" integer,
	"contract_id" integer NOT NULL,
	"round" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "matches_table_contract_id_tournament_id_unique" UNIQUE("contract_id","tournament_id")
);
--> statement-breakpoint
CREATE TABLE "pinata_groups_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"group_id" text NOT NULL,
	"tournament_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pregen_wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" text NOT NULL,
	"wallet_id" text NOT NULL,
	"user_share" text NOT NULL,
	"cosmos_address" text,
	"sei_address" text,
	"noble_address" text,
	"claimed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"web3_name" text NOT NULL,
	"short_name" text NOT NULL,
	"logo" text NOT NULL,
	"gender" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"contract_id" integer NOT NULL,
	"region" text,
	"seed" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_teams_tournament_id_team_id_region_unique" UNIQUE("tournament_id","team_id","region")
);
--> statement-breakpoint
CREATE TABLE "tournament_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"round" integer NOT NULL,
	"gender" text NOT NULL,
	"prize_pool" integer DEFAULT 0 NOT NULL,
	"year" integer NOT NULL,
	"seed" integer DEFAULT 0 NOT NULL,
	"contract_address" text DEFAULT '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"capsule_id" text NOT NULL,
	"username" text NOT NULL,
	"referrer_id" integer,
	"has_placed_a_bracket" boolean DEFAULT false NOT NULL,
	"evm_address" text NOT NULL,
	"email" text NOT NULL,
	"avatar" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_table_evm_address_unique" UNIQUE("evm_address")
);
--> statement-breakpoint
ALTER TABLE "brackets_table" ADD CONSTRAINT "brackets_table_tournament_id_tournament_table_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_points_table" ADD CONSTRAINT "leaderboard_points_table_tournament_id_tournament_table_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_points_table" ADD CONSTRAINT "leaderboard_points_table_match_id_matches_table_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches_table" ADD CONSTRAINT "matches_table_tournament_id_tournament_table_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches_table" ADD CONSTRAINT "matches_table_home_team_tournament_teams_id_fk" FOREIGN KEY ("home_team") REFERENCES "public"."tournament_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches_table" ADD CONSTRAINT "matches_table_away_team_tournament_teams_id_fk" FOREIGN KEY ("away_team") REFERENCES "public"."tournament_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches_table" ADD CONSTRAINT "matches_table_winner_tournament_teams_id_fk" FOREIGN KEY ("winner") REFERENCES "public"."tournament_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinata_groups_table" ADD CONSTRAINT "pinata_groups_table_tournament_id_tournament_table_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pregen_wallets" ADD CONSTRAINT "pregen_wallets_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournament_id_tournament_table_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_team_id_teams_table_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams_table"("id") ON DELETE cascade ON UPDATE no action;