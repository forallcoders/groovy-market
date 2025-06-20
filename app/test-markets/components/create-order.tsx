"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collateralContract } from "@/contracts/data/collateral"
import { ctfContract } from "@/contracts/data/ctf"
// import { useGaslessTransactions } from "@/hooks/use-gasless-client"
import { Order, Side, useOrderCreation } from "@/hooks/use-order-creation"
import { useTokensState } from "@/hooks/use-tokens-state"
import { quoteMarketBuy, quoteMarketSell } from "@/lib/order/utils"
import { addDays, format } from "date-fns"
import { ethers } from "ethers"
import { useMemo, useState } from "react"
import { useAccount, useReadContract, useWriteContract } from "wagmi"

export interface FullMarket {
  id: string
  conditionId: string
  title: string
  description?: string
  yesTokenId: string
  noTokenId: string
  liquidity?: {
    yesSupply: string
    noSupply: string
    totalSupply: string
  }
  orderBook?: {
    yesBestBid: number
    yesBestAsk: number
    noBestBid: number
    noBestAsk: number
  }
  resolved?: boolean
}

interface OrderFormProps {
  market: FullMarket
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOrderCreated: (order: any) => void
  selectedOutcome: "yes" | "no"
  onOutcomeChange: (outcome: "yes" | "no") => void
  tradeDirection: "buy" | "sell"
  onDirectionChange: (direction: "buy" | "sell") => void
  orders: Order[]
}

type OrderType = "market" | "limit" | "split" | "merge"

export default function CreateOrder({
  market,
  onOrderCreated,
  selectedOutcome,
  onOutcomeChange,
  tradeDirection,
  onDirectionChange,
  orders,
}: OrderFormProps) {
  const { isConnected, address } = useAccount()
  const [orderType, setOrderType] = useState<OrderType>("market")
  const [quantity, setQuantity] = useState("10")
  const [limitPrice, setLimitPrice] = useState("")
  const [splitPrice, setSplitPrice] = useState("")
  const [mergePrice, setMergePrice] = useState("")
  const [sharesAmount, setSharesAmount] = useState("10")
  const [loading, setLoading] = useState(false)
  const [useExpiration, setUseExpiration] = useState(false)
  const [expiration, setExpiration] = useState<number>(24 * 60 * 60)
  const [limitPriceError, setLimitPriceError] = useState<string | null>(null)
  const [customExpiration, setCustomExpiration] = useState<string>(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  )
  // const { executeTransaction } = useGaslessTransactions()
  const {
    isCreating,
    error,
    createBuyOrder,
    createSellOrder,
    createBuyNoOrder,
    createSellNoOrder,
  } = useOrderCreation()
  const { isApproving } = useTokensState({})
  const tab = tradeDirection
  const outcome = selectedOutcome
  const { writeContractAsync } = useWriteContract()
  const { data: yesBalance } = useReadContract({
    abi: ctfContract.abi,
    address: ctfContract.address,
    functionName: "balanceOf",
    args: [address, market.yesTokenId],
  })

  const { data: noBalance } = useReadContract({
    abi: ctfContract.abi,
    address: ctfContract.address,
    functionName: "balanceOf",
    args: [address, market.noTokenId],
  })

  const getBestPrice = () => {
    const { yesBestBid, yesBestAsk, noBestBid, noBestAsk } =
      market.orderBook || {}

    if (outcome === "yes") {
      if (tab === "buy") {
        return yesBestAsk ? yesBestAsk.toString() : (0.5).toString()
      } else {
        return yesBestBid ? yesBestBid.toString() : (0.5).toString()
      }
    } else {
      if (tab === "buy") {
        return noBestAsk ? noBestAsk.toString() : (0.5).toString()
      } else {
        return noBestBid ? noBestBid.toString() : (0.5).toString()
      }
    }
  }

  const currentPrice = orderType === "market" ? getBestPrice() : limitPrice
  // Calculate total cost/proceeds
  const calculateTotalCost = (shares: number, limitPrice: number) => {
    return (shares * limitPrice) / 100
  }
  // Calculate price and quantity for limit orders
  const limitOrderDetails = useMemo(() => {
    if (orderType !== "limit") return null

    const priceValue = parseFloat(limitPrice) || 0
    const sharesValue = parseFloat(sharesAmount) || 0

    if (
      isNaN(priceValue) ||
      isNaN(sharesValue) ||
      priceValue < 0 ||
      sharesValue <= 0
    ) {
      return {
        totalValue: 0,
        displayWarning: true,
      }
    }

    const totalValue = calculateTotalCost(sharesValue, priceValue)
    return {
      totalValue,
      sharesValue,
      priceValue,
      displayWarning: false,
    }
  }, [limitPrice, sharesAmount, orderType])

  // Calculate details for market orders
  const marketOrderDetails = useMemo(() => {
    if (orderType !== "market") return null

    const quantityValue = parseFloat(quantity) || 0
    const priceValue = parseFloat(currentPrice) || 0.5

    if (
      isNaN(quantityValue) ||
      isNaN(priceValue) ||
      quantityValue <= 0 ||
      priceValue <= 0
    ) {
      return {
        totalCost: 0,
        potentialPayout: 0,
        displayWarning: true,
      }
    }

    let totalCost = 0
    let potentialPayout = 0

    if (tab === "buy") {
      totalCost = quantityValue * priceValue
      potentialPayout = quantityValue
    } else {
      totalCost = quantityValue
      potentialPayout = quantityValue * priceValue
    }

    return {
      totalCost,
      potentialPayout,
      displayWarning: false,
    }
  }, [quantity, currentPrice, tab, orderType])

  // Calculates the expiration timestamp based on user selection
  const calculateExpirationTimestamp = (): number => {
    const now = Math.floor(Date.now() / 1000) // Current time in seconds

    // If using predefined expiration period
    if (expiration > 0) {
      return now + expiration
    }

    // If using custom date
    if (customExpiration) {
      const customDate = new Date(customExpiration)
      // Set time to end of day
      customDate.setHours(23, 59, 59, 999)
      return Math.floor(customDate.getTime() / 1000)
    }

    // Default to 24 hours if something goes wrong
    return now + 24 * 60 * 60
  }

  const handlePlaceOrder = async () => {
    if (!isConnected) return

    try {
      setLoading(true)
      setLimitPriceError(null)

      if (orderType === "limit") {
        const priceValue = parseFloat(limitPrice) || 0
        if (priceValue < 1 || priceValue > 99) {
          setLimitPriceError("Limit price must be between 1¢ and 99¢.")
          setLoading(false)
          return
        }
      }
      // Calculate expiration timestamp
      const expirationTimestamp = 0
      console.log({ expirationTimestamp })
      let result
      // For limit orders, we use shares and price
      // const orderAmount = orderType === "limit" ? sharesAmount : quantity
      // For market orders, we use quantity and current price
      const orderPrice = (parseFloat(limitPrice) / 100).toString()
      const limitTakerAmount = Math.floor(
        Number(sharesAmount) * Number(orderPrice) * 10 ** 6
      )
      console.log({ limitPrice, sharesAmount, limitTakerAmount })
      const takerAmount =
        tab === "buy"
          ? BigInt(Number(sharesAmount) * 10 ** 6)
          : BigInt(limitTakerAmount)
      const makerAmount =
        tab === "buy"
          ? BigInt(limitTakerAmount)
          : BigInt(Number(sharesAmount) * 10 ** 6)
      console.log({ takerAmount, makerAmount })
      if (outcome === "yes") {
        if (tab === "buy") {
          console.log({
            asd: BigInt(market.yesTokenId),
            asdas: market.id,
            takerAmount,
            makerAmount,
            expirationTimestamp,
          })
          result = await createBuyOrder(
            BigInt(market.yesTokenId),
            market.id,
            takerAmount,
            makerAmount,
            false,
            expirationTimestamp,
            true
          )
        } else {
          result = await createSellOrder(
            BigInt(market.yesTokenId),
            market.id,
            takerAmount,
            makerAmount,
            false,
            expirationTimestamp,
            true
          )
        }
      } else {
        if (tab === "buy") {
          result = await createBuyNoOrder(
            BigInt(market.noTokenId),
            market.id,
            takerAmount,
            makerAmount,
            false,
            expirationTimestamp,
            true
          )
        } else {
          result = await createSellNoOrder(
            BigInt(market.noTokenId),
            market.id,
            takerAmount,
            makerAmount,
            false,
            expirationTimestamp,
            true
          )
        }
      }

      if (result) {
        onOrderCreated(result)
        setQuantity("10")
        setSharesAmount("10")
        setLimitPrice("")
      }
    } catch (error) {
      console.error("Error placing order:", error)
    } finally {
      setLoading(false)
    }
  }
  const handleMarketPlaceOrder = async () => {
    if (!isConnected) return

    try {
      setLoading(true)
      setLimitPriceError(null)

      // Calculate expiration timestamp
      const expirationTimestamp = calculateExpirationTimestamp()

      let result

      const { usedAsks, makerAmount, takerAmount } = marketOrderAmount ?? {}
      // if (!usedAsks) return
      console.log({ usedAsks, makerAmount, takerAmount })
      if (outcome === "yes") {
        if (tab === "buy") {
          result = await createBuyOrder(
            BigInt(market.yesTokenId),
            market.id,
            takerAmount!,
            makerAmount!,
            false,
            expirationTimestamp
          )
        } else {
          result = await createSellOrder(
            BigInt(market.yesTokenId),
            market.id,
            takerAmount!,
            makerAmount!,
            false,
            expirationTimestamp
          )
        }
      } else {
        if (tab === "buy") {
          result = await createBuyNoOrder(
            BigInt(market.noTokenId),
            market.id,
            BigInt(10000000),
            BigInt(6000000),
            false,
            expirationTimestamp
          )
        } else {
          result = await createSellNoOrder(
            BigInt(market.noTokenId),
            market.id,
            BigInt(6000000),
            BigInt(10000000),
            false,
            expirationTimestamp
          )
        }
      }

      if (result) {
        onOrderCreated(result)
        setQuantity("10")
        setSharesAmount("10")
        setLimitPrice("")
      }
    } catch (error) {
      console.error("Error placing order:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderOrderTypeTabs = () => (
    <div className="mb-4">
      <Label className="block mb-2">Order Type</Label>
      <RadioGroup
        value={orderType}
        onValueChange={(value) => setOrderType(value as OrderType)}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="market" id="market" />
          <Label htmlFor="market">Market</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="limit" id="limit" />
          <Label htmlFor="limit">Limit</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="split" id="split" />
          <Label htmlFor="split">Split</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="merge" id="merge" />
          <Label htmlFor="merge">Merge</Label>
        </div>
      </RadioGroup>
    </div>
  )

  const renderExpirationOptions = () => (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Set Expiration</Label>
        <Switch checked={useExpiration} onCheckedChange={setUseExpiration} />
      </div>

      {useExpiration && (
        <>
          <RadioGroup
            value={expiration.toString()}
            onValueChange={(value) => setExpiration(parseInt(value))}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={(24 * 60 * 60).toString()} id="day" />
              <Label htmlFor="day">1 Day</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={(7 * 24 * 60 * 60).toString()} id="week" />
              <Label htmlFor="week">7 Days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={(30 * 24 * 60 * 60).toString()}
                id="month"
              />
              <Label htmlFor="month">30 Days</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="custom" />
              <Label htmlFor="custom">Custom Date</Label>
            </div>
          </RadioGroup>

          {expiration === 0 && (
            <div className="mt-2">
              <Input
                type="date"
                value={customExpiration}
                onChange={(e) => setCustomExpiration(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
  const marketOrderAmount = useMemo(() => {
    if (orderType === "market" && tab == "buy") {
      const asks = orders
        ?.filter(
          (order) =>
            order.side === Side.SELL &&
            order.tokenId.toString() ===
              (outcome === "yes" ? market.yesTokenId : market.noTokenId)
        )
        .map((order) => ({
          price: Number(order.takerAmount) / Number(order.makerAmount),
          quantity: Number(order.makerAmount),
        }))
        ?.sort((a, b) => a.price - b.price)
      console.log({ asks })
      if (!asks || asks.length === 0) return null
      return quoteMarketBuy({
        asks,
        usdcAmount: Number(quantity),
      })
    }
    if (orderType === "market" && tab == "sell") {
      const bids = orders
        ?.filter(
          (order) =>
            order.side === Side.BUY &&
            order.tokenId.toString() ===
              (outcome === "yes" ? market.yesTokenId : market.noTokenId)
        )
        .map((order) => ({
          price: Number(order.makerAmount) / Number(order.takerAmount),
          quantity: Number(order.takerAmount) - Number(order.filledAmount),
        }))
        ?.sort((a, b) => b.price - a.price)
      console.log({ bids })
      if (!bids || bids.length === 0) return null
      return quoteMarketSell({
        bids: bids,
        shares: Number(quantity),
      })
    }
    return null
  }, [orderType, quantity, orders, tab])

  console.log({ marketOrderAmount })

  const renderMarketOrderForm = () => (
    <div>
      <label className="block mb-1 text-sm">
        {tab === "buy"
          ? "Amount (USDC to spend)"
          : `Quantity (${outcome.toUpperCase()} tokens to sell)`}
      </label>
      <Input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        min="1"
        step="1"
        disabled={isCreating || loading}
        placeholder={tab === "buy" ? "USDC amount" : "Token amount"}
      />
      {tab === "buy" && (
        <p className="text-xs text-gray-500 mt-1">
          Enter the amount of USDC you want to spend
        </p>
      )}
      {tab === "sell" && (
        <p className="text-xs text-gray-500 mt-1">
          Enter the amount of {outcome.toUpperCase()} tokens you want to sell
        </p>
      )}

      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md mt-4">
        <h4 className="font-medium mb-2">Order Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {tab === "buy" ? (
            <>
              <div>Cost (USDC):</div>
              <div className="text-right font-medium">
                {quantity || "0"} USDC
              </div>

              <div>Tokens to Receive:</div>
              <div className="text-right font-medium">
                {marketOrderAmount
                  ? Number(marketOrderAmount.shares).toFixed(2)
                  : "0.00"}{" "}
                {outcome.toUpperCase()} Tokens
              </div>
            </>
          ) : (
            <>
              <div>Tokens to Sell:</div>
              <div className="text-right font-medium">
                {quantity} {outcome.toUpperCase()} Tokens
              </div>

              <div>USDC to Receive:</div>
              <div className="text-right font-medium">
                {(parseFloat(quantity) * parseFloat(currentPrice)).toFixed(2)}{" "}
                USDC
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderLimitOrderForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block mb-1 text-sm">
          Limit Price (Cents per Token)
        </label>
        <Input
          type="number"
          value={limitPrice}
          onChange={(e) => {
            setLimitPrice(e.target.value)
            setLimitPriceError(null)
          }}
          min="1"
          step="0.01"
          max="99"
          disabled={isCreating || loading}
          placeholder="Price per token"
        />
        {limitPriceError ? (
          <p className="text-red-500 text-xs mt-1">{limitPriceError}</p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            Enter the price in cents per token (0 to 99)
          </p>
        )}
      </div>
      <div>
        <label className="block mb-1 text-sm">
          Number of Shares ({outcome.toUpperCase()} tokens)
        </label>
        <Input
          type="number"
          value={sharesAmount}
          onChange={(e) => setSharesAmount(e.target.value)}
          min="1"
          step="1"
          disabled={isCreating || loading}
          placeholder="Number of shares"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the number of {outcome.toUpperCase()} tokens to {tab}
        </p>
        {tab === "sell" && (
          <p className="text-xs text-gray-500 mt-1">
            Balance:{" "}
            {outcome === "yes"
              ? ((Number(yesBalance) ?? 0) / 10 ** 6).toString()
              : ((Number(noBalance) ?? 0) / 10 ** 6).toString()}
          </p>
        )}
      </div>

      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
        <h4 className="font-medium mb-2">Order Summary</h4>
        <div className="flex flex-col gap-2 text-sm">
          {tab === "buy" && (
            <>
              <div className="flex items-center gap-5 justify-between">
                Shares to Buy:
                <div className="text-right font-medium">
                  {sharesAmount} Tokens
                </div>
              </div>
              <div className="flex items-center gap-5 justify-between">
                Price per Share:
                <div className="text-right font-medium">{limitPrice}¢</div>
              </div>
              <div className="flex items-center gap-5 justify-between">
                Total Cost (USDC):
                <div className="text-right font-medium">
                  $
                  {calculateTotalCost(
                    Number(sharesAmount),
                    Number(limitPrice)
                  ).toFixed(2)}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-5 justify-between items-center bg-slate-100 dark:bg-slate-800 rounded-md">
            <h4 className="font-medium mb-1">
              {tab === "buy" ? "To Win" : "You'll receive"}
            </h4>
            <div className="text-right text-green-500 font-medium text-lg">
              💵 $
              {tab === "buy"
                ? sharesAmount
                : calculateTotalCost(
                    Number(sharesAmount),
                    Number(limitPrice)
                  ).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSplitOrderForm = () => {
    return (
      <div>
        <label className="block mb-1 text-sm">Split Price</label>
        <Input
          type="number"
          value={splitPrice}
          onChange={(e) => {
            setSplitPrice(e.target.value)
          }}
          min="1"
          step="0.01"
          max="99"
          disabled={isCreating || loading}
          placeholder="Price per token"
        />
      </div>
    )
  }

  const renderMergerOrderForm = () => {
    return (
      <div>
        <label className="block mb-1 text-sm">Merge Price</label>
        <Input
          type="number"
          value={mergePrice}
          onChange={(e) => {
            setMergePrice(e.target.value)
          }}
          min="1"
          step="0.01"
          max="99"
          disabled={isCreating || loading}
          placeholder="Price per token"
        />
      </div>
    )
  }

  // const handleSplitOrder = async () => {
  //   if (!splitPrice) return

  //   try {
  //     setLoading(true)

  //     // 1. First ensure all necessary approvals are in place
  //     // For a split operation, we need ERC20 token approval (collateral token)
  //     const approvalsReady = await ensureApprovalsForOperation(
  //       ctfContract.address, // ConditionalTokens contract needs approval to spend our collateral
  //       ctfContract.address, // Not needed for split from collateral, but included for consistency
  //       splitPrice // The amount we're splitting
  //     )

  //     if (!approvalsReady) {
  //       throw new Error(
  //         "Failed to set up necessary approvals for split operation"
  //       )
  //     }

  //     // 2. Now proceed with the split operation
  //     await handleTokenOperation("/api/split-position", splitPrice)

  //     // 3. Reset form state on success
  //     setSplitPrice("")
  //   } catch (error) {
  //     console.error("Error during split operation:", error)
  //     // Show error to user in your preferred way
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // // Update handleMergeOrder function
  // const handleMergeOrder = async () => {
  //   if (!mergePrice) return

  //   try {
  //     setLoading(true)

  //     // 1. First ensure necessary approvals
  //     // For merge, we need ERC1155 approval for the conditional tokens
  //     const approvalsReady = await ensureApprovalsForOperation(
  //       collateralContract.address, // Not needed for merge, but included for consistency
  //       ctfContract.address, // ConditionalTokens contract needs to be approved for ERC1155 transfers
  //       mergePrice
  //     )

  //     if (!approvalsReady) {
  //       throw new Error(
  //         "Failed to set up necessary approvals for merge operation"
  //       )
  //     }

  //     // 2. Now proceed with the merge operation
  //     await handleTokenOperation("/api/merge-positions", mergePrice)

  //     // 3. Reset form state on success
  //     setMergePrice("")
  //   } catch (error) {
  //     console.error("Error during merge operation:", error)
  //     // Show error to user in your preferred way
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleTokenOperation = async (endpoint: string, amount: string) => {
  //   try {
  //     // Call the API
  //     const response = await fetch(endpoint, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         amount: parseFloat(amount),
  //         marketId: market.id,
  //         conditionId: market.conditionId,
  //         yesTokenId: market.yesTokenId,
  //         noTokenId: market.noTokenId,
  //         proxyWallet: proxyAddress,
  //       }),
  //     })
  //     if (response.ok) {
  //       const data = await response.json()

  //       const { request } = data
  //       console.log({ request })
  //       // Execute transaction
  //       const result = await executeTransaction({
  //         targetContract: request.targetContract,
  //         amount: request.amount,
  //         data: request.data,
  //       })

  //       if (!result.success) {
  //         throw new Error(`Failed action`)
  //       }
  //     }
  //   } catch (error) {
  //     console.error(`Error during operation:`, error)
  //   }
  // }

  const handleSplitOrder = async () => {
    if (!splitPrice) return
    const amountBigInt = ethers.parseUnits(splitPrice, 6)
    const res = await writeContractAsync({
      abi: ctfContract.abi,
      address: ctfContract.address,
      functionName: "splitPosition",
      args: [
        collateralContract.address,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        market.conditionId,
        [1, 2],
        amountBigInt,
      ],
    })
    console.log({ res })
  }

  const handleMergeOrder = async () => {
    if (!mergePrice) return
    const amountBigInt = ethers.parseUnits(mergePrice, 6)
    const res = await writeContractAsync({
      abi: ctfContract.abi,
      address: ctfContract.address,
      functionName: "mergePositions",
      args: [
        collateralContract.address,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        market.conditionId,
        [1, 2],
        amountBigInt,
      ],
    })
    console.log({ res })
  }

  const orderTypeForms = {
    market: renderMarketOrderForm(),
    limit: renderLimitOrderForm(),
    split: renderSplitOrderForm(),
    merge: renderMergerOrderForm(),
  }

  const orderTypeActions = {
    market: handleMarketPlaceOrder,
    limit: handlePlaceOrder,
    split: handleSplitOrder,
    merge: handleMergeOrder,
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {market.resolved ? "Market Resolved" : "Place Order"}: {market.title}
        </CardTitle>
        <div className="flex justify-between mt-2">
          <Badge
            variant={outcome === "yes" ? "default" : "secondary"}
            className="cursor-pointer text-lg"
            onClick={() => onOutcomeChange("yes")}
          >
            YES:{" "}
            {market.orderBook
              ? tradeDirection === "buy"
                ? market.orderBook.yesBestAsk
                  ? (market.orderBook.yesBestAsk * 100).toFixed(1)
                  : "50"
                : market.orderBook.yesBestBid
                ? (market.orderBook.yesBestBid * 100).toFixed(1)
                : "50"
              : "50"}
            ¢
          </Badge>
          <Badge
            variant={outcome === "no" ? "default" : "secondary"}
            className="cursor-pointer text-lg"
            onClick={() => onOutcomeChange("no")}
          >
            NO:{" "}
            {market.orderBook
              ? tradeDirection === "buy"
                ? market.orderBook.noBestAsk
                  ? (market.orderBook.noBestAsk * 100).toFixed(1)
                  : "50"
                : market.orderBook.noBestBid
                ? (market.orderBook.noBestBid * 100).toFixed(1)
                : "50"
              : "50"}
            ¢
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {market.resolved ? (
          <Alert>
            <AlertTitle>This market has been resolved</AlertTitle>
            <AlertDescription>
              You can no longer place orders on this market.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs
            value={tab}
            onValueChange={(value) =>
              onDirectionChange(value as "buy" | "sell")
            }
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>

            {/* Order Type Selection */}
            {renderOrderTypeTabs()}

            {/* Order Form */}
            <div className="space-y-4">
              {orderTypeForms[orderType]}

              {/* Expiration Options - Only for limit orders */}
              {orderType === "limit" && renderExpirationOptions()}

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button
                className="w-full"
                onClick={orderTypeActions[orderType]}
                disabled={
                  isCreating ||
                  loading ||
                  isApproving ||
                  !isConnected ||
                  (orderType === "market" &&
                    marketOrderDetails?.displayWarning) ||
                  (orderType === "limit" &&
                    (!limitPrice ||
                      !sharesAmount ||
                      limitOrderDetails?.displayWarning))
                }
              >
                {isCreating || loading || isApproving
                  ? isApproving
                    ? "Approving tokens..."
                    : "Processing..."
                  : `Place ${orderType.toUpperCase()} ${tab.toUpperCase()} Order for ${outcome.toUpperCase()}`}
              </Button>

              {orderType === "market" && marketOrderDetails?.displayWarning && (
                <Alert variant="destructive">
                  <AlertTitle>Invalid Order Parameters</AlertTitle>
                  <AlertDescription>
                    Please enter a valid quantity.
                  </AlertDescription>
                </Alert>
              )}

              {orderType === "limit" && limitOrderDetails?.displayWarning && (
                <Alert variant="destructive">
                  <AlertTitle>Invalid Order Parameters</AlertTitle>
                  <AlertDescription>
                    Please enter valid price and shares amount.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
