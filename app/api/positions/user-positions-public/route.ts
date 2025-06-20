import { db } from "@/lib/db/client"
import {
  marketConditionsTable,
  marketsTable,
  userPositionsTable,
} from "@/lib/db/schema"
import {
  getMarketOrderbookData,
  MarketOrderbookData,
} from "@/lib/order/orderbook"
import { and, eq, or } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { NextRequest, NextResponse } from "next/server"

export type Position = {
  market: {
    description: string
    image: string
    url: string
  }
  positionDetails: {
    value: boolean
    price: number
    shares: number
  }
  latest: number
  position: number
  current: {
    value: number
    percentage: number
  }
  toGet: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user = searchParams.get("user")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const parentMarketAlias = alias(marketsTable, "parentMarket")
    const positions = await db
      .select()
      .from(userPositionsTable)
      .rightJoin(
        marketsTable,
        or(
          eq(userPositionsTable.tokenId, marketsTable.yesTokenId),
          eq(userPositionsTable.tokenId, marketsTable.noTokenId)
        )
      )
      .leftJoin(
        marketConditionsTable,
        eq(marketsTable.id, marketConditionsTable.marketId)
      )
      .where(
        and(
          eq(userPositionsTable.userAddress, user),
          eq(userPositionsTable.status, "open")
        )
      );

    const markets = positions.map((pos) => pos.markets)

    const conditions = positions.map((pos) => pos.market_conditions)
    const marketCache = new Map<
      string,
      MarketOrderbookData["bestPrices"] & { yesTokenId: string | null }
    >()
    let totalValue = 0

    const rawPositions = await Promise.all(
      positions.map(async (pos) => {
        let prices = marketCache.get(pos.user_positions?.marketId || "")
        if (!prices) {
          const { bestPrices, yesTokenId } = await getMarketOrderbookData(
            pos.user_positions?.marketId || ""
          )
          prices = { ...bestPrices, yesTokenId }
          marketCache.set(pos.user_positions?.marketId || "", prices)
        }

        const tokenIsYes = pos.user_positions?.tokenId === prices?.yesTokenId
        const price = tokenIsYes ? prices.yesBestBid : prices.noBestBid
        const value = price
          ? (parseFloat(pos.user_positions?.balance || "0") / 1e6) * price
          : 0
        totalValue += value

        return {
          marketId: pos.user_positions?.marketId || "",
          tokenId: pos.user_positions?.tokenId || "",
          tokenIsYes,
          conditionId: pos.user_positions?.conditionId || "",
          balance: parseFloat(pos.user_positions?.balance || "0") / 1e6,
          price,
          value,
        }
      })
    )

    const formatted: Position[] = rawPositions.map((pos) => {
      const market = markets.find((m) => m.id === pos.marketId)
      console.log({ market })
      const condition: any = conditions.find(
        (c) => c?.marketId === pos.marketId
      )
      const description = market?.title
      
      const marketId = market?.parentMarketId || market?.id
      const image = market?.image ||( condition?.type === "sports" ? condition.data?.home_team_logo : market?.image || "")
      return {
        market: {
          description: description || "",
          image,
          url: condition?.type === "sports" ? `/markets/sports/${condition.leagueAbbreviation}/${marketId}/details` : `/markets/crypto/${marketId}/details`
        },
        positionDetails: {
          value: pos.tokenIsYes,
          price: pos.price || 0.5,
          shares: pos.balance,
        },
        current: {
          value: pos.balance * (pos.price ? pos.price : 0.5),
          percentage: 0,
        },
        position: pos.balance * (pos.price ? pos.price : 0.5),
        latest: pos.price || 0.5,
        toGet: pos.balance,
      }
    })

    return NextResponse.json({
      totalValue,
      positions: formatted,
    })
  } catch (error) {
    console.error("[Portfolio] Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
