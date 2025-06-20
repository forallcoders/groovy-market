import { and, eq, inArray, isNull } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { marketsTable as m, marketConditionsTable as mc } from "@/lib/db/schema"
import { getMarketOrderbookData } from "../order/orderbook"

export async function getAllSportsMarketsSortedByDate() {
  try {
    const groupedParents = await db
      .select({
        id: m.id,
        title: m.title,
        description: m.description,
        volume: m.volume,
        image: m.image,
        endDate: m.endDate,
        createdAt: m.createdAt,
        type: m.type,
      })
      .from(m)
      .where(
        and(
          inArray(m.status, ["created", "resolved"]),
          eq(m.type, "grouped"),
          isNull(m.parentMarketId)
        )
      )
      .limit(15)

    const enrichedGroupedMarkets = await Promise.all(
      groupedParents.map(async (parent) => {
        const children = await db
          .select({
            id: m.id,
            variantKey: mc.variantKey,
            rawPredictionDate: mc.predictionDate,
            leagueAbbreviation: mc.leagueAbbreviation,
            asset: mc.asset,
            metric: mc.metric,
            metricCondition: mc.metricCondition,
            conditionType: mc.type,
            data: mc.data,
          })
          .from(m)
          .innerJoin(mc, eq(mc.marketId, m.id))
          .where(eq(m.parentMarketId, parent.id))

        const home = children.find((c) => c.variantKey === "home")
        const away = children.find((c) => c.variantKey === "away")
        const draw = children.find((c) => c.variantKey === "draw")

        const [homePrices, awayPrices, drawPrices] = await Promise.all([
          home ? getMarketOrderbookData(home.id) : null,
          away ? getMarketOrderbookData(away.id) : null,
          draw ? getMarketOrderbookData(draw.id) : null,
        ])

        const bestPrices = {
          team1: homePrices?.bestPrices,
          team2: awayPrices?.bestPrices,
          ...(drawPrices ? { draw: drawPrices.bestPrices } : {}),
        }

        const odds = {
          team1: `${Math.round(
            (homePrices?.bestPrices?.yesBestAsk ?? 0.5) * 100
          )} ¢`,
          team2: `${Math.round(
            (awayPrices?.bestPrices?.yesBestAsk ?? 0.5) * 100
          )} ¢`,
          ...(drawPrices
            ? {
                draw: `${Math.round(
                  (drawPrices.bestPrices?.yesBestAsk ?? 0.5) * 100
                )} ¢`,
              }
            : {}),
        }

        const predictionDate =
          (home?.data as any)?.predictionDate ??
          (away?.data as any)?.predictionDate ??
          (draw?.data as any)?.predictionDate ??
          home?.rawPredictionDate ??
          away?.rawPredictionDate ??
          draw?.rawPredictionDate

        return {
          ...parent,
          predictionDate,
          leagueAbbreviation: home?.leagueAbbreviation,
          asset: home?.asset,
          metric: home?.metric,
          metricCondition: home?.metricCondition,
          conditionType: home?.conditionType,
          bestPrices,
          odds,
          data: home?.data,
        }
      })
    )

    return enrichedGroupedMarkets
      .filter((market) => market.conditionType === "sports")
      .sort(
        (a, b) =>
          new Date(a.predictionDate as string).getTime() -
          new Date(b.predictionDate as string).getTime()
      )
  } catch (err) {
    console.error("Failed to fetch sorted sports markets:", err)
    throw err
  }
}
