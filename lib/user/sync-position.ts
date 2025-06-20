import { and } from "drizzle-orm"

import { ctfContract } from "@/contracts/data/ctf"
import { eq } from "drizzle-orm"
import { db } from "../db/client"
import { userPositionsTable } from "../db/schema"
import { publicClient } from "../wallet/public-client"

export async function syncPosition(
  userAddress: string,
  marketId: string,
  tokenId: string,
  conditionId: string,
  entryPrice: string
): Promise<string> {
  if (!userAddress || !marketId || !tokenId || !conditionId) {
    return "error"
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
  const balance = await publicClient.readContract({
    address: ctfContract.address,
    abi: ctfContract.abi,
    functionName: "balanceOf",
    args: [userAddress as `0x${string}`, tokenId],
  })
  const balanceBigInt = balance as bigint

  if (existing.length === 0) {
    if (balanceBigInt === BigInt(0)) {
      return "skipped"
    }
    await db.insert(userPositionsTable).values({
      userAddress,
      marketId,
      tokenId,
      conditionId,
      entryPrice,
      balance: balanceBigInt.toString(),
      created_at: new Date(),
      lastUpdated: new Date(),
    })

    return "created"
  }
  if (balanceBigInt === BigInt(0)) {
    await db
      .delete(userPositionsTable)
      .where(
        and(
          eq(userPositionsTable.userAddress, userAddress),
          eq(userPositionsTable.tokenId, tokenId)
        )
      )

    return "deleted"
  }

  await db
    .update(userPositionsTable)
    .set({ balance: balanceBigInt.toString(), lastUpdated: new Date() })
    .where(eq(userPositionsTable.id, existing[0].id))

  return "updated"
}
