 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Order, Side } from "@/hooks/use-order-creation"
import { formatUnits } from "viem"
import { FullMarket } from "./create-order"

interface OrderBookProps {
  market: FullMarket
  selectedOutcome: "yes" | "no"
  onOutcomeChange: (outcome: "yes" | "no") => void
  tradeDirection: "buy" | "sell"
  orders: Order[]
  loading: boolean
}

export default function OrderBook({
  market,
  selectedOutcome,
  onOutcomeChange,
  tradeDirection,
  orders,
  loading,
}: OrderBookProps) {


  function formatOrderBookEntry(order: Order) {
    const decimals = 6

    const makerBn = BigInt(order.makerAmount)
    const takerBn = BigInt(order.takerAmount)
    const filledBn = BigInt(order.filledAmount || BigInt(0))

    let leftoverMaker = makerBn
    let leftoverTaker = takerBn

    if (order.side === Side.SELL) {
      leftoverMaker = leftoverMaker - filledBn

      if (makerBn > BigInt(0)) {
        const ratio = (takerBn * BigInt(1000000)) / makerBn
        leftoverTaker = (leftoverMaker * ratio) / BigInt(1000000)
      } else {
        leftoverMaker = BigInt(0)
        leftoverTaker = BigInt(0)
      }
    } else {
      leftoverTaker = leftoverTaker - filledBn

      if (takerBn > BigInt(0)) {
        const ratio = (makerBn * BigInt(1000000)) / takerBn
        leftoverMaker = (leftoverTaker * ratio) / BigInt(1000000)
      } else {
        leftoverMaker = BigInt(0)
        leftoverTaker = BigInt(0)
      }
    }

    if (leftoverMaker <= BigInt(0) || leftoverTaker <= BigInt(0)) {
      return null
    }

    const leftoverMakerNum = Number(formatUnits(leftoverMaker, decimals))
    const leftoverTakerNum = Number(formatUnits(leftoverTaker, decimals))

    let shares: number
    let total: number
    let price: number

    if (order.side === Side.SELL) {
      shares = leftoverMakerNum
      total = leftoverTakerNum
      price = total / shares
    } else {
      shares = leftoverTakerNum
      total = leftoverMakerNum
      price = total / shares
    }

    const priceCents = Math.round(price * 100)

    return {
      price: priceCents,
      shares: shares.toFixed(2),
      total: total.toFixed(2),
      original: order,
    }
  }

  const processOrderBook = () => {
    const currentTokenId =
      selectedOutcome === "yes"
        ? market.yesTokenId.toString()
        : market.noTokenId.toString()

    const tokenOrders = orders.filter(
      (order) => order.tokenId.toString() === currentTokenId
    )
    const sellOrders = tokenOrders.filter(
      (order) => order.side === Side.SELL && !order.filled && !order.cancelled
    )
    const formattedAsks = sellOrders
      .map((order) => formatOrderBookEntry(order))
      .filter((order) => order !== null)
      .sort((a, b) => (a && b ? a.price - b.price : 0))

    const buyOrders = tokenOrders.filter(
      (order) => order.side === Side.BUY && !order.filled && !order.cancelled
    )
    const formattedBids = buyOrders
      .map((order) => formatOrderBookEntry(order))
      .filter((order) => order !== null)
      .sort((a, b) => (a && b ? b.price - a.price : 0))

    const lastPrice = formattedBids[0]?.price || formattedAsks[0]?.price || null
    const spread =
      formattedAsks.length > 0 && formattedBids.length > 0
        ? Math.abs(
            formattedAsks[0] && formattedBids[0]
              ? formattedAsks[0].price - formattedBids[0].price
              : 0
          )
        : null

    return { formattedAsks, formattedBids, lastPrice, spread }
  }

  const { formattedAsks, formattedBids, lastPrice, spread } = processOrderBook()

  const highlightAsks = tradeDirection === "buy"
  const highlightBids = tradeDirection === "sell"

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <CardTitle>Order Book: {market.title}</CardTitle>
        <Tabs
          value={selectedOutcome}
          onValueChange={(value) => onOutcomeChange(value as "yes" | "no")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yes">YES Token</TabsTrigger>
            <TabsTrigger value="no">NO Token</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading order book...</div>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-3 text-sm font-medium border-b pb-2">
              <div>PRICE</div>
              <div className="text-center">SHARES</div>
              <div className="text-right">TOTAL</div>
            </div>

            {/* Sell Orders (Asks) */}
            <div
              className={`rounded-t-md ${
                highlightAsks ? "bg-red-100" : "bg-red-50"
              }`}
            >
              <div className="text-sm font-medium bg-red-100 px-3 py-1 rounded-t-md flex justify-between">
                <span>Asks (Sell Orders)</span>
                {highlightAsks && (
                  <span className="text-red-600 font-bold">← Buy Here</span>
                )}
              </div>
              <div className="overflow-y-auto max-h-40">
                {formattedAsks.length === 0 ? (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    No sell orders
                  </div>
                ) : (
                  formattedAsks.map((order, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-3 text-sm px-3 py-1 border-b  ${
                        highlightAsks && index === 0 ? "bg-red-200" : ""
                      }`}
                    >
                      <div className="text-red-500">{order?.price}¢</div>
                      <div className="text-center">{order?.shares}</div>
                      <div className="text-right">${order?.total}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Spread */}
            <div className="text-center text-sm py-2 bg-gray-100">
              <span>Last: {lastPrice ? `${lastPrice}¢` : "N/A"}</span>
              <span className="mx-4">
                Spread: {spread ? `${spread}¢` : "N/A"}
              </span>
            </div>

            {/* Buy Orders (Bids) */}
            <div
              className={`rounded-b-md ${
                highlightBids ? "bg-green-100" : "bg-green-50"
              }`}
            >
              <div className="text-sm font-medium bg-green-100 px-3 py-1 flex justify-between">
                <span>Bids (Buy Orders)</span>
                {highlightBids && (
                  <span className="text-green-600 font-bold">← Sell Here</span>
                )}
              </div>
              <div className="overflow-y-auto max-h-40">
                {formattedBids.length === 0 ? (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    No buy orders
                  </div>
                ) : (
                  formattedBids.map((order, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-3 text-sm px-3 py-1 border-b  ${
                        highlightBids && index === 0 ? "bg-green-200" : ""
                      }`}
                    >
                      <div className="text-green-500">{order?.price}¢</div>
                      <div className="text-center">{order?.shares}</div>
                      <div className="text-right">${order?.total}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {/* Add instruction for user */}
        <div className="mt-4 text-sm text-center text-gray-500">
          {tradeDirection === "buy"
            ? "Your buy order will match with the lowest ask price"
            : "Your sell order will match with the highest bid price"}
        </div>
      </CardContent>
    </Card>
  )
}
