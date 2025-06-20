import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export type MarketConditionType = "crypto" | "sports" | "traditional"

export type MarketStatus =
  | "pending"
  | "created"
  | "contested"
  | "resolved"
  | "closed"

export type MarketType = "single" | "combined" | "grouped"

export type OrderStatus =
  | "pending"
  | "filled"
  | "cancelled"
  | "expired"
  | "partially_filled"

// Activity types enum
export const ActivityType = {
  BUY: "buy",
  SELL: "sell",
  MERGE: "merge",
  SPLIT: "split",
  REDEEM: "redeem",
} as const

export const marketsTable = pgTable("markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  endDate: timestamp("end_date"),
  volume: text("volume"),
  status: text("status").notNull().default("pending").$type<MarketStatus>(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  creatorAddress: text("creator_address"),
  type: text("type").notNull().$type<MarketType>().default("single"),
  parentMarketId: uuid("parent_market_id"),
  conditionId: text("condition_id"),
  yesTokenId: text("yes_token_id"),
  noTokenId: text("no_token_id"),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const marketConditionsTable = pgTable(
  "market_conditions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    marketId: uuid("market_id")
      .notNull()
      .references(() => marketsTable.id, { onDelete: "cascade" }),
    apiId: text("api_id"),
    predictionDate: date("prediction_date"),
    variantKey: text("variant_key"),
    type: text("type").notNull().$type<MarketConditionType>(),
    asset: text("asset").notNull(),
    metric: text("metric").notNull(),
    metricCondition: text("metric_condition").notNull(),
    leagueAbbreviation: text("league_abbreviation"),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    apiIdx: index("mkt_cond_api_id_idx").on(table.apiId),
    assetIdx: index("mkt_cond_asset_idx").on(table.asset),
    metricIdx: index("mkt_cond_metric_idx").on(table.metric),
    predictionDateIdx: index("mkt_cond_prediction_date_idx").on(
      table.predictionDate
    ),
    leagueAbbreviationIdx: index("mkt_cond_league_abbreviation_idx").on(
      table.leagueAbbreviation
    ),
  })
)

export const ordersTable = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderHash: text("order_hash").notNull().unique(),
  salt: text("salt").notNull(),
  maker: text("maker").notNull(),
  signer: text("signer").notNull(),
  marketId: uuid("market_id").references(() => marketsTable.id),
  side: text("side").notNull().$type<"BUY" | "SELL">(),
  tokenId: text("token_id").notNull(),
  makerAmount: text("maker_amount").notNull(),
  takerAmount: text("taker_amount").notNull(),
  filledAmount: text("filled_amount").default("0"),
  status: text("status").notNull().default("pending").$type<OrderStatus>(),
  signature: text("signature").notNull(),
  expiration: text("expiration").notNull(),
  tokensTransferred: boolean("tokens_transferred").default(false),
  transferTxHash: text("transfer_tx_hash"),
  tokensReturned: boolean("tokens_returned").default(false),
  returnTxHash: text("return_tx_hash"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  orderType: text("order_type").notNull().$type<"market" | "limit">(),
  updated_at: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type")
    .notNull()
    .$type<"order_fill" | "order_cancel" | "token_transfer" | "order_match">(),
  status: text("status").notNull().$type<"success" | "pending" | "failed">(),
  txHash: text("tx_hash"),
  details: jsonb("details").notNull().default({}),
  tokenId: text("token_id"),
  userAddress: text("user_address"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const matchOpportunitiesTable = pgTable("match_opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  takerOrderHash: text("taker_order_hash").notNull(),
  makerOrderHashes: text("maker_order_hashes").array().notNull(),
  status: text("status")
    .notNull()
    .default("pending")
    .$type<"pending" | "processed" | "expired" | "processing" | "failed">(),
  priority: text("priority")
    .notNull()
    .default("medium")
    .$type<"high" | "medium" | "low">(),
  txHash: text("tx_hash"),
  processed_at: timestamp("processed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const priceHistoryTable = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id")
    .notNull()
    .references(() => marketsTable.id, { onDelete: "cascade" }),
  tokenId: text("token_id").notNull(),
  price: text("price").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
})

export const userPositionsTable = pgTable("user_positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userAddress: text("user_address").notNull(),
  marketId: uuid("market_id")
    .notNull()
    .references(() => marketsTable.id, { onDelete: "cascade" }),
  tokenId: text("token_id").notNull(),
  conditionId: text("condition_id").notNull(),
  balance: text("balance").notNull(),
  entryPrice: text("entry_price").notNull(),
  status: text("status")
    .notNull()
    .default("open")
    .$type<"open" | "closed" | "cancelled" | "won" | "lost">(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  created_at: timestamp("created_at").notNull().defaultNow(),
})

// User activity table
export const userActivityTable = pgTable("user_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  user: text("user").notNull(),
  marketId: uuid("market_id")
    .references(() => marketsTable.id)
    .notNull(),
  tokenId: text("token_id").notNull(),
  activityType: text("activity_type")
    .notNull()
    .$type<keyof typeof ActivityType>(),
  shares: text("shares").notNull(),
  amount: text("amount").notNull(),
  pricePerShare: text("price_per_share"),
  outcomeValue: boolean("outcome_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  transactionHash: text("transaction_hash"),
})

export const marketRelations = relations(marketsTable, ({ many, one }) => ({
  conditions: many(marketConditionsTable),
  orders: many(ordersTable),
  userPositions: many(userPositionsTable),
  parent: one(marketsTable, {
    fields: [marketsTable.parentMarketId],
    references: [marketsTable.id],
  }),
  children: many(marketsTable, {
    relationName: "parent_child",
  }),
}))

export const userSearchHistoryTable = pgTable("user_search_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userAddress: text("user_address").notNull(),
  searchQuery: text("search_query").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const marketConditionsRelations = relations(
  marketConditionsTable,
  ({ one }) => ({
    market: one(marketsTable, {
      fields: [marketConditionsTable.marketId],
      references: [marketsTable.id],
    }),
  })
)

export const orderRelations = relations(ordersTable, ({ one }) => ({
  market: one(marketsTable, {
    fields: [ordersTable.marketId],
    references: [marketsTable.id],
  }),
}))

export const matchOpportunityRelations = relations(
  matchOpportunitiesTable,
  ({ one }) => ({
    takerOrder: one(ordersTable, {
      fields: [matchOpportunitiesTable.takerOrderHash],
      references: [ordersTable.orderHash],
    }),
  })
)

export const priceHistoryRelations = relations(
  priceHistoryTable,
  ({ one }) => ({
    market: one(marketsTable, {
      fields: [priceHistoryTable.marketId],
      references: [marketsTable.id],
    }),
  })
)

export const userPositionRelations = relations(
  userPositionsTable,
  ({ one }) => ({
    market: one(marketsTable, {
      fields: [userPositionsTable.marketId],
      references: [marketsTable.id],
    }),
  })
)

export type Market = typeof marketsTable.$inferSelect
export type MarketCondition = typeof marketConditionsTable.$inferSelect
export type Order = typeof ordersTable.$inferSelect
export type Transaction = typeof transactionsTable.$inferSelect
export type MatchOpportunity = typeof matchOpportunitiesTable.$inferSelect
export type PriceHistory = typeof priceHistoryTable.$inferInsert
export type UserSearchHistory = typeof userSearchHistoryTable.$inferSelect
