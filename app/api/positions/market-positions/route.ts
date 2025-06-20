import { db } from "@/lib/db/client"
import { userPositionsTable, marketsTable } from "@/lib/db/schema"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { getMarketOrderbookData } from "@/lib/order/orderbook"

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const marketId = searchParams.get("marketId")

    if (!marketId) {
      return NextResponse.json(
        { error: "Market ID is required" },
        { status: 400 }
      )
    }

    const parentMarket = await db.query.marketsTable.findFirst({
      where: eq(marketsTable.id, marketId),
    })

    const isGrouped = parentMarket?.type === "grouped"

    const marketIdsToQuery = isGrouped
      ? (
          await db.query.marketsTable.findMany({
            where: eq(marketsTable.parentMarketId, marketId),
          })
        ).map((m) => m.id)
      : [marketId]

    const allPositions = await db
      .select()
      .from(userPositionsTable)
      .where(
        and(
          eq(userPositionsTable.userAddress, user.proxyWallet!),
          eq(userPositionsTable.status, "open")
        )
      )

    const filteredPositions = allPositions.filter((p) =>
      marketIdsToQuery.includes(p.marketId)
    )

    const bestPricesByMarket: Record<
      string,
      Awaited<ReturnType<typeof getMarketOrderbookData>>
    > = {}
    for (const id of marketIdsToQuery) {
      bestPricesByMarket[id] = await getMarketOrderbookData(id)
    }

    const formatted = filteredPositions.map((pos) => {
      const bestPrices = bestPricesByMarket[pos.marketId].bestPrices
      const yesTokenId = bestPricesByMarket[pos.marketId].yesTokenId
      const isYesToken = pos.tokenId === yesTokenId
      const price = isYesToken ? bestPrices.yesBestBid : bestPrices.noBestBid
      const value = price ? (parseFloat(pos.balance) / 1e6) * price : 0

      return {
        marketId: pos.marketId,
        tokenId: pos.tokenId,
        conditionId: pos.conditionId,
        balance: parseFloat(pos.balance) / 1e6,
        isYesToken,
        price,
        value,
        entryPrice: parseFloat(pos.entryPrice),
        status: pos.status,
      }
    })

    if (isGrouped) {
      const positionsByMarket = formatted.reduce((acc: any, pos) => {
        if (!acc[pos.marketId]) acc[pos.marketId] = []
        acc[pos.marketId].push(pos)
        return acc
      }, {})

      return NextResponse.json({ positions: positionsByMarket })
    } else {
      return NextResponse.json({ positions: formatted })
    }
  } catch (error) {
    console.error("[MarketPositions] Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
