import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { marketCreatorContract } from "@/contracts/data/market-creator"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db/client"
import {
  marketsTable,
  ordersTable,
  OrderStatus,
  priceHistoryTable,
  transactionsTable,
  userActivityTable,
} from "@/lib/db/schema"
import { normalizeOrderForHashing } from "@/lib/order/hash-order"
import { validateOrderSignature } from "@/lib/order/validation"
import { syncPosition } from "@/lib/user/sync-position"
import { privateClient } from "@/lib/wallet/private-client"
import { publicClient } from "@/lib/wallet/public-client"
import { and, eq, not, or, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { formatUnits } from "viem"

// Calculate price from order parameters
function calculatePrice(order: any, isRatio = false): number {
  if (order.side === "BUY" || order.side === 0) {
    return isRatio
      ? Number(order.makerAmount) / Number(order.takerAmount)
      : Number(order.makerAmount) / Number(order.takerAmount)
  } else {
    return isRatio
      ? Number(order.takerAmount) / Number(order.makerAmount)
      : Number(order.takerAmount) / Number(order.makerAmount)
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const body = await req.json()
    const { order, signature, marketId, conditionId, price } = body

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

    // Get market token IDs
    const marketData = await publicClient.readContract({
      address: marketCreatorContract.address,
      abi: marketCreatorContract.abi,
      functionName: "getMarketDataByQuestion",
      args: [marketId],
    })

    const [, yesTokenId, noTokenId] = marketData as [string, bigint, bigint]

    const tokenId = order.tokenId.toString()
    if (tokenId !== yesTokenId.toString() && tokenId !== noTokenId.toString()) {
      return NextResponse.json(
        { error: "Token ID does not belong to this market" },
        { status: 400 }
      )
    }

    // Get complementary token ID
    const complementTokenId =
      tokenId === yesTokenId.toString()
        ? noTokenId.toString()
        : yesTokenId.toString()

    const correctedOrder = normalizeOrderForHashing({
      ...order,
      signature,
    })
    console.log({ correctedOrder })
    // Get the order hash from the contract
    const orderHash = await publicClient.readContract({
      address: ctfExchangeContract.address,
      abi: ctfExchangeContract.abi,
      functionName: "hashOrder",
      args: [correctedOrder],
    })

    // Store the order in the database
    const side = correctedOrder.side === 0 ? "BUY" : "SELL"

    await db.insert(ordersTable).values({
      orderHash: orderHash as any,
      salt: correctedOrder.salt.toString(),
      maker: correctedOrder.maker,
      signer: correctedOrder.signer,
      marketId: marketId,
      side,
      tokenId: tokenId,
      makerAmount: correctedOrder.makerAmount.toString(),
      takerAmount: correctedOrder.takerAmount.toString(),
      signature: signature,
      status: "pending",
      tokensTransferred: false,
      tokensReturned: false,
      orderType: "limit",
      expiration: correctedOrder.expiration.toString(),
      created_at: new Date(),
      updated_at: new Date(),
    })

    // Find matching orders based on price criteria
    const potentialMatches = await findPotentialMatches(
      correctedOrder,
      marketId,
      tokenId,
      complementTokenId,
      orderHash as string
    )

    if (potentialMatches.length === 0) {
      // No matching orders, just return success
      return NextResponse.json({
        success: true,
        orderHash,
        marketId,
        matchingOrderHashes: [],
      })
    }

    // Process matches in the best order for execution
    const matchResult = await processMatches(
      correctedOrder,
      signature,
      potentialMatches,
      marketId,
      yesTokenId.toString()
    )

    await syncPosition(
      correctedOrder.maker,
      marketId,
      correctedOrder.tokenId.toString(),
      conditionId,
      price
    )

    // Return the result
    return NextResponse.json({
      success: true,
      orderHash,
      marketId,
      matchingOrderHashes: matchResult.matchedOrderHashes,
      txHash: matchResult.txHash,
    })
  } catch (error) {
    console.error("Error processing limit order:", error)
    return NextResponse.json(
      {
        error: "Failed to process limit order",
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

async function findPotentialMatches(
  order: any,
  marketId: string,
  tokenId: string,
  complementTokenId: string,
  orderHash: string
): Promise<any[]> {
  const side = order.side === 0 ? "BUY" : "SELL"
  const matchSide = side === "BUY" ? "SELL" : "BUY"
  const takerPrice = calculatePrice(order)

  // Determine price sorting and filtering based on side
  let orderExpression
  let priceFilter

  if (side === "BUY") {
    // For buy orders, find sell orders with price <= taker price, sorted by lowest price first
    orderExpression = sql`CAST(orders."taker_amount" AS DECIMAL) / CAST(orders."maker_amount" AS DECIMAL) ASC`
    priceFilter = sql`CAST(orders."taker_amount" AS DECIMAL) / CAST(orders."maker_amount" AS DECIMAL) <= ${takerPrice}`
  } else {
    // For sell orders, find buy orders with price >= taker price, sorted by highest price first
    orderExpression = sql`CAST(orders."maker_amount" AS DECIMAL) / CAST(orders."taker_amount" AS DECIMAL) DESC`
    priceFilter = sql`CAST(orders."maker_amount" AS DECIMAL) / CAST(orders."taker_amount" AS DECIMAL) >= ${takerPrice}`
  }

  // Find direct token matches (offers with same token ID)
  const directMatches = await db
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
        not(eq(ordersTable.orderHash, orderHash)),
        priceFilter
      )
    )
    .orderBy(orderExpression)

  // Find complementary token matches (same side, complementary token ID)
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
        eq(ordersTable.side, side), // Same side for complementary tokens
        eq(ordersTable.tokenId, complementTokenId),
        not(eq(ordersTable.orderHash, orderHash))
      )
    )

  // Filter complementary matches by valid price combinations
  const validComplementaryMatches = complementaryMatches.filter((match) => {
    // For buy-buy or sell-sell combinations, check combined price
    const matchPrice = calculatePrice(match)

    if (side === "BUY") {
      // For BUY-BUY (complementary tokens), sum of prices should be >= 1
      return takerPrice + matchPrice >= 1
    } else {
      // For SELL-SELL (complementary tokens), sum of prices should be <= 1
      return takerPrice + matchPrice <= 1
    }
  })

  // Combine all valid matches
  const allMatches = [...directMatches, ...validComplementaryMatches]

  // Sort all matches by price advantage for execution
  allMatches.sort((a, b) => {
    const priceA = calculatePrice(a)
    const priceB = calculatePrice(b)

    if (side === "BUY") {
      // For buy orders, prefer lower sell prices first
      if (a.side === "SELL" && b.side === "SELL") {
        return priceA - priceB
      }
      // Complementary buy orders come after direct matches
      if (a.side === "SELL" && b.side === "BUY") return -1
      if (a.side === "BUY" && b.side === "SELL") return 1

      // For complementary buys, prefer higher prices
      return priceB - priceA
    } else {
      // For sell orders, prefer higher buy prices first
      if (a.side === "BUY" && b.side === "BUY") {
        return priceB - priceA
      }
      // Complementary sell orders come after direct matches
      if (a.side === "BUY" && b.side === "SELL") return -1
      if (a.side === "SELL" && b.side === "BUY") return 1

      // For complementary sells, prefer lower prices
      return priceA - priceB
    }
  })

  return allMatches
}

async function processMatches(
  takerOrder: any,
  signature: string,
  matchingOrders: any[],
  marketId: string,
  yesTokenId: string
): Promise<{ txHash: `0x${string}` | null; matchedOrderHashes: string[] }> {
  if (matchingOrders.length === 0) {
    return { txHash: null, matchedOrderHashes: [] }
  }

  try {
    // Format the taker order for blockchain
    const takerOrderChain = {
      salt: takerOrder.salt,
      maker: takerOrder.maker,
      signer: takerOrder.signer,
      taker: takerOrder.taker,
      tokenId: takerOrder.tokenId,
      makerAmount: takerOrder.makerAmount,
      takerAmount: takerOrder.takerAmount,
      expiration: takerOrder.expiration,
      nonce: takerOrder.nonce,
      feeRateBps: takerOrder.feeRateBps,
      side: takerOrder.side,
      signatureType: takerOrder.signatureType,
      signature: signature,
    }
    // Calculate how much of the taker order we can fill
    const {
      makerOrdersChain,
      fillAmounts,
      totalFill,
      fillMakerUsdc,
      fillTakerUsdc,
    } = calculateMatchFills(takerOrder, matchingOrders)

    if (totalFill <= BigInt(0) || makerOrdersChain.length === 0) {
      return { txHash: null, matchedOrderHashes: [] }
    }
    console.log({ takerOrderChain, makerOrdersChain })
    // Execute the match transaction on-chain
    const txHash = await privateClient.writeContract({
      address: ctfExchangeContract.address,
      abi: ctfExchangeContract.abi,
      functionName: "matchOrders",
      args: [takerOrderChain, makerOrdersChain, totalFill, fillAmounts],
      gas: BigInt(3000000),
    })

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    })
    console.log({ receipt })
    if (receipt.status === "reverted") {
      throw new Error("Transaction reverted on-chain")
    }

    // Update the database with the fill information
    await updateOrderStatuses(
      takerOrder,
      matchingOrders,
      fillAmounts,
      txHash,
      totalFill,
      marketId,
      yesTokenId
    )

    await updateMarketVolume(marketId, fillMakerUsdc, fillTakerUsdc)

    // Record price history
    await recordPriceHistory(takerOrder, matchingOrders, marketId)

    return {
      txHash,
      matchedOrderHashes: matchingOrders.map((order) => order.orderHash),
    }
  } catch (error) {
    console.error("Error executing matches:", error)
    throw error
  }
}

function calculateMatchFills(
  takerOrder: any,
  matchingOrders: any[]
): {
  makerOrdersChain: any[]
  fillAmounts: bigint[]
  totalFill: bigint
  fillMakerUsdc: bigint[]
  fillTakerUsdc: bigint[]
} {
  const makerOrdersChain: any[] = []
  const fillAmounts: bigint[] = []
  const fillMakerUsdc: bigint[] = []
  const fillTakerUsdc: bigint[] = []
  // Calculate how much of the taker order can be filled
  const takerOrderSide = takerOrder.side === 0 ? "BUY" : "SELL"
  const takerMakerAmountBigInt = BigInt(takerOrder.makerAmount)
  const takerTakerAmountBigInt = BigInt(takerOrder.takerAmount)

  // For BUY orders, this is USDC to spend; For SELL orders, this is tokens to sell
  let remainingToFill = takerMakerAmountBigInt

  // Keep track of the taker's total fill amount
  let totalFill = BigInt(0)

  for (const matchOrder of matchingOrders) {
    if (remainingToFill <= BigInt(0)) break

    const matchSide = matchOrder.side === "BUY" ? "BUY" : "SELL"
    const isDirectMatch = takerOrderSide !== matchSide
    const matchMakerAmountBigInt = BigInt(matchOrder.makerAmount)
    const matchTakerAmountBigInt = BigInt(matchOrder.takerAmount)
    const matchFilledAmount = matchOrder.filledAmount
      ? BigInt(matchOrder.filledAmount)
      : BigInt(0)

    // Calculate available amount in the match order (in terms of maker asset)
    const availableInMatch = matchMakerAmountBigInt - matchFilledAmount

    if (availableInMatch <= BigInt(0)) {
      continue
    }

    let takerFillAmount: bigint // How much the taker will fill (in taker's maker asset)
    let makerFillAmount: bigint // How much the maker will fill (in maker's maker asset)

    if (isDirectMatch) {
      // Direct match (BUY vs SELL or SELL vs BUY)
      if (takerOrderSide === "BUY") {
        // Taker BUY vs Maker SELL
        // Taker asset: USDC (makerAmount), Maker asset: Tokens (makerAmount)

        // Calculate how many tokens the maker is offering
        const tokensOffered = availableInMatch // Maker's available tokens

        // Calculate how much USDC the taker would need to spend for these tokens
        const usdcNeeded =
          (tokensOffered * takerMakerAmountBigInt) / takerTakerAmountBigInt

        if (remainingToFill >= usdcNeeded) {
          // Taker can fill all of maker's available tokens
          takerFillAmount = usdcNeeded
          makerFillAmount = tokensOffered
        } else {
          // Taker can only partially fill
          takerFillAmount = remainingToFill
          makerFillAmount =
            (takerFillAmount * takerTakerAmountBigInt) / takerMakerAmountBigInt
        }
        fillTakerUsdc.push(takerFillAmount)
        fillMakerUsdc.push(BigInt(0))
      } else {
        // Taker SELL vs Maker BUY
        // Taker asset: Tokens (makerAmount), Maker asset: USDC (makerAmount)

        // Calculate how many tokens the maker wants
        const tokensWanted = matchTakerAmountBigInt

        if (remainingToFill >= tokensWanted) {
          // Taker can fulfill all of maker's token demand
          takerFillAmount = tokensWanted
          makerFillAmount = availableInMatch // Maker's available USDC
        } else {
          // Taker can only partially fill
          takerFillAmount = remainingToFill
          // Calculate how much USDC the maker should pay for this many tokens
          makerFillAmount =
            (takerFillAmount * matchMakerAmountBigInt) / matchTakerAmountBigInt
        }
        fillMakerUsdc.push(makerFillAmount)
        fillTakerUsdc.push(BigInt(0))
      }
    } else {
      // Complementary match (same sides with complementary tokens)
      // This is more complex and depends on the specific implementation

      if (takerOrderSide === "BUY") {
        // Replace this section:
        // Taker BUY YES + Maker BUY NO (MINT operation)
        // Calculate the "exchange rate" between collateral and tokens for both sides
        const takerRate =
          Number(takerOrder.makerAmount) / Number(takerOrder.takerAmount)
        const makerRate =
          Number(matchOrder.makerAmount) / Number(matchOrder.takerAmount)

        // Calculate the maximum amount of complete sets we can create
        const maxSetsFromTaker = Number(remainingToFill) / takerRate
        const maxSetsFromMaker = Number(availableInMatch) / makerRate

        // Use the limiting factor
        const setsToCreate = Math.min(maxSetsFromTaker, maxSetsFromMaker)

        // Calculate how much collateral each side contributes
        takerFillAmount = BigInt(Math.floor(setsToCreate * takerRate))
        makerFillAmount = BigInt(Math.floor(setsToCreate * makerRate))
        fillMakerUsdc.push(makerFillAmount)
        fillTakerUsdc.push(takerFillAmount)
      } else {
        // Taker SELL YES + Maker SELL NO (MERGE operation)
        // Both sides contribute tokens (makerAmount)
        const takerContribution = remainingToFill
        const makerContribution = availableInMatch

        // Use the minimum for a balanced operation
        if (takerContribution <= makerContribution) {
          takerFillAmount = takerContribution
          makerFillAmount = takerContribution
        } else {
          takerFillAmount = makerContribution
          makerFillAmount = makerContribution
        }
      }
    }

    if (makerFillAmount <= BigInt(0) || takerFillAmount <= BigInt(0)) {
      continue
    }

    // Format the maker order for blockchain
    const makerOrderChain = normalizeOrderForHashing(matchOrder)

    makerOrdersChain.push(makerOrderChain)
    fillAmounts.push(makerFillAmount)

    // Update remaining amount to fill
    remainingToFill -= takerFillAmount
    totalFill += takerFillAmount
  }

  return {
    makerOrdersChain,
    fillAmounts,
    totalFill,
    fillMakerUsdc,
    fillTakerUsdc,
  }
}

async function updateOrderStatuses(
  takerOrder: any,
  matchingOrders: any[],
  fillAmounts: bigint[],
  txHash: `0x${string}`,
  totalFill: bigint,
  marketId: string,
  yesTokenId: string
): Promise<void> {
  try {
    // Instead of using our calculated values, get the real status from the blockchain
    // 1. Get taker order status from blockchain
    const takerOrderHash = await publicClient.readContract({
      address: ctfExchangeContract.address,
      abi: ctfExchangeContract.abi,
      functionName: "hashOrder",
      args: [takerOrder],
    })

    const takerOrderStatus = (await publicClient.readContract({
      address: ctfExchangeContract.address,
      abi: ctfExchangeContract.abi,
      functionName: "getOrderStatus",
      args: [takerOrderHash],
    })) as any

    // Use the revised OrderStatus struct
    const isTakerFilled = takerOrderStatus?.isFilled || false
    const isTakerCancelled = takerOrderStatus?.isCancelled || false
    const takerRemainingAmount = takerOrderStatus?.remaining || BigInt(0)
    const takerFilledAmount =
      BigInt(takerOrder.makerAmount) - takerRemainingAmount

    // Determine the proper status
    let takerOrderStatusStr: OrderStatus
    if (isTakerCancelled) {
      takerOrderStatusStr = "cancelled"
    } else if (isTakerFilled) {
      takerOrderStatusStr = "filled"
    } else if (takerFilledAmount > BigInt(0)) {
      takerOrderStatusStr = "partially_filled"
    } else {
      takerOrderStatusStr = "pending"
    }

    // Update taker order status
    await db
      .update(ordersTable)
      .set({
        status: takerOrderStatusStr,
        filledAmount: takerFilledAmount.toString(),
        updated_at: new Date(),
      })
      .where(eq(ordersTable.orderHash, takerOrderHash as string))

    if (takerFilledAmount > BigInt(0)) {
      const takerSide = takerOrder.side === 0 ? "BUY" : "SELL"

      // Calculate price per share
      const takerPrice = calculatePrice(takerOrder)

      // Convert from Wei to decimal based on your token's decimals
      const takerAmountDecimal = Number(formatUnits(takerFilledAmount, 6)) // Adjust decimals if needed

      await db.insert(userActivityTable).values({
        user: takerOrder.maker,
        activityType: takerSide,
        amount: takerAmountDecimal.toString(),
        marketId: marketId,
        shares:
          takerSide === "BUY"
            ? (
                (BigInt(takerOrder.takerAmount) * takerFilledAmount) /
                BigInt(takerOrder.makerAmount)
              ).toString()
            : takerFilledAmount.toString(),
        transactionHash: txHash,
        tokenId: takerOrder.tokenId.toString(),
        pricePerShare: takerPrice.toString(),
        outcomeValue: takerOrder.tokenId.toString() === yesTokenId.toString(),
      })
    }

    // 2. Update maker orders' statuses
    for (let i = 0; i < matchingOrders.length; i++) {
      if (i >= fillAmounts.length) break

      const matchOrder = matchingOrders[i]
      const fillAmount = fillAmounts[i]

      if (fillAmount <= BigInt(0)) continue

      // Get real on-chain status
      const makerOrderStatus = (await publicClient.readContract({
        address: ctfExchangeContract.address,
        abi: ctfExchangeContract.abi,
        functionName: "getOrderStatus",
        args: [matchOrder.orderHash],
      })) as any

      // Use the revised OrderStatus struct
      const isMatchFilled = makerOrderStatus?.isFilled || false
      const isMatchCancelled = makerOrderStatus?.isCancelled || false
      const matchRemainingAmount = makerOrderStatus?.remaining || BigInt(0)
      const matchFilledAmount =
        BigInt(matchOrder.makerAmount) - matchRemainingAmount

      // Determine the proper status
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
        .where(eq(ordersTable.orderHash, matchOrder.orderHash))
      if (matchFilledAmount > BigInt(0)) {
        const makerSide = matchOrder.side
        // Calculate price per share for the maker
        const makerPrice = calculatePrice(matchOrder)

        // Convert from Wei to decimal based on token decimals
        const makerAmountDecimal = Number(formatUnits(fillAmount, 6)) // Adjust decimals if needed

        // Record maker's activity
        await db.insert(userActivityTable).values({
          user: matchOrder.maker,
          marketId: marketId,
          activityType: matchOrder.side as "BUY" | "SELL",
          shares:
            makerSide === "BUY"
              ? (
                  (BigInt(matchOrder.takerAmount) * fillAmount) /
                  BigInt(matchOrder.makerAmount)
                ).toString()
              : fillAmount.toString(),
          amount: makerAmountDecimal.toString(),
          pricePerShare: makerPrice.toString(),
          tokenId: matchOrder.tokenId.toString(),
          transactionHash: txHash,
          outcomeValue: matchOrder.tokenId.toString() === yesTokenId.toString(),
        })
      }
    }

    // 3. Add transaction record
    await db.insert(transactionsTable).values({
      type: "order_fill",
      status: "success",
      txHash,
      details: {
        orderHash: takerOrderHash,
        matchCount: matchingOrders.length,
        totalFill: totalFill.toString(),
      },
      tokenId: takerOrder.tokenId.toString(),
      userAddress: takerOrder.maker,
      created_at: new Date(),
      updated_at: new Date(),
    })
  } catch (error) {
    console.error("Error updating order statuses:", error)
    throw error
  }
}

async function recordPriceHistory(
  takerOrder: any,
  matchingOrders: any[],
  marketId: string
): Promise<void> {
  try {
    if (matchingOrders.length === 0) return

    const takerSide = takerOrder.side === 0 ? "BUY" : "SELL"

    // Calculate execution price based on order side
    const executionPrice =
      takerSide === "BUY"
        ? (
            Number(takerOrder.makerAmount) / Number(takerOrder.takerAmount)
          ).toString()
        : (
            Number(takerOrder.takerAmount) / Number(takerOrder.makerAmount)
          ).toString()

    // Record price history entry
    await db.insert(priceHistoryTable).values({
      marketId,
      tokenId: takerOrder.tokenId.toString(),
      price: executionPrice,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("Error recording price history:", error)
    // Don't throw here to avoid failing the entire transaction
  }
}

async function updateMarketVolume(
  marketId: string,
  fillMakerUsdc: bigint[],
  fillTakerUsdc: bigint[]
): Promise<void> {
  try {
    // Get current volume
    const [market] = await db
      .select({
        volume: marketsTable.volume,
      })
      .from(marketsTable)
      .where(eq(marketsTable.id, marketId))

    let usdcVolume = BigInt(0)

    for (let i = 0; i < fillMakerUsdc.length; i++) {
      // maker USDC + taker USDC for that fill
      usdcVolume += fillMakerUsdc[i]
      usdcVolume += fillTakerUsdc[i]
    }

    // Convert to decimal string with up to 6 decimal places (USDC format)
    const volumeToAdd = Number(formatUnits(usdcVolume, 6))

    // Calculate the new volume
    const currentVolume = market?.volume ? parseFloat(market.volume) : 0
    const newVolume = currentVolume + volumeToAdd

    // Update the market volume
    await db
      .update(marketsTable)
      .set({
        volume: newVolume.toString(),
        updatedAt: new Date(),
      })
      .where(eq(marketsTable.id, marketId))

    console.log(
      `Updated volume for market ${marketId}: +${volumeToAdd} USDC, new total: ${newVolume}`
    )
  } catch (error) {
    console.error("Error updating market volume:", error)
    // Don't throw to avoid disrupting the main transaction flow
  }
}
