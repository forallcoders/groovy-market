import { ctfContract } from "@/contracts/data/ctf"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db/client"
import { userPositionsTable } from "@/lib/db/schema"
import { publicClient } from "@/lib/wallet/public-client"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const { userAddress, marketId, tokenId, conditionId, entryPrice } =
      await req.json()

    if (!userAddress || !marketId || !tokenId || !conditionId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const existing = await db
      .select()
      .from(userPositionsTable)
      .where(
        and(
          eq(userPositionsTable.userAddress, userAddress),
          eq(userPositionsTable.tokenId, tokenId)
        )
      )

    // Get current balance from contract
    const balance = await publicClient.readContract({
      address: ctfContract.address,
      abi: ctfContract.abi,
      functionName: "balanceOf",
      args: [userAddress as `0x${string}`, tokenId],
    })

    const balanceBigInt = balance as bigint

    if (existing.length === 0) {
      if (balanceBigInt === BigInt(0)) {
        return NextResponse.json({ skipped: true })
      }

      await db.insert(userPositionsTable).values({
        userAddress,
        marketId,
        tokenId,
        conditionId,
        entryPrice: entryPrice ?? "0.50",
        balance: balanceBigInt.toString(),
        status: "open",
        created_at: new Date(),
        lastUpdated: new Date(),
      })

      return NextResponse.json({ created: true })
    }

    if (balanceBigInt === BigInt(0)) {
      await db
        .update(userPositionsTable)
        .set({
          balance: "0",
          status: "closed",
          lastUpdated: new Date(),
        })
        .where(
          and(
            eq(userPositionsTable.userAddress, userAddress),
            eq(userPositionsTable.tokenId, tokenId)
          )
        )

      return NextResponse.json({ closed: true })
    }

    // If there's a balance → update
    await db
      .update(userPositionsTable)
      .set({
        balance: balanceBigInt.toString(),
        status: existing[0].status === "closed" ? "open" : existing[0].status,
        lastUpdated: new Date(),
      })
      .where(
        and(
          eq(userPositionsTable.userAddress, userAddress),
          eq(userPositionsTable.tokenId, tokenId)
        )
      )

    return NextResponse.json({ updated: true })
  } catch (error) {
    console.error("Failed to sync user positions", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
