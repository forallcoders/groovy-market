import { marketCreatorContract } from "@/contracts/data/market-creator"
import { oracleResolverContract } from "@/contracts/data/oracle"
import { db } from "@/lib/db/client"
import { marketsTable } from "@/lib/db/schema"
import { getMarketChainData } from "@/lib/market/get-markets"
import { publicClient } from "@/lib/wallet/public-client"
import { privateClient } from "@/lib/wallet/private-client"
import { and, eq, inArray, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"
import {
  addInitialLiquidityToBlockchain,
  createAndInsertDefaultOrders,
} from "@/app/markets/utils/cron"

export async function GET() {
  try {
    const [parentMarket] = await db
      .select()
      .from(marketsTable)
      .where(
        and(
          eq(marketsTable.status, "pending"),
          eq(marketsTable.type, "grouped"),
          isNull(marketsTable.parentMarketId)
        )
      )
      .limit(1)

    if (!parentMarket) {
      return NextResponse.json({ message: "No grouped markets pending" })
    }

    const childMarkets = await db
      .select()
      .from(marketsTable)
      .where(eq(marketsTable.parentMarketId, parentMarket.id))

    if (!childMarkets.length) {
      console.warn(`No child markets for parent market ${parentMarket.id}`)
      return NextResponse.json({ message: "No children found for parent" })
    }

    const childMarketIds = childMarkets.map((market) => market.id)

    let txHash: `0x${string}`
    try {
      txHash = await privateClient.writeContract({
        address: marketCreatorContract.address,
        abi: marketCreatorContract.abi,
        functionName: "createMultipleMarkets",
        args: [childMarketIds, oracleResolverContract.address],
      })
      await publicClient.waitForTransactionReceipt({ hash: txHash })
      console.log(
        `Markets created for parent ${parentMarket.id} - TX: ${txHash}`
      )
    } catch (err) {
      console.error("❌ Failed to call createMultipleMarkets", err)
      return NextResponse.json(
        { error: "Blockchain publish failed" },
        { status: 500 }
      )
    }

    for (const market of childMarkets) {
      try {
        const chainData = await getMarketChainData(market.id)
        const usdcAmount = 100 / childMarkets.length

        await db
          .update(marketsTable)
          .set({
            status: "created",
            conditionId: chainData.conditionId,
            yesTokenId: chainData.yesTokenId,
            noTokenId: chainData.noTokenId,
            volume: usdcAmount.toFixed(2),
          })
          .where(eq(marketsTable.id, market.id))

        await Promise.all([
          createAndInsertDefaultOrders({
            marketId: market.id,
            conditionId: chainData.conditionId,
            tokenId: chainData.yesTokenId,
            usdcAmount,
          }),
          createAndInsertDefaultOrders({
            marketId: market.id,
            conditionId: chainData.conditionId,
            tokenId: chainData.noTokenId,
            usdcAmount,
          }),
          addInitialLiquidityToBlockchain({
            conditionId: chainData.conditionId,
            usdcAmount,
          }),
        ])
      } catch (err) {
        console.error(`❌ Failed to sync child market ${market.id}`, err)
        return NextResponse.json(
          { error: `Failed to sync child market ${market.id}` },
          { status: 500 }
        )
      }
    }

    const marketIds = [parentMarket.id, ...childMarketIds]
    try {
      await db
        .update(marketsTable)
        .set({ status: "created" })
        .where(inArray(marketsTable.id, marketIds))
    } catch (err) {
      console.error("❌ Failed to update parent status", err)
      return NextResponse.json(
        { error: "Parent update failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Grouped market ${parentMarket.id} published`,
    })
  } catch (error) {
    console.error("❌ Top-level failure", error)
    return NextResponse.json(
      { error: "Failed to publish grouped market" },
      { status: 500 }
    )
  }
}
