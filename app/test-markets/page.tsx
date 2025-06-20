 
"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGaslessTransactions } from "@/hooks/use-gasless-client"
import { useMarkets } from "@/hooks/use-markets"
import { Order, Side } from "@/hooks/use-order-creation"
import { useOrderMatching } from "@/hooks/use-order-matching"
import { FEE_RATE_BPS } from "@/lib/config"
import { useEffect, useState } from "react"
import CreateOrderComponent from "./components/create-order"
import OrderBook from "./components/order-book"
import ResolveMarket from "./components/resolve-market"
import PredictionMarketForm from "./create-form/prediction-market-form"

export default function MarketsPage() {
  const [selectedOutcome, setSelectedOutcome] = useState<"yes" | "no">("yes")
  const [tradeDirection, setTradeDirection] = useState<"buy" | "sell">("buy")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { createWallet } = useGaslessTransactions()
  const [activeTab, setActiveTab] = useState("markets")
  const [selectedMarket, setSelectedMarket] = useState<any>(null)
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error" | "info"
  } | null>(null)
  const [isCreatingMarket, setIsCreatingMarket] = useState(false)
  const { markets, isLoading: isLoadingMarkets } = useMarkets()
  const { fetchOrders } = useOrderMatching()

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleSelectMarket = (market: any) => {
    setSelectedMarket(market)
    setActiveTab("trading")
  }

  const handleOrderCreated = (order: Order) => {
    console.log({ order })
    fetchOrders()
    showNotification("Order created and added to the order book!", "success")
  }

  // const handleMarketCreated = (marketData: any) => {
  //   // Market creation is now complete with liquidity
  //   setIsCreatingMarket(false)
  //   showNotification(
  //     `Market "${marketData.title}" created successfully with initial liquidity!`,
  //     "success"
  //   )
  //   setActiveTab("markets")
  //   refreshMarkets()
  // }

  const handleStartMarketCreation = () => {
    setIsCreatingMarket(true)
    setActiveTab("create")
  }

  const handleOutcomeChange = (outcome: "yes" | "no") => {
    setSelectedOutcome(outcome)
  }

  const handleDirectionChange = (direction: "buy" | "sell") => {
    setTradeDirection(direction)
  }

  useEffect(() => {
    async function fetchOrders() {
      if (!selectedMarket) return
      try {
        setLoading(true)
        const response = await fetch(
          `/api/orders/market-orders?marketId=${selectedMarket.id}`
        )
        const data = await response.json()

        const marketOrders = data.orders
          .filter(
            (order: any) =>
              order.tokenId === selectedMarket.yesTokenId.toString() ||
              order.tokenId === selectedMarket.noTokenId.toString()
          )
          .map((order: any) => ({
            salt: BigInt(1),
            maker: order.userId as `0x${string}`,
            signer: order.userId as `0x${string}`,
            taker:
              "0x0000000000000000000000000000000000000000" as `0x${string}`,
            tokenId: BigInt(order.tokenId),
            makerAmount: BigInt(order.makerAmount),
            takerAmount: BigInt(order.takerAmount),
            filledAmount: BigInt(order.filledAmount || BigInt(0)),
            expiration: BigInt(Math.floor(Date.now() / 1000) + 86400),
            nonce: BigInt(0),
            feeRateBps: BigInt(FEE_RATE_BPS),
            side: order.side === "BUY" ? Side.BUY : Side.SELL,
            signatureType: 0,
            signature: order.signature as `0x${string}`,
            orderHash: order.orderHash,
            filled: order.status === "filled",
            cancelled: order.status === "cancelled",
          }))

        setOrders(marketOrders)
      } catch (error) {
        console.error("Error fetching market orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [selectedMarket])

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prediction Markets</h1>
      </header>

      {notification && (
        <Alert
          className={`mb-4 ${
            notification.type === "error"
              ? "bg-red-50 text-red-600"
              : notification.type === "success"
              ? "bg-green-50 text-green-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          <AlertTitle>
            {notification.type === "error"
              ? "Error"
              : notification.type === "success"
              ? "Success"
              : "Info"}
          </AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {!true ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-4">
              Please connect your wallet to use the application
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="trading" disabled={!selectedMarket}>
              Trading
            </TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="space-y-4">
            {/* Market Creation Button */}
            <div className="flex justify-end gap-4 mb-4">
              <Button onClick={handleStartMarketCreation}>
                + Create New Market
              </Button>
              <Button onClick={createWallet}>Create Wallet</Button>
            </div>

            {/* Market List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingMarkets ? (
                <div className="col-span-full text-center py-8">
                  Loading markets...
                </div>
              ) : markets.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  No markets found. Create one to get started!
                </div>
              ) : (
                markets.map((market) => (
                  <Card
                    key={market.conditionId}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectMarket(market)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {market.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          {market.resolved ? (
                            <span className="text-green-600 font-medium">
                              Resolved
                            </span>
                          ) : (
                            <span className="text-blue-600 font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectMarket(market)
                          }}
                        >
                          Trade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trading" className="space-y-4">
            {selectedMarket ? (
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CreateOrderComponent
                    market={selectedMarket}
                    onOrderCreated={handleOrderCreated}
                    selectedOutcome={selectedOutcome}
                    onOutcomeChange={handleOutcomeChange}
                    tradeDirection={tradeDirection}
                    onDirectionChange={handleDirectionChange}
                    orders={orders}
                  />
                  <OrderBook
                    market={selectedMarket}
                    selectedOutcome={selectedOutcome}
                    onOutcomeChange={handleOutcomeChange}
                    tradeDirection={tradeDirection}
                    orders={orders}
                    loading={loading}
                  />
                </div>
                <ResolveMarket market={selectedMarket} />
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p>Please select a market first</p>
                  <Button
                    onClick={() => setActiveTab("markets")}
                    className="mt-4"
                  >
                    Go to Markets
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create">
            {isCreatingMarket ? (
              <PredictionMarketForm />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p>Click the button below to start creating a new market</p>
                  <Button onClick={handleStartMarketCreation} className="mt-4">
                    Create New Market
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
