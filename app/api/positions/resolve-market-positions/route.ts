import { db } from "@/lib/db/client"
import { userPositionsTable } from "@/lib/db/schema"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    // Check authentication - only admins should be able to resolve markets
    const user = await getAuthenticatedUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { marketId, winningTokenId, conditionId } = await req.json()

    if (!marketId || !winningTokenId || !conditionId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Get all open positions for this market
    const openPositions = await db
      .select()
      .from(userPositionsTable)
      .where(
        and(
          eq(userPositionsTable.marketId, marketId),
          eq(userPositionsTable.status, "open")
        )
      )

    // Process all positions in parallel
    await Promise.all(
      openPositions.map(async (position) => {
        // Determine if this is a winning position
        const isWinner = position.tokenId === winningTokenId
        const newStatus = isWinner ? "won" : "lost"

        // Update position status
        return db
          .update(userPositionsTable)
          .set({
            status: newStatus,
            lastUpdated: new Date(),
          })
          .where(eq(userPositionsTable.id, position.id))
      })
    )

    return NextResponse.json({
      success: true,
      updatedPositions: openPositions.length,
    })
  } catch (error) {
    console.error("Failed to resolve market positions:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
