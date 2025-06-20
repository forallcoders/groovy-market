import { NextResponse } from "next/server"
import { getMarketOrderbookData } from "@/lib/order/orderbook"
import { parseGames } from "@/app/markets/utils/parserGames"
import { groupMarketsByDate } from "@/utils/market"
import { getAllSportsMarketsSortedByDate } from "@/lib/market/get-all-sport-markets"

export async function GET() {
  try {
    const sportsMarkets = await getAllSportsMarketsSortedByDate()
    const enrichedMarkets = await Promise.all(
      sportsMarkets.map(async (market: any) => {
        const orderbookData = await getMarketOrderbookData(market.id)
        return parseGames({
          ...market,
          bestPrices: orderbookData.bestPrices,
          orderbook: orderbookData.orderbook,
        })
      })
    )

    const grouped = groupMarketsByDate(enrichedMarkets)

    return NextResponse.json({ groups: grouped })
  } catch (err) {
    console.error("Failed to fetch grouped sports markets:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
