import { db } from "@/lib/db/client"
import { marketsTable, ordersTable } from "@/lib/db/schema"
import { formatUnits } from "viem"
import { and, eq, or } from "drizzle-orm"

export interface OrderBookEntry {
  price: string
  size: string
}

export interface AugmentedOrder extends OrderBookEntry {
  side: "BID" | "ASK"
  token: "YES" | "NO"
}

export interface CumulativeOrderRow {
  price: number
  shares: number
  total: number
}

export interface SplitOrderBook {
  yesAsks: CumulativeOrderRow[]
  yesBids: CumulativeOrderRow[]
  noAsks: CumulativeOrderRow[]
  noBids: CumulativeOrderRow[]
}

export interface MarketOrderbookData {
  yesTokenId: string | null
  bestPrices: {
    yesBestBid: number | null
    noBestBid: number | null
    noBestAsk: number | null
    yesBestAsk: number | null
  }
  orderbook: SplitOrderBook | null
}

export async function getMarketOrderbookData(
  marketId: string
): Promise<MarketOrderbookData> {
  try {
    const [market] = await db
      .select({ yesTokenId: marketsTable.yesTokenId })
      .from(marketsTable)
      .where(
        and(eq(marketsTable.id, marketId), eq(marketsTable.type, "single"))
      )

    if (!market?.yesTokenId) {
      console.error(`Market ${marketId} not found or no YES token ID`)
      return {
        yesTokenId: null,
        bestPrices: {
          yesBestBid: 0.5,
          noBestBid: 0.5,
          yesBestAsk: 0.5,
          noBestAsk: 0.5,
        },
        orderbook: null,
      }
    }

    const yesTokenId = market.yesTokenId

    const orders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.marketId, marketId),
          or(
            eq(ordersTable.status, "pending"),
            eq(ordersTable.status, "partially_filled")
          )
        )
      )

    if (orders.length === 0) {
      return {
        yesTokenId,
        bestPrices: {
          yesBestBid: 0.5,
          noBestBid: 0.5,
          yesBestAsk: 0.5,
          noBestAsk: 0.5,
        },
        orderbook: null,
      }
    }

    const bidMap: Map<string, bigint> = new Map()
    const askMap: Map<string, bigint> = new Map()

    for (const order of orders) {
      const filledAmount = BigInt(order.filledAmount || 0)
      const isCurrentToken = order.tokenId === yesTokenId.toString()

      let remainingAmount: bigint | number
      let price: number
      let priceKey: string

      if (order.side === "BUY") {
        price = Number(order.makerAmount) / Number(order.takerAmount)
        remainingAmount = Math.floor(
          (Number(order.makerAmount) - Number(filledAmount)) / price
        )
        remainingAmount = BigInt(remainingAmount)
        if (remainingAmount <= BigInt(0)) continue
        if (!isCurrentToken) price = 1 - price
        priceKey = price.toFixed(2)
        const current = bidMap.get(priceKey) || BigInt(0)
        if (isCurrentToken) {
          bidMap.set(priceKey, current + remainingAmount)
        } else {
          askMap.set(priceKey, current + remainingAmount)
        }
      } else {
        remainingAmount = BigInt(order.makerAmount) - filledAmount
        if (remainingAmount <= BigInt(0)) continue

        price = Number(order.takerAmount) / Number(order.makerAmount)
        if (!isCurrentToken) price = 1 - price
        priceKey = price.toFixed(2)

        const current = isCurrentToken
          ? askMap.get(priceKey) || BigInt(0)
          : bidMap.get(priceKey) || BigInt(0)

        if (isCurrentToken) {
          askMap.set(priceKey, current + remainingAmount)
        } else {
          bidMap.set(priceKey, current + remainingAmount)
        }
      }
    }

    const bids: OrderBookEntry[] = Array.from(bidMap).map(([price, size]) => ({
      price,
      size: parseFloat(formatUnits(size, 6)).toFixed(2),
    }))

    const asks: OrderBookEntry[] = Array.from(askMap).map(([price, size]) => ({
      price,
      size: parseFloat(formatUnits(size, 6)).toFixed(2),
    }))

    const splitOrderBook = splitOrderBookTables(
      bids,
      asks,
      yesTokenId.toString(),
      yesTokenId.toString()
    )

    const bestPrices = {
      yesBestBid: getBestPrice(splitOrderBook.yesBids, "BID"),
      yesBestAsk: getBestPrice(splitOrderBook.yesAsks, "ASK"),
      noBestBid: getBestPrice(splitOrderBook.noBids, "BID"),
      noBestAsk: getBestPrice(splitOrderBook.noAsks, "ASK"),
    }

    return {
      yesTokenId,
      bestPrices,
      orderbook: splitOrderBook,
    }
  } catch (error) {
    console.error(`Error for market ${marketId}`, error)
    return {
      yesTokenId: null,
      bestPrices: {
        yesBestBid: 0.5,
        noBestBid: 0.5,
        yesBestAsk: 0.5,
        noBestAsk: 0.5,
      },
      orderbook: null,
    }
  }
}

export function splitOrderBookTables(
  bids: OrderBookEntry[],
  asks: OrderBookEntry[],
  yesTokenId: string,
  currentTokenId: string
): SplitOrderBook {
  const isYesToken = currentTokenId === yesTokenId
  const toCents = (p: number): number => Math.round(p * 100)

  function calcCumulativeTotal(rows: AugmentedOrder[]): CumulativeOrderRow[] {
    let total = 0
    const result: CumulativeOrderRow[] = []
    for (const row of rows) {
      const price = parseFloat(row.price)
      const shares = parseFloat(row.size)
      total += price * shares
      result.push({
        price: toCents(price),
        shares,
        total: parseFloat(total.toFixed(2)),
      })
    }
    return result
  }

  const invert = (p: string): string => (1 - parseFloat(p)).toFixed(6)

  const yesBidsRaw: AugmentedOrder[] = isYesToken
    ? bids.map((b) => ({ ...b, side: "BID", token: "YES" }))
    : asks.map((a) => ({ ...a, side: "ASK", token: "YES" }))

  const yesAsksRaw: AugmentedOrder[] = isYesToken
    ? asks.map((a) => ({ ...a, side: "ASK", token: "YES" }))
    : bids.map((b) => ({ ...b, side: "BID", token: "YES" }))

  const noBidsRaw: AugmentedOrder[] = isYesToken
    ? asks.map((a) => ({
        price: invert(a.price),
        size: a.size,
        side: "BID",
        token: "NO",
      }))
    : bids.map((b) => ({
        price: invert(b.price),
        size: b.size,
        side: "ASK",
        token: "NO",
      }))

  const noAsksRaw: AugmentedOrder[] = isYesToken
    ? bids.map((b) => ({
        price: invert(b.price),
        size: b.size,
        side: "ASK",
        token: "NO",
      }))
    : asks.map((a) => ({
        price: invert(a.price),
        size: a.size,
        side: "BID",
        token: "NO",
      }))

  const sortAsc = (arr: AugmentedOrder[]) =>
    [...arr].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))

  const sortDesc = (arr: AugmentedOrder[]) =>
    [...arr].sort((a, b) => parseFloat(b.price) - parseFloat(a.price))

  return {
    yesAsks: calcCumulativeTotal(sortAsc(yesAsksRaw)).reverse(),
    yesBids: calcCumulativeTotal(sortDesc(yesBidsRaw)),
    noAsks: calcCumulativeTotal(sortAsc(noAsksRaw)).reverse(),
    noBids: calcCumulativeTotal(sortDesc(noBidsRaw)),
  }
}

export function getBestPrice(
  rows: CumulativeOrderRow[],
  type: "ASK" | "BID"
): number | null {
  if (!rows || rows.length === 0) return null
  return type === "ASK"
    ? rows[rows.length - 1]?.price / 100
    : rows[0]?.price / 100
}
