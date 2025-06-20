import { db } from "@/lib/db/client"
import { marketsTable } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { privateClient } from "@/lib/wallet/private-client"
import { publicClient } from "@/lib/wallet/public-client"
import { marketCreatorContract } from "@/contracts/data/market-creator"
import { oracleResolverContract } from "@/contracts/data/oracle"
import { getMarketChainData } from "@/lib/market/get-markets"
import {
  createAndInsertDefaultOrders,
  addInitialLiquidityToBlockchain,
} from "@/app/markets/utils/cron"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const [market] = await db
      .select()
      .from(marketsTable)
      .where(
        and(
          eq(marketsTable.status, "pending"),
          eq(marketsTable.type, "single"),
          isNull(marketsTable.parentMarketId)
        )
      )
      .limit(1)

    if (!market) {
      return NextResponse.json({ message: "No single markets pending" })
    }

    let txHash: `0x${string}`
    try {
      txHash = await privateClient.writeContract({
        address: marketCreatorContract.address,
        abi: marketCreatorContract.abi,
        functionName: "createMarket",
        args: [market.id, oracleResolverContract.address],
      })
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      console.log(
        `✅ Created single market on-chain: ${market.id} (tx: ${txHash})`
      )
    } catch (err) {
      console.error("❌ Failed to create market on-chain", err)
      return NextResponse.json(
        { error: "Blockchain publish failed" },
        { status: 500 }
      )
    }

    try {
      const chainData = await getMarketChainData(market.id)
      const usdcAmount = 100

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

      console.log(
        `✅ Synced single market ${market.id} to DB + orders + liquidity`
      )
    } catch (err) {
      console.error("❌ Failed to sync market data post-chain", err)
      return NextResponse.json(
        { error: "Failed to sync market after chain publish" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Single market ${market.id} published`,
    })
  } catch (err) {
    console.error("❌ Top-level error publishing single market", err)
    return NextResponse.json(
      { error: "Unexpected failure in single publish cron" },
      { status: 500 }
    )
  }
}
