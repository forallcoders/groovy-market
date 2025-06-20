import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db/client"
import { marketsTable, userActivityTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const { marketId, usdcAmount, txHash } = await req.json()

    if (!marketId || !usdcAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const [market] = await db
      .select({
        volume: marketsTable.volume,
        yesTokenId: marketsTable.yesTokenId,
        noTokenId: marketsTable.noTokenId,
      })
      .from(marketsTable)
      .where(eq(marketsTable.id, marketId))

    const currentVolume = market?.volume ? parseFloat(market.volume) : 0
    const volumeToAdd = parseFloat(usdcAmount)
    const newVolume = currentVolume + volumeToAdd

    await db
      .update(marketsTable)
      .set({
        volume: newVolume.toString(),
        updatedAt: new Date(),
      })
      .where(eq(marketsTable.id, marketId))
    await db.insert(userActivityTable).values({
      user: user.proxyWallet!,
      activityType: "MERGE",
      marketId,
      tokenId: market.yesTokenId!,
      amount: (Number(usdcAmount) * Math.pow(10, 6)).toString(),
      shares: (Number(usdcAmount) * Math.pow(10, 6)).toString(),
      pricePerShare: "0.5",
      transactionHash: txHash,
    })
    await db.insert(userActivityTable).values({
      user: user.proxyWallet!,
      activityType: "MERGE",
      marketId,
      tokenId: market.noTokenId!,
      amount: (Number(usdcAmount) * Math.pow(10, 6)).toString(),
      shares: (Number(usdcAmount) * Math.pow(10, 6)).toString(),
      pricePerShare: "0.5",
      transactionHash: txHash,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error adding split volume:", err)
    return NextResponse.json(
      { error: "Failed to update volume" },
      { status: 500 }
    )
  }
}
