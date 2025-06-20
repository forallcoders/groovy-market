import { db } from "@/lib/db/client"
import { marketsTable, marketConditionsTable } from "@/lib/db/schema"
import { marketCreatorContract } from "@/contracts/data/market-creator"
import { oracleResolverContract } from "@/contracts/data/oracle"
import { privateClient } from "@/lib/wallet/private-client"
import { addDays } from "date-fns"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { formatDate } from "@/utils/dates"
import { publicClient } from "@/lib/wallet/public-client"
import { getMarketChainData } from "@/lib/market/get-markets"
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

const PRICE_BUCKETS_BY_ASSET: any = {
  BTC: [
    { outcome: "price", condition: "greater-than", price: "89000" },
    {
      outcome: "price",
      condition: "in-between",
      price: "87000",
      priceMax: "89000",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "85000",
      priceMax: "87000",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "83000",
      priceMax: "85000",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "81000",
      priceMax: "83000",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "79000",
      priceMax: "81000",
    },
    { outcome: "price", condition: "lower-than", price: "79000" },
  ],
  ETH: [
    { outcome: "price", condition: "greater-than", price: "1800" },
    {
      outcome: "price",
      condition: "in-between",
      price: "1700",
      priceMax: "1800",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "1600",
      priceMax: "1700",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "1500",
      priceMax: "1600",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "1400",
      priceMax: "1500",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "1300",
      priceMax: "1400",
    },
    { outcome: "price", condition: "lower-than", price: "1300" },
  ],
  SEI: [
    { outcome: "price", condition: "greater-than", price: "0.2" },
    {
      outcome: "price",
      condition: "in-between",
      price: "0.18",
      priceMax: "0.2",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "0.16",
      priceMax: "0.18",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "0.14",
      priceMax: "0.16",
    },
    {
      outcome: "price",
      condition: "in-between",
      price: "0.12",
      priceMax: "0.14",
    },
    { outcome: "price", condition: "lower-than", price: "0.12" },
  ],
}

function formatPrice(value: string | number): string {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })
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
      const priceBuckets = PRICE_BUCKETS_BY_ASSET[asset.symbol]
      const priceParentTitle = `${asset.display} price on ${formattedPredictionDate}`

      const [priceParentMarket] = await db
        .insert(marketsTable)
        .values({
          title: priceParentTitle,
          description: `What will be the price range of ${asset.display} on ${formattedPredictionDate}?`,
          image: asset.image,
          type: "grouped",
        })
        .returning()

      const childMarketsToCreate = priceBuckets.map((bucket: any) => {
        const label =
          bucket.condition === "in-between"
            ? `${formatPrice(bucket.price)} to ${formatPrice(bucket.priceMax)}`
            : formatPrice(bucket.price)

        return {
          title: `${asset.symbol} ${bucket.outcome} ${formatCondition(
            bucket.condition
          )} ${label} USD`,
          description: priceParentTitle,
          parentMarketId: priceParentMarket.id,
          image: asset.image,
        }
      })

      const insertedChildMarkets = await db
        .insert(marketsTable)
        .values(childMarketsToCreate)
        .returning()

      const priceConditions = insertedChildMarkets.map((market, i) => {
        const bucket = priceBuckets[i]
        return {
          marketId: market.id,
          type: "crypto",
          asset: asset.symbol,
          metric: "price",
          metricCondition: bucket.condition,
          predictionDate,
          variantKey: bucket.outcome,
          data: {
            primaryCurrency: asset.symbol,
            secondaryCurrency: "USD",
            outcome: bucket.outcome,
            condition: bucket.condition,
            price: bucket.price,
            priceMax: bucket.priceMax,
            predictionDate: new Date(predictionDate).toISOString(),
          },
        }
      })

      await db.insert(marketConditionsTable).values(priceConditions as any)

      const questions = insertedChildMarkets.map((market) => market.id)

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
      console.log({ response })
      for (const market of insertedChildMarkets) {
        const chainData = await getMarketChainData(market.id)
        const usdcAmount = 100 / insertedChildMarkets.length
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

      logs.push(
        ...priceBuckets.map((price: any) => ({
          asset: asset.symbol,
          outcome: price.outcome,
          tx,
        }))
      )

      await db
        .update(marketsTable)
        .set({ status: "created" })
        .where(eq(marketsTable.id, priceParentMarket.id))
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
