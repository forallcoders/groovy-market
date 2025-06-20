import { db } from "@/lib/db/client"
import { ordersTable } from "@/lib/db/schema"
import { and, desc, eq, or } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: any) {
  const { id: marketId } = await params
  if (!marketId) {
    return NextResponse.json({ error: "Invalid market ID" }, { status: 400 })
  }
  const { searchParams } = new URL(request.url)
  const tokenId = searchParams.get("tokenId")
  if (!tokenId) {
    return NextResponse.json(
      { error: " tokenId are required" },
      { status: 400 }
    )
  }

  const [lastFilled] = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.marketId, marketId),
        eq(ordersTable.tokenId, tokenId),
        or(
          eq(ordersTable.status, "filled"),
          eq(ordersTable.status, "partially_filled")
        )
      )
    )
    .orderBy(desc(ordersTable.updated_at))
    .limit(1)

  if (!lastFilled) {
    return NextResponse.json({ price: null })
  }

  const price =
    lastFilled.side === "BUY"
      ? Number(lastFilled.makerAmount) / Number(lastFilled.takerAmount)
      : Number(lastFilled.takerAmount) / Number(lastFilled.makerAmount)

  return NextResponse.json({ price: price.toFixed(4) })
}
