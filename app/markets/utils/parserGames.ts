import { formatDate } from "@/utils/dates"
import { getOdds } from "./parser"

function getGameOdds(drawLeg: any, homeLeg: any, awayLeg: any, fallback?: any) {
  if (fallback?.odds) return fallback.odds
  return {
    team1: homeLeg?.bestPrices
      ? `${(homeLeg.bestPrices.yesBestAsk ?? 0.5) * 100} ¢`
      : "50 ¢",
    ...(drawLeg?.bestPrices && {
      draw: `${(drawLeg.bestPrices.yesBestAsk ?? 0.5) * 100} ¢`,
    }),
    team2: awayLeg?.bestPrices
      ? `${(awayLeg.bestPrices.yesBestAsk ?? 0.5) * 100} ¢`
      : "50 ¢",
  }
}

function getTeamData(leg: any, type: "home" | "away") {
  return {
    name: leg?.data?.[`${type}_team_name`],
    shortName: leg?.data?.[`${type}_team_short_name`],
    logo: leg?.data?.[`${type}_team_logo`],
    record: leg?.data?.[`${type}_score`],
  }
}

function getDrawObject(drawLeg: any) {
  if (!drawLeg) return undefined
  const short1 = drawLeg?.data?.home_team_short_name
  const short2 = drawLeg?.data?.away_team_short_name
  return {
    name: `Draw (${short1} vs ${short2})`,
    shortName: `DRAW (${short1} vs ${short2})`,
    logo: "/icons/circle-pause.svg",
  }
}

function getRelatedMarkets(relatedMarkets?: any[]) {
  return (
    relatedMarkets?.map((rm: any) => ({
      ...rm,
      image:
        rm.image ||
        rm.data?.home_team_logo ||
        rm.data?.away_team_logo ||
        "/images/default-team.png",
      odds: getOdds(rm.bestPrices),
    })) ?? []
  )
}

export const parseGames = (g: any): any => {
  const base = {
    grouped: g.type === "grouped",
    apiId: g.apiId,
    id: g.id,
    title: g.title,
    status: g.status,
    description: g.title,
    image: g.image,
    ...(g.creator && { creator: g.creator }),
    createdAt: g.createdAt,
    orderbook: g.orderbook || null,
    relatedMarkets: getRelatedMarkets(g.relatedMarkets),
    date: g.date,
    predictionDate: g.predictionDate,
    leagueAbbreviation: g?.leagueAbbreviation,
    yesTokenId: g.yesTokenId,
    noTokenId: g.noTokenId,
    conditionId: g.conditionId,
  }

  const getFullMarketObj = (legs: any[], marketType: string[]) =>
    marketType.reduce((acc: any, key) => {
      acc[key] = legs.find((l: any) => l.variantKey === key)
      return acc
    }, {})

  if (g.children?.length) {
    const { home, away, draw } = getFullMarketObj(g.children, [
      "home",
      "away",
      "draw",
    ])
    const totalVolume = g.children.reduce(
      (sum: any, l: any) => sum + Number(l.volume ?? 0),
      Number(g.volume ?? 0)
    )

    return {
      ...base,
      time: formatDate({ dateString: home?.data?.scheduled_time }),
      volume: `$${totalVolume.toFixed(2)}`,
      team1: getTeamData(home, "home"),
      team2: getTeamData(away ?? home, "away"),
      draw: getDrawObject(draw),
      odds: getGameOdds(draw, home, away, g),
      bestPrices: {
        team1: home?.bestPrices,
        ...(draw?.bestPrices && { draw: draw.bestPrices }),
        team2: away?.bestPrices,
      },
      homeMarketId: home?.id,
      drawMarketId: draw?.id,
      awayMarketId: away?.id,
      conditionId: g.conditionId,
      yesTokenId: g.yesTokenId,
      noTokenId: g.noTokenId,
      markets: g.children.map(parseGames),
    }
  }

  if (g.markets?.length) {
    const { home, away, draw } = getFullMarketObj(g.markets, [
      "home",
      "away",
      "draw",
    ])
    const totalVolume = g.markets.reduce(
      (sum: any, l: any) => sum + Number(l.volume ?? 0),
      Number(g.volume ?? 0)
    )

    return {
      ...base,
      time: formatDate({ dateString: home?.data?.scheduled_time }),
      volume: `$${totalVolume.toFixed(2)}`,
      team1: getTeamData(home, "home"),
      team2: getTeamData(away ?? home, "away"),
      draw: getDrawObject(draw),
      odds: getGameOdds(draw, home, away, g),
      bestPrices: {
        team1: home?.bestPrices,
        ...(draw?.bestPrices && { draw: draw.bestPrices }),
        team2: away?.bestPrices,
      },
      homeMarketId: home?.id,
      drawMarketId: draw?.id,
      awayMarketId: away?.id,
      conditionId: g.conditionId,
      yesTokenId: g.yesTokenId,
      noTokenId: g.noTokenId,
      markets: g.markets.map(parseGames),
    }
  }

  const isDraw = g.variantKey === "draw"
  const odds = g.odds
    ? g.odds
    : isDraw
    ? { draw: `${(g.bestPrices?.yesBestAsk ?? 0.5) * 100} ¢` }
    : {
        team1: `${(g.bestPrices?.yesBestAsk ?? 0.5) * 100} ¢`,
        team2: `${(g.bestPrices?.noBestAsk ?? 0.5) * 100} ¢`,
      }

  return {
    ...base,
    variantKey: g.variantKey,
    parentMarketId: g.parentMarketId,
    time: formatDate({
      dateString: g.data?.scheduled_time ?? g.data?.predictionDate,
    }),
    volume: g.volume ? `$${Number(g.volume).toFixed(2)}` : "0",
    data: g.data,
    team1: getTeamData(g, "home"),
    team2: getTeamData(g, "away"),
    draw: isDraw ? getDrawObject(g) : undefined,
    odds,
    bestPrices: {
      team1: g.bestPrices,
      ...(isDraw && { draw: g.bestPrices }),
      team2: g.bestPrices,
    },
    yesTokenId: g.yesTokenId,
    noTokenId: g.noTokenId,
    conditionId: g.conditionId,
    markets: [
      {
        ...base,
        id: g.id,
        time: formatDate({
          dateString: g.data?.scheduled_time ?? g.data?.predictionDate,
        }),
        variantKey: g.variantKey,
        parentMarketId: g.parentMarketId,
        data: g.data,
        volume: g.volume ? `$${Number(g.volume).toFixed(2)}` : "0",
        orderbook: g.orderbook || null,
        odds: getOdds(g.bestPrices),
        bestPrices: {
          yesBestBid: g.bestPrices?.yesBestBid ?? 0.5,
          yesBestAsk: g.bestPrices?.yesBestAsk ?? 0.5,
          noBestBid: g.bestPrices?.noBestBid ?? 0.5,
          noBestAsk: g.bestPrices?.noBestAsk ?? 0.5,
        },
      },
    ],
  }
}
