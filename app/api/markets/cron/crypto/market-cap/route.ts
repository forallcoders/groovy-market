import { db } from "@/lib/db/client"
import { marketsTable, marketConditionsTable } from "@/lib/db/schema"
import { marketCreatorContract } from "@/contracts/data/market-creator"
import { oracleResolverContract } from "@/contracts/data/oracle"
import { privateClient, relayerAccount } from "@/lib/wallet/private-client"
import { addDays } from "date-fns"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { formatDate } from "@/utils/dates"
import { getMarketChainData } from "@/lib/market/get-markets"
import { publicClient } from "@/lib/wallet/public-client"
import { formatBigNumber } from "@/utils/market"
import { formatCondition } from "@/app/markets/utils/condition"
import {
  addInitialLiquidityToBlockchain,
  createAndInsertDefaultOrders,
} from "@/app/markets/utils/cron"

const CRYPTO_ASSETS = [
  {
    symbol: "BTC",
    display: "Bitcoin",
    image: "https://m.media-amazon.com/images/I/71cu980UfuL.jpg",
  },
  {
    symbol: "ETH",
    display: "Ethereum",
    image:
      "https://static1.tokenterminal.com//ethereum/logo.png?logo_hash=fd8f54cab23f8f4980041f4e74607cac0c7ab880",
  },
  {
    symbol: "SEI",
    display: "SEI",
    image:
      "https://s3.coinmarketcap.com/static-gravity/image/992744cfbd5e40f5920018ee7a830b98.png",
  },
]

const MARKET_CAP_BUCKETS_BY_ASSET: any = {
  BTC: [
    {
      outcome: "market-cap",
      condition: "greater-than",
      "market-cap": "1400000000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "1300000000000",
      "market-cap-max": "1400000000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "1200000000000",
      "market-cap-max": "1300000000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "1100000000000",
      "market-cap-max": "1200000000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "1000000000000",
      "market-cap-max": "1100000000000",
    },
    {
      outcome: "market-cap",
      condition: "lower-than",
      "market-cap": "1000000000000",
    },
  ],
  ETH: [
    {
      outcome: "market-cap",
      condition: "greater-than",
      "market-cap": "400000000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "370000000000",
      "market-cap-max": "400000000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "340000000000",
      "market-cap-max": "370000000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "310000000000",
      "market-cap-max": "340000000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "280000000000",
      "market-cap-max": "310000000000",
    },
    {
      outcome: "market-cap",
      condition: "lower-than",
      "market-cap": "280000000000",
    },
  ],
  SEI: [
    {
      outcome: "market-cap",
      condition: "greater-than",
      "market-cap": "350000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "325000000",
      "market-cap-max": "350000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "300000000",
      "market-cap-max": "325000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "275000000",
      "market-cap-max": "300000000",
    },
    {
      outcome: "market-cap",
      condition: "in-between",
      "market-cap": "250000000",
      "market-cap-max": "275000000",
    },
    {
      outcome: "market-cap",
      condition: "lower-than",
      "market-cap": "250000000",
    },
  ],
}

export async function GET() {
  try {
    const predictionDate = addDays(new Date(), 3).toISOString().slice(0, 10)
    const formattedPredictionDate = formatDate({
      dateString: predictionDate,
      dateFormat: "MMMM d, yyyy",
    })
    const logs: { asset: string; outcome: string; txHash: string }[] = []

    for (const asset of CRYPTO_ASSETS) {
      const capBuckets = MARKET_CAP_BUCKETS_BY_ASSET[asset.symbol]
      const marketCapParentTitle = `${asset.display} market cap on ${formattedPredictionDate}`

      const [marketCapParentMarket] = await db
        .insert(marketsTable)
        .values({
          title: marketCapParentTitle,
          description: `What will be the market cap of ${asset.display} on ${formattedPredictionDate}?`,
          image: asset.image,
          type: "grouped",
        })
        .returning()

      const capMarketsToCreate = capBuckets.map((bucket: any) => {
        const label =
          bucket.condition === "in-between"
            ? `${formatBigNumber(bucket["market-cap"])} to ${formatBigNumber(
                bucket["market-cap-max"]
              )}`
            : formatBigNumber(bucket["market-cap"])

        return {
          title: `${asset.symbol} market cap ${formatCondition(
            bucket.condition
          )} ${label} USD`,
          description: marketCapParentTitle,
          parentMarketId: marketCapParentMarket.id,
          image: asset.image,
        }
      })

      const insertedCapMarkets = await db
        .insert(marketsTable)
        .values(capMarketsToCreate)
        .returning()

      const capConditions: any[] = insertedCapMarkets.map((market, i) => {
        const bucket = capBuckets[i]
        return {
          marketId: market.id,
          type: "crypto",
          asset: asset.symbol,
          metric: "market-cap",
          metricCondition: bucket.condition,
          predictionDate,
          variantKey: "marketCap",
          data: {
            primaryCurrency: asset.symbol,
            secondaryCurrency: "USD",
            outcome: bucket.outcome,
            condition: bucket.condition,
            marketCap: bucket["market-cap"],
            marketCapMax: bucket["market-cap-max"],
            predictionDate: new Date(predictionDate).toISOString(),
          },
        }
      })

      await db.insert(marketConditionsTable).values(capConditions)

      const questions = insertedCapMarkets.map((market) => market.id)

      const tx = await privateClient.writeContract({
        address: marketCreatorContract.address,
        abi: marketCreatorContract.abi,
        functionName: "createMultipleMarkets",
        args: [questions, oracleResolverContract.address],
        gas: BigInt(6_000_000),
      })

      const response = await publicClient.waitForTransactionReceipt({
        hash: tx,
      })

      if (response.status === "reverted") {
        console.error("Transaction reverted:", tx)
        return NextResponse.json(
          { success: false, error: "Transaction reverted" },
          { status: 500 }
        )
      }

      for (const market of insertedCapMarkets) {
        const chainData = await getMarketChainData(market.id)
        const usdcAmount = 100 / insertedCapMarkets.length
        await db
          .update(marketsTable)
          .set({
            status: "created",
            conditionId: chainData.conditionId,
            yesTokenId: chainData.yesTokenId,
            noTokenId: chainData.noTokenId,
            volume: usdcAmount.toFixed(2).toString(),
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
      }

      await db
        .update(marketsTable)
        .set({ status: "created" })
        .where(eq(marketsTable.id, marketCapParentMarket.id))

      logs.push(
        ...capBuckets.map((price: any) => ({
          asset: asset.symbol,
          outcome: price.outcome,
          tx,
        }))
      )
    }

    return NextResponse.json({ success: true, createdMarkets: logs })
  } catch (error) {
    console.error("❌ Error in cron-create:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
