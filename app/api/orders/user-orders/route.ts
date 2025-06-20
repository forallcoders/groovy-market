import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { FEE_RATE_BPS } from "@/lib/config"
import { db } from "@/lib/db/client"
import { ordersTable, marketsTable, Order } from "@/lib/db/schema"
import { and, eq, inArray, or, sql } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return new Response("Unauthorized", { status: 401 })

    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get("marketId")
    if (!marketId || !user.proxyWallet) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 })
    }

    const [market] = await db
      .select()
      .from(marketsTable)
      .where(eq(marketsTable.id, marketId))

    if (!market) return NextResponse.json([], { status: 200 })

    const isGrouped = market.type === "grouped"

    const marketIdsToCheck = isGrouped
      ? (
          await db
            .select({ id: marketsTable.id })
            .from(marketsTable)
            .where(eq(marketsTable.parentMarketId, market.id))
        ).map((m) => m.id)
      : [market.id]

    const orders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(sql`lower(${ordersTable.maker})`, user.proxyWallet.toLowerCase()),
          or(
            eq(ordersTable.status, "pending"),
            eq(ordersTable.status, "partially_filled")
          ),
          inArray(ordersTable.marketId, marketIdsToCheck)
        )
      )
      .orderBy(ordersTable.created_at)

    const formatted = orders.map((order) => ({
      orderHash: order.orderHash,
      salt: order.salt,
      maker: order.maker as `0x${string}`,
      signer: order.signer as `0x${string}`,
      taker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      tokenId: order.tokenId,
      makerAmount: order.makerAmount,
      takerAmount: order.takerAmount,
      filledAmount: order.filledAmount,
      expiration: order.expiration ?? 0,
      nonce: 0,
      feeRateBps: FEE_RATE_BPS,
      side: order.side === "BUY" ? 0 : 1,
      signatureType: 0,
      signature: "0x",
      status: order.status,
      marketId: order.marketId,
    }))

    // Return grouped or flat depending on if it's a grouped market
    if (isGrouped) {
      const grouped: Record<string, Order[]> = {}
      for (const order of formatted) {
        if (!grouped[order.marketId!]) grouped[order.marketId!] = []
        grouped[order.marketId!].push(order as any)
      }
      return NextResponse.json(grouped)
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch user orders" },
      { status: 500 }
    )
  }
}
