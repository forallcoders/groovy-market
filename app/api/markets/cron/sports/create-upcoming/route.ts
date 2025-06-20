import { MATCHES_BASE_URL } from "@/lib/config"
import { db } from "@/lib/db/client"
import { marketsTable, marketConditionsTable } from "@/lib/db/schema"
import { slugify } from "@/utils/slugify"
import axios from "axios"
import { NextResponse } from "next/server"
import { format, addDays } from "date-fns"

type League = {
  id: string
  sport_api_type: string
  sport_api_league_id: number
  name: string
  type: "league" | "cup"
  logo: string
  sport_api_country_id: number
  season: string
  start_at: string
  end_at: string
}

type Sport = {
  id: string
  name: string
  short_name: string
}

type LeagueResponse = {
  current_page: number
  size: number
  total_data: number
  total_page: number
  items: League[]
}

type Game = {
  id: string
  away_team_id: number
  away_team_logo: string
  away_team_name: string
  event_date: string
  home_team_id: number
  home_team_logo: string
  home_team_name: string
  stage: string | null
  status: string
  venue: string
  week: string | null
}

type GameResponse = {
  current_page: number
  items: Game[]
  size: number
  total_data: number
  total_page: number
  league: LeagueWithSport
}

type LeagueWithSport = League & { sport_type: string }

type Prediction = {
  id: string
  value: string
  venue: string
  metric: "winner"
  status: "scheduled"
  condition: "equal"
  away_score: number
  home_score: number
  created_at: string
  updated_at: string
  league_name: string
  away_team_id: number
  home_team_id: number
  away_team_logo: string
  away_team_name: string
  home_team_logo: string
  home_team_name: string
  predictionDate: string
  scheduled_time: string
  league_abbreviation: string
  away_team_short_name: string
  home_team_short_name: string
  drawAllowed: boolean
}

const sportsWithoutDraw = new Set(["basketball", "mma", "baseball"])

export async function GET() {
  const { data: sportsData } = await axios.get<{ items: Sport[] }>(
    `${MATCHES_BASE_URL}/api/sports`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MATCHES_SECRET_TOKEN}`,
      },
    }
  )

  const sportsWithLeagues = await Promise.all(
    sportsData.items.map(async (sport: Sport) => {
      const { data: leagues } = await axios.get<LeagueResponse>(
        `${MATCHES_BASE_URL}/api/leagues?sport_type=${sport.short_name}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MATCHES_SECRET_TOKEN}`,
          },
        }
      )

      const leaguesWithSportType: LeagueWithSport[] = leagues.items.map(
        (league) => ({
          ...league,
          sport_type: sport.short_name,
        })
      )

      return leaguesWithSportType
    })
  )

  const allLeagues: LeagueWithSport[] = sportsWithLeagues.flat()
  const today = format(new Date(), "yyyy-MM-dd")
  const endDate = format(addDays(new Date(), 1), "yyyy-MM-dd")

  const games = await Promise.all(
    allLeagues.map(async (league) => {
      const baseUrl = `${MATCHES_BASE_URL}/api/games?status=not_started&sport_type=${league.sport_type}&start_date=${today}&end_date=${endDate}`
      const url =
        league.sport_type === "mma"
          ? baseUrl
          : `${baseUrl}&league_id=${league.sport_api_league_id}`

      const { data } = await axios.get<GameResponse>(url, {
        headers: {
          Authorization: `Bearer ${process.env.MATCHES_SECRET_TOKEN}`,
        },
      })

      return { ...data, league }
    })
  )

  const pendingGamesWithLeague = games.flatMap((gameResponse) =>
    gameResponse.items.map((game) => ({
      ...game,
      league: gameResponse.league,
    }))
  )
  const existingApiIdsResult = await db
    .select({ apiId: marketConditionsTable.apiId })
    .from(marketConditionsTable)

  const existingApiIds = new Set(existingApiIdsResult.map((r) => r.apiId))

  const predictions: Prediction[] = pendingGamesWithLeague.map((game) => {
    const league = game.league
    const sportType = league.sport_type
    const drawAllowed = !sportsWithoutDraw.has(sportType)

    return {
      id: game.id,
      away_team_id: game.away_team_id,
      away_team_logo: game.away_team_logo,
      away_team_name: game.away_team_name,
      home_team_id: game.home_team_id,
      home_team_logo: game.home_team_logo,
      home_team_name: game.home_team_name,
      league_name: league.name,
      league_abbreviation: slugify(league.name),
      metric: "winner",
      status: "scheduled",
      condition: "equal",
      venue: game.venue,
      away_score: 0,
      home_score: 0,
      created_at: game.event_date,
      updated_at: game.event_date,
      predictionDate: game.event_date,
      scheduled_time: game.event_date,
      away_team_short_name: game.away_team_name,
      home_team_short_name: game.home_team_name,
      value: "home",
      drawAllowed,
    }
  })

  const newPredictions = predictions.filter(
    (prediction) => !existingApiIds.has(prediction.id)
  )

  const markets = newPredictions.map(async (prediction) => {
    if (prediction.drawAllowed) {
      const [parentMarket] = await db
        .insert(marketsTable)
        .values({
          title: `${prediction.home_team_name} vs ${prediction.away_team_name}`,
          description: `Who will win the match between ${prediction.home_team_name} and ${prediction.away_team_name}?`,
          image: prediction.home_team_logo,
          type: "grouped",
        })
        .returning()

      const [homeMarket] = await db
        .insert(marketsTable)
        .values({
          title: `Will ${prediction.home_team_name} win?`,
          description: `Will ${prediction.home_team_name} win?`,
          image: prediction.home_team_logo,
          parentMarketId: parentMarket.id,
        })
        .returning()

      const [awayMarket] = await db
        .insert(marketsTable)
        .values({
          title: `Will ${prediction.away_team_name} win?`,
          description: `Will ${prediction.away_team_name} win?`,
          image: prediction.away_team_logo,
          parentMarketId: parentMarket.id,
        })
        .returning()

      const [drawMarket] = await db
        .insert(marketsTable)
        .values({
          title: `Will it be a draw?`,
          description: `Will the match end in a draw?`,
          image: prediction.home_team_logo,
          parentMarketId: parentMarket.id,
        })
        .returning()

      const allMarkets = [homeMarket, awayMarket, drawMarket]

      const marketConditions = allMarkets.map((market, index) => {
        const variantKey = index === 0 ? "home" : index === 1 ? "away" : "draw"
        return db.insert(marketConditionsTable).values({
          data: { ...prediction, value: variantKey },
          marketId: market.id,
          type: "sports",
          variantKey,
          predictionDate: prediction.predictionDate,
          apiId: prediction.id,
          asset: prediction.id,
          metric: "winner",
          metricCondition: "equal",
          leagueAbbreviation: prediction.league_abbreviation,
        })
      })

      await Promise.all(marketConditions)
    } else {
      const [market] = await db
        .insert(marketsTable)
        .values({
          title: `${prediction.home_team_name} vs ${prediction.away_team_name}`,
          description: `Who will win: ${prediction.home_team_name} or ${prediction.away_team_name}?`,
          image: prediction.home_team_logo,
          type: "single",
        })
        .returning()

      await db.insert(marketConditionsTable).values({
        data: { ...prediction, value: "winner" },
        marketId: market.id,
        type: "sports",
        variantKey: "winner",
        predictionDate: prediction.predictionDate,
        apiId: prediction.id,
        asset: prediction.id,
        metric: "winner",
        metricCondition: "equal",
        leagueAbbreviation: prediction.league_abbreviation,
      })
    }
  })

  await Promise.all(markets)

  return NextResponse.json({ success: true })
}
