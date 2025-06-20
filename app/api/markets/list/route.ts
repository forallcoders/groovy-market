import { parseMarkets } from "@/app/markets/utils/parserMarkets"
import { getLeagues } from "@/lib/leagues/get-leagues"
import { getMarkets } from "@/lib/market/get-markets"
import { getMarketOrderbookData } from "@/lib/order/orderbook"
import { NextResponse } from "next/server"
import { slugify } from "@/utils/slugify"
import { parseGames } from "@/app/markets/utils/parserGames"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const league = searchParams.get("league")
  const type = searchParams.get("type")
  const sort = searchParams.get("sort")
  const order = searchParams.get("order") || "desc"

  try {
    const markets = await getMarkets(undefined, league || undefined)

    if (!markets || markets.length === 0) {
      return NextResponse.json({ items: [], logo: null })
    }

    let filteredMarkets = markets
    if (type === "crypto") {
      filteredMarkets = markets.filter(
        (m: any) =>
          m.conditionType === "crypto" ||
          (m.children &&
            m.children.some((child: any) => child.conditionType === "crypto"))
      )
    } else if (type === "sports") {
      filteredMarkets = markets.filter(
        (m: any) =>
          m.conditionType === "sports" ||
          (m.children &&
            m.children.some((child: any) => child.conditionType === "sports"))
      )
    }

    const processedMarkets = await Promise.all(
      filteredMarkets.map(async (market: any) => {
        if (market.children && market.children.length > 0) {
          market.children = await Promise.all(
            market.children.map(async (child: any) => ({
              ...child,
              bestPrices: (await getMarketOrderbookData(child.id)).bestPrices,
            }))
          )
        } else if (!market.bestPrices) {
          market.bestPrices = (
            await getMarketOrderbookData(market.id)
          ).bestPrices
        }
        return market
      })
    )

    const mixedItems = processedMarkets.map((market: any) => {
      if (
        market.conditionType === "sports" ||
        (market.children &&
          market.children.some(
            (child: any) => child.conditionType === "sports"
          ))
      ) {
        return { ...parseGames(market), _marketType: "sports" }
      } else {
        return { ...parseMarkets(market), _marketType: "crypto" }
      }
    })

    if (sort) {
      const sortByDate = (a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return order === "desc" ? dateB - dateA : dateA - dateB
      }

      const sortByVolume = (a: any, b: any) => {
        const getVolume = (vol: string) => {
          if (!vol) return 0
          return parseFloat(vol.replace("$", "").replace(/,/g, "")) || 0
        }
        const volA = getVolume(a.volume || "0")
        const volB = getVolume(b.volume || "0")
        return order === "desc" ? volB - volA : volA - volB
      }

      if (sort === "date") {
        mixedItems.sort(sortByDate)
      } else if (sort === "volume") {
        mixedItems.sort(sortByVolume)
      }
    }

    let logoUrl = null
    if (league) {
      const leagues = await getLeagues()
      const leagueFound = leagues.find((l) => slugify(l.name) === league)
      if (leagueFound) {
        logoUrl = leagueFound.logo
      }
    }

    if (type === "crypto" && !sort) {
      return NextResponse.json(
        mixedItems.filter((item) => item._marketType === "crypto")
      )
    } else if (league && !sort) {
      const sportsItems = mixedItems.filter(
        (item) => item._marketType === "sports"
      )
      return NextResponse.json({
        games: sportsItems,
        logo: logoUrl,
      })
    }

    return NextResponse.json({
      items: mixedItems,
      logo: logoUrl,
    })
  } catch (err) {
    console.error("Error fetching markets data:", err)
    return NextResponse.json(
      { error: "Failed to fetch markets data" },
      { status: 500 }
    )
  }
}
