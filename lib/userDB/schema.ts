import { relations, sql, SQL } from "drizzle-orm"
import { uniqueIndex } from "drizzle-orm/mysql-core"
import {
  AnyPgColumn,
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

export const usersTable = pgTable(
  "users_table",
  {
    id: serial("id").primaryKey(),
    paraId: text("para_id").unique(),
    dynamicId: text("dynamic_id").unique(),
    username: text("username").unique(),
    referrerId: integer("referrer_id"),
    hasPlacedABracket: boolean("has_placed_a_bracket").notNull().default(false),
    hasAcceptedTerms: boolean("has_accepted_terms").notNull().default(false),
    address: text("address").unique(),
    evmAddress: text("evm_address").notNull().unique(),
    proxyWallet: text("proxy_wallet").unique(),
    email: text("email").unique(),
    avatar: text("avatar"),
    bio: text("bio"),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    referralCode: text("referral_code").unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    emailUniqueIndex: uniqueIndex("emailUniqueIndex").on(lower(table.email)),
    usernameUniqueIndex: uniqueIndex("usernameUniqueIndex").on(
      lower(table.username)
    ),
  })
)

export const pregenWalletsTable = pgTable(
  "pregen_wallets",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    walletId: text("wallet_id").notNull(),
    userShare: text("user_share").notNull(),
    address: text("address"),
    addressSecondary: text("address_secondary"),
    type: text("type").notNull(),
    claimed: boolean("claimed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueUserIdType: unique().on(table.userId, table.type),
  })
)

export const bracketReferralsTable = pgTable(
  "bracket_referrals",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    // The user who placed the bracket
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // The contract address that placed the bracket
    contractAddress: text("contract_address"),
    // The referrer's user ID
    referrerId: integer("referrer_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    // Track if rewards have been claimed
    rewardsClaimed: boolean("rewards_claimed").default(false),
    // Amount of rewards (if applicable)
    rewardsAmount: text("rewards_amount"),
    // Additional metadata can be stored as JSON
    metadata: text("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.userId, table.referrerId)]
)

export const commentsTable = pgTable("comments", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  marketId: text("market_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// Define relationships
export const bracketReferralsRelations = relations(
  bracketReferralsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [bracketReferralsTable.userId],
      references: [usersTable.id],
    }),
    referrer: one(usersTable, {
      fields: [bracketReferralsTable.referrerId],
      references: [usersTable.id],
    }),
  })
)

// Type inference
export type BracketReferral = typeof bracketReferralsTable.$inferSelect

export const usersRelations = relations(usersTable, ({ one }) => ({
  referrer: one(usersTable, {
    fields: [usersTable.referrerId],
    references: [usersTable.id],
  }),
}))

export type User = typeof usersTable.$inferSelect

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`
}
