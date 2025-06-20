import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { marketCreatorContract } from "@/contracts/data/market-creator"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db/client"
import {
  marketsTable,
  Order,
  ordersTable,
  OrderStatus,
  priceHistoryTable,
  userActivityTable,
} from "@/lib/db/schema"
import { normalizeOrderForHashing } from "@/lib/order/hash-order"
import { validateOrderSignature } from "@/lib/order/validation"
import { syncPosition } from "@/lib/user/sync-position"
import { privateClient } from "@/lib/wallet/private-client"
import { publicClient } from "@/lib/wallet/public-client"
import { and, eq, not, or, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { formatUnits } from "viem"

interface RequestOrder {
  salt: string
  maker: string
  signer: string
  taker: string
  tokenId: string
  makerAmount: string
  takerAmount: string
  expiration: string
  nonce: string
  feeRateBps: string
  side: number
  signatureType: number
  signature: string
}

interface BlockchainOrder {
  salt: bigint
  maker: `0x${string}`
  signer: `0x${string}`
  taker: `0x${string}`
  tokenId: bigint
  makerAmount: bigint
  takerAmount: bigint
  expiration: bigint
  nonce: bigint
  feeRateBps: bigint
  side: number
  signatureType: number
  signature: `0x${string}`
}

interface MatchResult {
  orders: Order[]
  fillAmounts: bigint[] // In terms of maker asset
  totalFilled: bigint // In terms of taker order's maker asset
  fillMakerUsdc: bigint[]
  fillTakerUsdc: bigint[]
}

enum MatchType {
  COMPLEMENTARY = 0, // BUY vs SELL
  MINT = 1, // BUY vs BUY
  MERGE = 2, // SELL vs SELL
}

enum Side {
  BUY = 0,
  SELL = 1,
}

const ONE = BigInt(10) ** BigInt(18) // 10^18 for price normalization

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }
  const body = await req.json()
  const { order: _order, signature, marketId, conditionId, price } = body
  const order = _order as RequestOrder

  if (!marketId) {
    return NextResponse.json(
      { error: "Market ID is required" },
      { status: 400 }
    )
  }
  const validationResult = await validateOrderSignature(order, signature)
  if (!validationResult.isValid) {
    return NextResponse.json(
      {
        error: validationResult.error,
        details: validationResult.details,
      },
      { status: 401 }
    )
  }
  const [, yesTokenId, noTokenId] = (await publicClient.readContract({
    address: marketCreatorContract.address,
    abi: marketCreatorContract.abi,
    functionName: "getMarketDataByQuestion",
    args: [marketId],
  })) as bigint[]

  console.log({ yesTokenId, noTokenId })

  const tokenId = order.tokenId.toString()
  const complementTokenId =
    tokenId === yesTokenId.toString()
      ? noTokenId.toString()
      : yesTokenId.toString()
  if (tokenId !== yesTokenId.toString() && tokenId !== noTokenId.toString()) {
    return NextResponse.json(
      { error: "Token ID does not belong to this market" },
      { status: 400 }
    )
  }

  const correctedOrder = normalizeOrderForHashing({
    ...order,
    signature,
  })

  const orderHash = await publicClient.readContract({
    address: ctfExchangeContract.address,
    abi: ctfExchangeContract.abi,
    functionName: "hashOrder",
    args: [correctedOrder],
  })

  const side = correctedOrder.side === Side.BUY ? "BUY" : "SELL"
  const complementTokenSide = side // Same side for opposite token
  const matchSide = side === "BUY" ? "SELL" : "BUY"

  const orderExpression =
    side === "BUY"
      ? sql`CAST(orders."maker_amount" AS DECIMAL) / CAST(orders."taker_amount" AS DECIMAL) DESC`
      : sql`CAST(orders."taker_amount" AS DECIMAL) / CAST(orders."maker_amount" AS DECIMAL) DESC`

  const complementaryMatches = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        or(
          eq(ordersTable.status, "pending"),
          eq(ordersTable.status, "partially_filled")
        ),
        eq(ordersTable.marketId, marketId),
        eq(ordersTable.side, matchSide),
        eq(ordersTable.tokenId, tokenId),
        not(eq(ordersTable.orderHash, orderHash as string))
      )
    )
    .orderBy(orderExpression)
  console.log({ complementaryMatches })
  const complementTokenMatches = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        or(
          eq(ordersTable.status, "pending"),
          eq(ordersTable.status, "partially_filled")
        ),
        eq(ordersTable.marketId, marketId),
        eq(ordersTable.side, complementTokenSide),
        eq(ordersTable.tokenId, complementTokenId),
        not(eq(ordersTable.orderHash, orderHash as string))
      )
    )
    .orderBy(orderExpression)
  console.log({ complementTokenMatches })

  const takerOrder = {
    makerAmount: BigInt(correctedOrder.makerAmount),
    takerAmount: BigInt(correctedOrder.takerAmount),
    side,
  }

  const result = matchOrders(
    takerOrder,
    complementaryMatches,
    MatchType.COMPLEMENTARY
  )

  // If still unmatched amount and we have complementary token orders, try to match those
  if (
    result.totalFilled < takerOrder.makerAmount &&
    complementTokenMatches.length > 0
  ) {
    const remainingAmount = takerOrder.makerAmount - result.totalFilled

    // Create a new taker order with the remaining amount
    const remainingTakerOrder = {
      ...takerOrder,
      makerAmount: remainingAmount,
      takerAmount:
        (remainingAmount * takerOrder.takerAmount) / takerOrder.makerAmount,
    }

    // Match with complementary token orders (MINT for BUY, MERGE for SELL)
    const matchType = side === "BUY" ? MatchType.MINT : MatchType.MERGE
    const complementResult = matchOrders(
      remainingTakerOrder,
      complementTokenMatches,
      matchType
    )

    // Combine results
    result.orders = [...result.orders, ...complementResult.orders]
    result.fillAmounts = [
      ...result.fillAmounts,
      ...complementResult.fillAmounts,
    ]
    result.totalFilled += complementResult.totalFilled
  }

  // If we couldn't match anything
  if (result.orders.length === 0) {
    return NextResponse.json({
      message: "No matching orders found",
    })
  }

  console.log("Matched orders:", result.orders.length)
  console.log("Fill amounts:", result.fillAmounts)
  console.log("Total filled:", result.totalFilled.toString())

  const matchingOrdersForChain: BlockchainOrder[] = result.orders.map(
    (matchedOrder) => normalizeOrderForHashing(matchedOrder)
  )
  const takerOrderChain: BlockchainOrder = correctedOrder

  console.dir(
    {
      args: [
        takerOrderChain,
        matchingOrdersForChain,
        result.totalFilled,
        result.fillAmounts,
      ],
    },
    {
      depth: Infinity,
    }
  )

  let txHash: `0x${string}`
  try {
    txHash = await privateClient.writeContract({
      address: ctfExchangeContract.address,
      abi: ctfExchangeContract.abi,
      functionName: "matchOrders",
      args: [
        takerOrderChain,
        matchingOrdersForChain,
        result.totalFilled,
        result.fillAmounts,
      ],
      gas: BigInt(3000000),
    })
    console.log("On-chain matchOrders txHash:", txHash)
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    })
    console.log({ receipt })
    if (receipt.status === "reverted") {
      return NextResponse.json(
        { error: "On-chain match failed", details: "error" },
        { status: 500 }
      )
    }

    try {
      const tradedTokenId = correctedOrder.tokenId.toString()
      const executionPrice =
        takerOrder.side === "BUY"
          ? (
              Number(takerOrder.makerAmount) / Number(takerOrder.takerAmount)
            ).toString()
          : (
              Number(takerOrder.takerAmount) / Number(takerOrder.makerAmount)
            ).toString()

      // Record price for the token that was actually traded
      await db.insert(priceHistoryTable).values({
        marketId: marketId,
        tokenId: tradedTokenId,
        price: executionPrice,
        timestamp: new Date(),
      })

      console.log(
        `Price history updated for market ${marketId}, token ${correctedOrder.tokenId} at ${executionPrice}`
      )
    } catch (error) {
      // Log but don't fail the whole operation if price history recording fails
      console.error("Error recording price history:", error)
    }
  } catch (error) {
    console.error("Error matching orders:", error)
    return NextResponse.json(
      { error: "Error matching orders" },
      { status: 500 }
    )
  }

  const takerOrderStatus = (await publicClient.readContract({
    address: ctfExchangeContract.address,
    abi: ctfExchangeContract.abi,
    functionName: "getOrderStatus",
    args: [orderHash],
  })) as any
  console.log({ takerOrderStatus })

  const isCancelled = takerOrderStatus?.isCancelled || false
  const remainingAmount = takerOrderStatus?.remaining || BigInt(0)
  const filledAmount = BigInt(correctedOrder.makerAmount) - remainingAmount

  let orderStatus: OrderStatus
  if (isCancelled) {
    orderStatus = "cancelled"
  } else if (remainingAmount > BigInt(0)) {
    orderStatus = "partially_filled"
  } else {
    orderStatus = "filled"
  }

  await db
    .insert(ordersTable)
    .values({
      orderHash: orderHash as string,
      salt: correctedOrder.salt.toString(),
      maker: correctedOrder.maker,
      signer: correctedOrder.signer,
      marketId: marketId,
      side,
      tokenId: correctedOrder.tokenId.toString(),
      makerAmount: correctedOrder.makerAmount.toString(),
      takerAmount: correctedOrder.takerAmount.toString(),
      signature,
      status: orderStatus,
      tokensTransferred: false,
      transferTxHash: txHash,
      tokensReturned: true,
      orderType: "market",
      expiration: correctedOrder.expiration.toString(),
      filledAmount: filledAmount.toString(),
    })
    .returning({ id: ordersTable.id })

  const takerPricePerShare =
    takerOrder.side === "BUY"
      ? Number(takerOrder.makerAmount) / Number(takerOrder.takerAmount)
      : Number(takerOrder.takerAmount) / Number(takerOrder.makerAmount)
  const takerAmountDecimal = Number(formatUnits(filledAmount, 6))

  await db.insert(userActivityTable).values({
    user: correctedOrder.maker as string,
    activityType: correctedOrder.side === Side.BUY ? "BUY" : "SELL",
    amount: takerAmountDecimal.toString(),
    marketId: marketId,
    shares:
      correctedOrder.side === Side.BUY
        ? correctedOrder.takerAmount.toString()
        : correctedOrder.makerAmount.toString(),
    tokenId: correctedOrder.tokenId.toString(),
    transactionHash: txHash,
    pricePerShare: takerPricePerShare.toString(),
    outcomeValue: correctedOrder.tokenId.toString() === yesTokenId.toString(),
  })

  await Promise.all(
    result.orders.map(async (match, index) => {
      const matchOrderStatus = (await publicClient.readContract({
        address: ctfExchangeContract.address,
        abi: ctfExchangeContract.abi,
        functionName: "getOrderStatus",
        args: [match.orderHash],
      })) as any

      const isMatchFilled = matchOrderStatus?.isFilled || false
      const isMatchCancelled = matchOrderStatus?.isCancelled || false
      const matchRemainingAmount = matchOrderStatus?.remaining || BigInt(0)
      const matchFilledAmount = BigInt(match.makerAmount) - matchRemainingAmount

      let matchOrderStatusStr: OrderStatus
      if (isMatchCancelled) {
        matchOrderStatusStr = "cancelled"
      } else if (isMatchFilled) {
        matchOrderStatusStr = "filled"
      } else if (matchFilledAmount > BigInt(0)) {
        matchOrderStatusStr = "partially_filled"
      } else {
        matchOrderStatusStr = "pending"
      }

      await db
        .update(ordersTable)
        .set({
          status: matchOrderStatusStr,
          filledAmount: matchFilledAmount.toString(),
          updated_at: new Date(),
        })
        .where(eq(ordersTable.orderHash, match.orderHash))
      const makerPricePerShare =
        match.side === "BUY"
          ? Number(match.makerAmount) / Number(match.takerAmount)
          : Number(match.takerAmount) / Number(match.makerAmount)
      const fillAmount = result.fillAmounts[index]
      const fillAmountDecimal = Number(formatUnits(fillAmount, 6)) // Adjust decimals if needed

      await db.insert(userActivityTable).values({
        user: match.maker as string,
        activityType: match.side as "BUY" | "SELL",
        amount: fillAmountDecimal.toString(),
        marketId: marketId,
        shares:
          correctedOrder.side === Side.BUY
            ? correctedOrder.takerAmount.toString()
            : correctedOrder.makerAmount.toString(),
        transactionHash: txHash,
        tokenId: match.tokenId.toString(),
        pricePerShare: makerPricePerShare.toString(),
        outcomeValue:
          correctedOrder.tokenId.toString() === yesTokenId.toString(),
      })
    })
  )

  await updateMarketVolume(marketId, result.fillMakerUsdc, result.fillTakerUsdc)

  const positionSyncResult = await syncPosition(
    correctedOrder.maker,
    marketId,
    correctedOrder.tokenId.toString(),
    conditionId,
    price
  )

  console.log({ positionSyncResult })
  return NextResponse.json({
    message: "Orders matched successfully",
    // transactionHash: txHash
  })
}

// Modified to correctly calculate fill amounts based on maker assets
function matchOrders(
  takerOrder: { makerAmount: bigint; takerAmount: bigint; side: string },
  potentialMatches: Order[],
  matchType: MatchType
): MatchResult {
  const result: MatchResult = {
    orders: [],
    fillAmounts: [],
    totalFilled: BigInt(0),
    fillMakerUsdc: [],
    fillTakerUsdc: [],
  }

  let remainingAmount = takerOrder.makerAmount

  // Skip if no potential matches
  if (potentialMatches.length === 0) {
    return result
  }

  for (const match of potentialMatches) {
    if (remainingAmount === BigInt(0)) {
      break
    }

    // Check if the orders cross based on match type
    if (!isCrossing(takerOrder, match, matchType)) {
      console.log("Orders don't cross, skipping")
      continue
    }

    // For COMPLEMENTARY matches (BUY vs SELL)
    if (matchType === MatchType.COMPLEMENTARY) {
      if (takerOrder.side === "BUY") {
        // Taker is buying outcome tokens using collateral
        // Calculate how much collateral we're willing to spend
        const matchMakerAmount = BigInt(match.makerAmount) // Outcome tokens the seller is offering
        const matchTakerAmount = BigInt(match.takerAmount) // Collateral the seller wants

        // Calculate price ratio
        const sellerPrice = (matchTakerAmount * ONE) / matchMakerAmount
        const buyerPrice =
          (takerOrder.makerAmount * ONE) / takerOrder.takerAmount

        if (buyerPrice < sellerPrice) {
          console.log("Prices don't cross")
          continue
        }

        // Calculate how much collateral we can spend in this match
        const collateralAvailable = remainingAmount
        const collateralWanted = matchTakerAmount

        let collateralToUse: bigint
        if (collateralAvailable >= collateralWanted) {
          // We can fill the entire sell order
          collateralToUse = collateralWanted
        } else {
          // We can only partially fill the sell order
          collateralToUse = collateralAvailable
        }

        // CRITICAL FIX: For a sell order, the fill amount needs to be in terms of
        // the maker's asset, which is outcome tokens (not collateral)
        const outcomesReceived =
          (collateralToUse * matchMakerAmount) / matchTakerAmount

        // Add to results
        result.fillMakerUsdc.push(BigInt(0))
        result.fillTakerUsdc.push(collateralToUse)
        result.orders.push(match)
        // Use the outcome tokens amount as the fill amount
        result.fillAmounts.push(outcomesReceived)
        result.totalFilled += collateralToUse
        remainingAmount -= collateralToUse
      } else {
        // Taker is selling outcome tokens for collateral
        const matchMakerAmount = BigInt(match.makerAmount) // Collateral the buyer is offering
        const matchTakerAmount = BigInt(match.takerAmount) // Outcome tokens the buyer wants

        // Calculate prices
        const buyerPrice = (matchMakerAmount * ONE) / matchTakerAmount
        const sellerPrice =
          (takerOrder.takerAmount * ONE) / takerOrder.makerAmount

        if (buyerPrice < sellerPrice) {
          console.log("Prices don't cross")
          continue
        }

        // Calculate how many outcome tokens we have left to sell
        const tokensToSell = remainingAmount
        const tokensWanted = matchTakerAmount

        let outcomesToUse: bigint
        let collateralToReceive: bigint

        if (tokensToSell >= tokensWanted) {
          // We can fill the entire buy order
          outcomesToUse = tokensWanted
          collateralToReceive = matchMakerAmount
        } else {
          // We can only partially fill the buy order
          outcomesToUse = tokensToSell
          collateralToReceive =
            (outcomesToUse * matchMakerAmount) / matchTakerAmount
        }

        // For a buy order, the fill amount is the collateral amount
        result.fillMakerUsdc.push(collateralToReceive) // BUY maker: paying stablecoin
        result.fillTakerUsdc.push(BigInt(0))
        result.orders.push(match)
        result.fillAmounts.push(collateralToReceive)
        result.totalFilled += outcomesToUse
        remainingAmount -= outcomesToUse
      }
    }
    // For MINT matches (BUY vs BUY)
    else if (matchType === MatchType.MINT) {
      // Both taker and maker are buying different outcome tokens
      const takerPrice = (takerOrder.makerAmount * ONE) / takerOrder.takerAmount
      const makerPrice =
        (BigInt(match.makerAmount) * ONE) / BigInt(match.takerAmount)

      // Check if the prices sum to at least 1
      if (takerPrice + makerPrice < ONE) {
        console.log("Prices don't cross for MINT")
        continue
      }

      // For MINT operations with two BUY orders:
      // - Each order contributes collateral
      // - The taker order's "making" is its collateral
      // - The maker order's "making" is also its collateral
      // - We need to track how much of the taker's collateral (makerAmount) is being used

      const takerCollateral = remainingAmount
      const makerCollateral = BigInt(match.makerAmount)

      // The fill amount for the maker order is how much collateral it contributes
      let fillAmount: bigint

      if (takerCollateral >= makerCollateral) {
        // Maker contributes less collateral, so we use all of it
        fillAmount = makerCollateral
        // For taker's totalFilled tracking, we use takerCollateral
        result.totalFilled += takerCollateral // This is the key fix
      } else {
        // Taker contributes less collateral, so we use all of it
        fillAmount = takerCollateral
        // Since we're using all of the taker's remaining collateral
        result.totalFilled += takerCollateral
      }

      // For MINT, the fillAmount is how much collateral the maker contributes
      result.fillMakerUsdc.push(makerCollateral)
      result.fillTakerUsdc.push(takerCollateral)
      result.orders.push(match)
      result.fillAmounts.push(fillAmount)
      remainingAmount -= takerCollateral
    }
    // For MERGE matches (SELL vs SELL)
    else if (matchType === MatchType.MERGE) {
      // Both taker and maker are selling complementary outcome tokens
      const takerPrice = (takerOrder.takerAmount * ONE) / takerOrder.makerAmount
      const makerPrice =
        (BigInt(match.takerAmount) * ONE) / BigInt(match.makerAmount)

      // Check if the prices sum to at most 1
      if (takerPrice + makerPrice > ONE) {
        console.log("Prices don't cross for MERGE")
        continue
      }

      // For merging, determine how many outcome tokens each side contributes
      const takerTokens = remainingAmount
      const makerTokens = BigInt(match.makerAmount)

      let fillAmount: bigint
      if (takerTokens >= makerTokens) {
        // Maker contributes fewer outcome tokens, use that amount
        fillAmount = makerTokens
      } else {
        // Taker contributes fewer outcome tokens, use that amount
        fillAmount = takerTokens
      }

      // For MERGE, the fill amount is the amount of outcome tokens contributed
      result.orders.push(match)
      result.fillAmounts.push(fillAmount)
      result.totalFilled += fillAmount
      remainingAmount -= fillAmount
    }
  }

  return result
}

// Check if two orders can be matched based on their prices
function isCrossing(
  takerOrder: { makerAmount: bigint; takerAmount: bigint; side: string },
  makerOrder: Order,
  matchType: MatchType
): boolean {
  console.log({ takerOrder, makerOrder })
  // Calculate normalized prices (scaled by 10^18)
  const takerSide = takerOrder.side
  const makerSide = makerOrder.side

  let takerPrice: bigint
  let makerPrice: bigint

  if (takerSide === "BUY") {
    takerPrice = (takerOrder.makerAmount * ONE) / takerOrder.takerAmount
  } else {
    takerPrice = (takerOrder.takerAmount * ONE) / takerOrder.makerAmount
  }

  if (makerSide === "BUY") {
    makerPrice =
      (BigInt(makerOrder.makerAmount) * ONE) / BigInt(makerOrder.takerAmount)
  } else {
    makerPrice =
      (BigInt(makerOrder.takerAmount) * ONE) / BigInt(makerOrder.makerAmount)
  }
  console.log({ takerPrice, makerPrice, matchType })

  // Different checks based on match type
  if (matchType === MatchType.COMPLEMENTARY) {
    // BUY vs SELL or SELL vs BUY
    if (takerSide === "BUY" && makerSide === "SELL") {
      return takerPrice >= makerPrice
    } else if (takerSide === "SELL" && makerSide === "BUY") {
      return makerPrice >= takerPrice
    }
  } else if (matchType === MatchType.MINT) {
    // Both BUY orders for complementary tokens
    return takerPrice + makerPrice >= ONE
  } else if (matchType === MatchType.MERGE) {
    // Both SELL orders for complementary tokens
    return takerPrice + makerPrice <= ONE
  }

  return false
}

async function updateMarketVolume(
  marketId: string,
  fillMakerUsdc: bigint[],
  fillTakerUsdc: bigint[]
): Promise<void> {
  // 1. Grab current volume from DB
  const [market] = await db
    .select({
      volume: marketsTable.volume,
    })
    .from(marketsTable)
    .where(eq(marketsTable.id, marketId))

  let usdcVolume = BigInt(0)
  for (let i = 0; i < fillMakerUsdc.length; i++) {
    usdcVolume += fillMakerUsdc[i]
    usdcVolume += fillTakerUsdc[i]
  }

  // Convert from Wei to decimal if you use 6 decimals, or adjust for your token
  const volumeToAdd = Number(formatUnits(usdcVolume, 6))

  const currentVolume = market?.volume ? parseFloat(market.volume) : 0
  const newVolume = currentVolume + volumeToAdd

  await db
    .update(marketsTable)
    .set({ volume: newVolume.toString(), updatedAt: new Date() })
    .where(eq(marketsTable.id, marketId))

  console.log(
    `Updated volume for market ${marketId}: +${volumeToAdd} USDC, new total: ${newVolume}`
  )
}
