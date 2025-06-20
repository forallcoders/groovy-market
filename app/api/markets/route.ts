import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db/client"
import { marketConditionsTable, marketsTable } from "@/lib/db/schema"
import { getMarkets } from "@/lib/market/get-markets"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

/**
 * Create a new market with conditions
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const {
      title,
      description,
      marketConditions,
      image,
      isCombined = false,
    } = await req.json()

    if (!marketConditions || marketConditions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one market condition is required",
        },
        { status: 400 }
      )
    }

    const marketConditionsCount = marketConditions.length

    const result = await db.transaction(async (tx) => {
      // Create parent market
      const [parentMarket] = await tx
        .insert(marketsTable)
        .values({
          title,
          description,
          image,
          creatorAddress: user.proxyWallet!,
          type: isCombined
            ? "combined"
            : marketConditionsCount === 1
            ? "single"
            : "grouped",
        })
        .returning()
      const buildConditionInsert = (condition: any, marketId: string) => ({
        marketId,
        type: condition.type,
        apiId: condition.apiId,
        predictionDate: condition.predictionDate,
        variantKey: condition.variantKey,
        asset: condition.asset,
        metric: condition.metric,
        metricCondition: condition.metricCondition,
        leagueAbbreviation: condition.leagueAbbreviation,
        data: { ...condition.data },
      })
      // Handle single condition (no children)
      if (!isCombined && marketConditionsCount === 1) {
        await tx
          .insert(marketConditionsTable)
          .values(buildConditionInsert(marketConditions[0], parentMarket.id))

        return { parent: parentMarket, children: [] }
      }

      // Handle combined market (conditions attached to parent)
      if (isCombined) {
        await tx
          .insert(marketConditionsTable)
          .values(
            marketConditions.map((condition: any) =>
              buildConditionInsert(condition, parentMarket.id)
            )
          )
        return { parent: parentMarket, children: [] }
      }

      // Generate all child markets
      const childMarketsToInsert = marketConditions.map((condition: any) => ({
        title: generateChildTitle(condition, title),
        description,
        image,
        creatorAddress: user.proxyWallet!,
        parentMarketId: parentMarket.id,
      }))

      // Insert all child markets
      const insertedChildMarkets = await tx
        .insert(marketsTable)
        .values(childMarketsToInsert)
        .returning()

      // Attach conditions to children
      const conditionInserts = insertedChildMarkets.map((child, i) =>
        buildConditionInsert(marketConditions[i], child.id)
      )

      await tx.insert(marketConditionsTable).values(conditionInserts)

      return { parent: parentMarket, children: insertedChildMarkets }
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    console.error("Error creating market:", error)
    return NextResponse.json(
      { success: false, message: "Error creating market", error },
      { status: 500 }
    )
  }
}

/**
 * Generate an appropriate title for a child market based on its condition
 */
function generateChildTitle(condition: any, parentTitle: string): string {
  if (condition.type === "sports") {
    if (condition.data) {
      if (condition.variantKey === "home") {
        return `${condition.data.home_team_name} to win`
      } else if (condition.variantKey === "away") {
        return `${condition.data.away_team_name} to win`
      } else if (condition.variantKey === "draw") {
        return `${condition.data.home_team_name} vs ${condition.data.away_team_name} to Draw`
      } else if (condition.data.metric === "winner") {
        const team =
          condition.data.value === "home"
            ? condition.data.home_team_name
            : condition.data.away_team_name
        return `${team} to win`
      } else if (
        condition.data.metric &&
        condition.data.condition &&
        condition.data.value
      ) {
        return `${condition.data.metric} to be ${condition.data.condition} ${condition.data.value}`
      }
    }
  } else if (condition.type === "crypto") {
    if (condition.data) {
      const primary = condition.data.primaryCurrency?.toUpperCase() || ""
      const secondary = condition.data.secondaryCurrency?.toUpperCase() || ""
      const outcome = condition.data.outcome || ""
      const conditionStr = condition.data.condition || ""
      const price = condition.data.price || ""

      if (primary && secondary && outcome && conditionStr && price) {
        return `${primary} ${outcome} ${conditionStr} ${price} ${secondary}`
      }
    }
  }

  return `${parentTitle} - ${condition.variantKey || "Variant"}`
}

/**
 * Update the status of a market
 */
export async function PUT(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const { id, status, volume, conditionId, yesTokenId, noTokenId } =
      await req.json()

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          message: "Market ID and status are required",
        },
        { status: 400 }
      )
    }

    const body: any = {
      status,
      endDate: new Date(),
    }
    if (volume) {
      body.volume = parseFloat(volume).toString()
    }

    if (conditionId) {
      body.conditionId = conditionId
    }
    if (yesTokenId) {
      body.yesTokenId = yesTokenId
    }
    if (noTokenId) {
      body.noTokenId = noTokenId
    }

    // Get the current market before updating
    const currentMarket = await db
      .select()
      .from(marketsTable)
      .where(eq(marketsTable.id, id))
      .limit(1)
      .then((markets) => markets[0])

    if (!currentMarket) {
      return NextResponse.json(
        { success: false, message: "Market not found" },
        { status: 404 }
      )
    }

    // Update current market
    const [updatedMarket] = await db
      .update(marketsTable)
      .set(body)
      .where(eq(marketsTable.id, id))
      .returning()

    // Check if this market has a parent
    if (currentMarket.parentMarketId && status === "resolved") {
      // Find all sibling markets (markets with the same parent)
      const siblingMarkets = await db
        .select()
        .from(marketsTable)
        .where(eq(marketsTable.parentMarketId, currentMarket.parentMarketId))

      // Check if all sibling markets are resolved
      const allSiblingsResolved = siblingMarkets.every((market) =>
        market.id === id ? true : market.status === "resolved"
      )

      // If all siblings are resolved, update the parent market
      if (allSiblingsResolved) {
        await db
          .update(marketsTable)
          .set({
            status: "resolved",
            endDate: new Date(),
          })
          .where(eq(marketsTable.id, currentMarket.parentMarketId))
      }
    }

    return NextResponse.json(
      { success: true, data: updatedMarket },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating market status:", error)
    return NextResponse.json(
      { success: false, message: "Error updating market status", error },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const leagueParam = searchParams.get("league")
    const league = leagueParam ? leagueParam : undefined

    const markets = await getMarkets(undefined, league)

    return NextResponse.json(markets)
  } catch (error) {
    console.error("Error fetching markets:", error)
    return NextResponse.json(
      { message: "Error fetching markets", error: String(error) },
      { status: 500 }
    )
  }
}
