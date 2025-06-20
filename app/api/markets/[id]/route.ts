import { parseGames } from "@/app/markets/utils/parserGames"
import { parseMarkets } from "@/app/markets/utils/parserMarkets"
import { getLeagues } from "@/lib/leagues/get-leagues"
import { getMarkets } from "@/lib/market/get-markets"
import { getMarketOrderbookData } from "@/lib/order/orderbook"
import { slugify } from "@/utils/slugify"
import { NextResponse } from "next/server"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const league = searchParams.get("league")
  const type = searchParams.get("type")

  try {
    if (type === "crypto") {
      // Get all markets
      const allMarkets = await getMarkets(id!)

      // Filter for crypto markets - look at both parent and children
      const cryptoMarkets = allMarkets.filter((market) => {
        // Check if the parent itself is a crypto market
        if (market.conditionType === "crypto") return true

        // Check if any of the children are crypto markets
        if (
          market.children &&
          market.children.some((child: any) => child.conditionType === "crypto")
        ) {
          return true
        }

        return false
      })

      // Add orderbook data to all markets
      const withOrderbook = await Promise.all(
        cryptoMarkets.map(async (market) => {
          // Add orderbook data to parent market
          const marketWithOb = {
            ...market,
          }

          // If it has children, add orderbook data to them too
          if (market.children && market.children.length > 0) {
            marketWithOb.children = await Promise.all(
              market.children.map(async (child: any) => ({
                ...child,
                bestPrices: (await getMarketOrderbookData(child.id)).bestPrices,
              }))
            )
          }

          return marketWithOb
        })
      )

      // Format for response
      const formatted = withOrderbook.map(parseMarkets)
      return NextResponse.json(formatted)
    }

    if (league) {
      const leagues = await getLeagues()
      const leagueFound = leagues.find((l) => slugify(l.name) === league)

      if (!leagueFound) {
        return NextResponse.json({ error: "League not found" }, { status: 404 })
      }

      // Get all sports markets for this league
      const markets = await getMarkets(id!, slugify(leagueFound.name))

      // Add orderbook data to all markets
      const withOrderbook = await Promise.all(
        markets.map(async (market) => {
          // Add orderbook data to parent market
          const marketWithOb = {
            ...market,
          }

          // If it has children, add orderbook data to them too
          if (market.children && market.children.length > 0) {
            marketWithOb.children = await Promise.all(
              market.children.map(async (child: any) => ({
                ...child,
                bestPrices: (await getMarketOrderbookData(child.id)).bestPrices,
              }))
            )
          }

          return marketWithOb
        })
      )
      // Format for response
      const formatted = withOrderbook.map(parseGames)

      return NextResponse.json(formatted)
    }

    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    )
  } catch (err) {
    console.error("Error fetching markets data:", err)
    return NextResponse.json(
      { error: "Failed to fetch markets data" },
      { status: 500 }
    )
  }
}
