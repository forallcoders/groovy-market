import { db } from "@/lib/db/client"
import { marketsTable } from "@/lib/db/schema"
import { getMarketOrderbookData } from "@/lib/order/orderbook"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_: NextRequest, { params }: any) {
  try {
    const { id: marketId } = await params
    if (!marketId) {
      return NextResponse.json({ error: "Invalid market ID" }, { status: 400 })
    }

    const parentMarket = await db.query.marketsTable.findFirst({
      where: eq(marketsTable.id, marketId),
    })

    if (!parentMarket) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 })
    }

    const isGrouped = parentMarket.type === "grouped"

    const childMarkets = isGrouped
      ? await db.query.marketsTable.findMany({
          where: eq(marketsTable.parentMarketId, parentMarket.id),
        })
      : [parentMarket]

    const ordersByMarketId: Record<string, any> = {}

    for (const market of childMarkets) {
      const orderbookData = await getMarketOrderbookData(market.id)
      ordersByMarketId[market.id] = {
        yesAsks: orderbookData.orderbook?.yesAsks ?? [],
        noAsks: orderbookData.orderbook?.noAsks ?? [],
        yesBids: orderbookData.orderbook?.yesBids ?? [],
        noBids: orderbookData.orderbook?.noBids ?? [],
        bestPrices: orderbookData.bestPrices ?? {},
      }
    }

    return NextResponse.json({
      ordersByMarketId,
    })
  } catch (error) {
    console.error("Error fetching order book:", error)
    return NextResponse.json(
      { error: "Failed to fetch order book data" },
      { status: 500 }
    )
  }
}
