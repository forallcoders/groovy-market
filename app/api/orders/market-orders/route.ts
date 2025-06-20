import { db } from "@/lib/db/client"
import { ordersTable, marketsTable } from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const marketId = searchParams.get("marketId")

    if (!marketId) {
      return NextResponse.json(
        { error: "Market ID is required" },
        { status: 400 }
      )
    }

    const [market] = await db
      .select()
      .from(marketsTable)
      .where(eq(marketsTable.id, marketId))

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 })
    }

    const orders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.marketId, marketId),
          inArray(ordersTable.status, ["pending", "partially_filled"])
        )
      )
      .orderBy(ordersTable.created_at)

    return NextResponse.json({
      orders,
      market: {
        id: market.id,
        title: market.title,
      },
    })
  } catch (error) {
    console.error("Error fetching market orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch market orders" },
      { status: 500 }
    )
  }
}
