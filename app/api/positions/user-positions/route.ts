import { db } from "@/lib/db/client"
import { userPositionsTable } from "@/lib/db/schema"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import {
  getMarketOrderbookData,
  MarketOrderbookData,
} from "@/lib/order/orderbook"

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const positions = await db
      .select()
      .from(userPositionsTable)
      .where(
        and(
          eq(userPositionsTable.userAddress, user.proxyWallet!),
          eq(userPositionsTable.status, "open")
        )
      )

    const marketCache = new Map<
      string,
      MarketOrderbookData["bestPrices"] & { yesTokenId: string | null }
    >()
    let totalValue = 0

    const formatted = await Promise.all(
      positions.map(async (pos) => {
        let prices = marketCache.get(pos.marketId)
        if (!prices) {
          const { bestPrices, yesTokenId } = await getMarketOrderbookData(
            pos.marketId
          )
          prices = { ...bestPrices, yesTokenId }
          marketCache.set(pos.marketId, prices)
        }

        const tokenIsYes = pos.tokenId === prices?.yesTokenId
        const price = tokenIsYes ? prices.yesBestBid : prices.noBestBid
        const value = (parseFloat(pos.balance) / 1e6) * (price ?? 0.5)
        totalValue += value

        return {
          marketId: pos.marketId,
          tokenId: pos.tokenId,
          conditionId: pos.conditionId,
          balance: parseFloat(pos.balance) / 1e6,
          price,
          value,
        }
      })
    )

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
