CREATE TABLE "market_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"api_id" text,
	"prediction_date" date,
	"variant_key" text,
	"type" text NOT NULL,
	"asset" text NOT NULL,
	"metric" text NOT NULL,
	"metric_condition" text NOT NULL,
	"league_abbreviation" text,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"end_date" timestamp,
	"volume" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_address" text,
	"type" text DEFAULT 'single' NOT NULL,
	"parent_market_id" uuid,
	"condition_id" text,
	"yes_token_id" text,
	"no_token_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taker_order_hash" text NOT NULL,
	"maker_order_hashes" text[] NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"tx_hash" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_hash" text NOT NULL,
	"salt" text NOT NULL,
	"maker" text NOT NULL,
	"signer" text NOT NULL,
	"market_id" uuid,
	"side" text NOT NULL,
	"token_id" text NOT NULL,
	"maker_amount" text NOT NULL,
	"taker_amount" text NOT NULL,
	"filled_amount" text DEFAULT '0',
	"status" text DEFAULT 'pending' NOT NULL,
	"signature" text NOT NULL,
	"expiration" text NOT NULL,
	"tokens_transferred" boolean DEFAULT false,
	"transfer_tx_hash" text,
	"tokens_returned" boolean DEFAULT false,
	"return_tx_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"order_type" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_hash_unique" UNIQUE("order_hash")
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"token_id" text NOT NULL,
	"price" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"tx_hash" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"token_id" text,
	"user_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user" text NOT NULL,
	"market_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"shares" text NOT NULL,
	"amount" text NOT NULL,
	"price_per_share" text,
	"outcome_value" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"transaction_hash" text
);
--> statement-breakpoint
CREATE TABLE "user_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"market_id" uuid NOT NULL,
	"token_id" text NOT NULL,
	"condition_id" text NOT NULL,
	"balance" text NOT NULL,
	"entry_price" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"search_query" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "market_conditions" ADD CONSTRAINT "market_conditions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_positions" ADD CONSTRAINT "user_positions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mkt_cond_api_id_idx" ON "market_conditions" USING btree ("api_id");--> statement-breakpoint
CREATE INDEX "mkt_cond_asset_idx" ON "market_conditions" USING btree ("asset");--> statement-breakpoint
CREATE INDEX "mkt_cond_metric_idx" ON "market_conditions" USING btree ("metric");--> statement-breakpoint
CREATE INDEX "mkt_cond_prediction_date_idx" ON "market_conditions" USING btree ("prediction_date");--> statement-breakpoint
CREATE INDEX "mkt_cond_league_abbreviation_idx" ON "market_conditions" USING btree ("league_abbreviation");