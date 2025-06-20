import { formatDate } from "@/utils/dates"
import { getOdds } from "./parser"

function sortMarkets(markets: any[]) {
  return markets.sort((a: any, b: any) => {
    const aData: any = a.data || {}
    const bData: any = b.data || {}

    const isSortable =
      a.conditionType === "crypto" && b.conditionType === "crypto"
    if (!isSortable) return 0

    const aIsLower = aData.condition === "lower-than"
    const bIsLower = bData.condition === "lower-than"
    if (aIsLower && !bIsLower) return 1
    if (!aIsLower && bIsLower) return -1

    const aVal = parseFloat(
      aData.price ?? aData.marketCap ?? aData["market-cap"] ?? "-1"
    )
    const bVal = parseFloat(
      bData.price ?? bData.marketCap ?? bData["market-cap"] ?? "-1"
    )
    if (aVal === bVal) {
      const aMax = parseFloat(
        aData.priceMax ?? aData.marketCapMax ?? aData["market-cap-max"] ?? "-1"
      )
      const bMax = parseFloat(
        bData.priceMax ?? bData.marketCapMax ?? bData["market-cap-max"] ?? "-1"
      )
      return bMax - aMax
    }

    return bVal - aVal
  })
}

function getTotalVolume(children: any[]) {
  return children.reduce(
    (sum: number, leg: any) => sum + Number(leg.volume ?? 0),
    0
  )
}

function getVolumePercentage(legVolume: number, totalVolume: number) {
  if (totalVolume === 0) return "0%"
  return `${((legVolume / totalVolume) * 100).toFixed(2)}%`
}

// ---------- Main Function ----------
export const parseMarkets = (m: any): any => {
  const isGrouped = m.type === "grouped"
  const base = {
    grouped: isGrouped,
    apiId: m.apiId,
    id: m.id,
    title: m.title,
    image: m.image,
    status: m.status,
    ...(m.creator && { creator: m.creator }),
    createdAt: m.createdAt,
    orderbook: m.orderbook || null,
    bestPrices: m.bestPrices,
    time: formatDate({ dateString: m.predictionDate }),
    conditionId: m.conditionId,
    yesTokenId: m.yesTokenId,
    noTokenId: m.noTokenId,
  }

  const relatedMarkets = sortMarkets(m.relatedMarkets ?? []).map((rm: any) => ({
    ...rm,
    odds: getOdds(rm.bestPrices),
  }))

  if (m.children && m.children.length > 0) {
    const totalVolume = getTotalVolume(m.children)
    const markets = sortMarkets(m.children).map((leg: any) => ({
      ...parseMarkets(leg),
      data: leg.data,
      conditionId: leg.conditionId,
      yesTokenId: leg.yesTokenId,
      noTokenId: leg.noTokenId,
      orderbook: leg.orderbook || null,
      bestPrices: leg.bestPrices,
      createdAt: m.createdAt,
      volumePercentage: getVolumePercentage(
        Number(leg.volume ?? 0),
        totalVolume
      ),
    }))

    return {
      ...base,
      date: m.predictionDate,
      volume: `$${totalVolume.toFixed(2)}`,
      relatedMarkets,
      markets,
    }
  }

  return {
    ...base,
    volume: m.volume ? `$${Number(m.volume).toFixed(2)}` : "0",
    relatedMarkets,
    markets: [
      {
        id: m.id,
        title: m.title,
        variantKey: m.variantKey,
        image: m.image,
        data: m.data,
        ...(m.creator && { creator: m.creator }),
        odds: getOdds(m.bestPrices),
        conditionId: m.conditionId,
        yesTokenId: m.yesTokenId,
        noTokenId: m.noTokenId,
        volumePercentage: m.volumePercentage,
        time: formatDate({ dateString: m.predictionDate }),
        orderbook: m.orderbook || null,
        bestPrices: {
          yesBestBid: m.bestPrices?.yesBestBid ?? 0.5,
          yesBestAsk: m.bestPrices?.yesBestAsk ?? 0.5,
          noBestBid: m.bestPrices?.noBestBid ?? 0.5,
          noBestAsk: m.bestPrices?.noBestAsk ?? 0.5,
        },
        createdAt: m.createdAt,
      },
    ],
  }
}
