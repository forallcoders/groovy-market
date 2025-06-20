import { NextRequest, NextResponse } from "next/server"
import { eq, and, inArray } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { marketConditionsTable, marketsTable } from "@/lib/db/schema"

function verifyApiKey(apiKey: string | null): boolean {
  const validApiKey = process.env.WEBHOOK_API_KEY
  return apiKey === validApiKey
}

export async function POST(req: NextRequest) {
  // Verify API key for security
  const apiKey = req.headers.get("x-api-key")
  if (!verifyApiKey(apiKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { sport_api_type, game_id, status, outcome_data } = data
    console.log({
      sport_api_type,
      game_id,
      status,
      outcome_data,
    })

    // Find market conditions associated with this game
    const marketConditions = await db
      .select()
      .from(marketConditionsTable)
      .where(
        and(
          eq(marketConditionsTable.type, "sports"),
          eq(marketConditionsTable.apiId, game_id.toString())
        )
      )

    console.log({ marketConditions })

    if (marketConditions.length === 0) {
      return NextResponse.json(
        { message: "No markets found for this game" },
        { status: 404 }
      )
    }

    const updatedMarkets = []
    const affectedMarketIds = []
    const parentMarketIds: any = new Set()

    // For each affected market condition, update the data
    for (const condition of marketConditions) {
      // Update the market condition data to include outcome information
      await db
        .update(marketConditionsTable)
        .set({
          data: {
            ...(condition.data ?? {}), // Keep existing data
            outcome: outcome_data, // Add the outcome data
            finalStatus: status,
            closedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(marketConditionsTable.id, condition.id))

      // Add market to affected list
      affectedMarketIds.push(condition.marketId)
    }

    // Get all affected markets in a single query
    const markets = await db
      .select()
      .from(marketsTable)
      .where(inArray(marketsTable.id, affectedMarketIds))

    // Create a map of market info and collect parent market IDs
    const marketMap = new Map()
    for (const market of markets) {
      marketMap.set(market.id, market)

      // If this is a child market (has parentMarketId), add parent to set
      if (market.parentMarketId) {
        parentMarketIds.add(market.parentMarketId)
      }
    }

    // When game is finished, close all affected markets
    if (status === "finished") {
      // Get all parent markets in a single query if there are any
      if (parentMarketIds.size > 0) {
        const parentMarkets = await db
          .select()
          .from(marketsTable)
          .where(inArray(marketsTable.id, [...parentMarketIds]))

        // Add parent markets to the map
        for (const parent of parentMarkets) {
          marketMap.set(parent.id, parent)
        }
      }

      // Close all markets (both direct and parent markets)
      const marketsToClose = [...affectedMarketIds, ...parentMarketIds]

      if (marketsToClose.length > 0) {
        // Update all markets in batch
        await db
          .update(marketsTable)
          .set({
            status: "closed",
            updatedAt: new Date(),
          })
          .where(
            and(
              inArray(marketsTable.id, marketsToClose),
              eq(marketsTable.status, "created")
            )
          )

        // Log all updated market IDs
        for (const marketId of marketsToClose) {
          const market = marketMap.get(marketId)
          if (market && market.status === "created") {
            updatedMarkets.push(marketId)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Closed markets for ${sport_api_type} game ${game_id}`,
      updatedMarkets,
    })
  } catch (error) {
    console.error("Error updating markets:", error)
    return NextResponse.json(
      { error: "Failed to update markets" },
      { status: 500 }
    )
  }
}
