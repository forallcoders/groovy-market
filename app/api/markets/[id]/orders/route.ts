import { db } from "@/lib/db/client"
import { ordersTable } from "@/lib/db/schema"
import { and, eq, not } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

type Order = {
  id: string
  side: "BUY" | "SELL"
  tokenId: string
  makerAmount: string
  takerAmount: string
  filledAmount: string
  expiration: number
}

export async function GET(request: NextRequest, { params }: any) {
  try {
    // Parse request parameters
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Invalid market ID" }, { status: 400 })
    }
    const orders = await db
      .select()
      .from(ordersTable)
      .where(
        and(eq(ordersTable.marketId, id), not(eq(ordersTable.status, "filled")))
      )
    const mappedOrders: Order[] = orders.map((order) => ({
      id: order.id,
      side: order.side as "BUY" | "SELL",
      tokenId: order.tokenId,
      makerAmount: order.makerAmount,
      takerAmount: order.takerAmount,
      filledAmount: order.filledAmount ?? "0",
      expiration:
        Number(order.expiration) ??
        new Date().getTime() + 1000 * 60 * 60 * 24 * 30,
    }))

    return NextResponse.json({ orders: mappedOrders })
  } catch (error) {
    console.error("Error fetching market info:", error)
    return NextResponse.json(
      { error: "Failed to fetch market info" },
      { status: 500 }
    )
  }
}
