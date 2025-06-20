import { toast } from "@/hooks/use-toast"
import { FEE_RATE_BPS } from "@/lib/config"
import { quoteMarketBuy, quoteMarketSell } from "@/lib/order/quote-market"
import { addDays, format } from "date-fns"
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react"
import { zeroAddress } from "viem"
import { useAccount, useSignMessage } from "wagmi"
import {
  calculateExpirationTimestamp,
  calculateMaxBuy,
  calculateMaxLimitSell,
  calculateMaxMarketSell,
  calculateTotalCost,
  formatOrderForApi,
  generateOrderSalt,
  validateBuyLimitOrder,
  validateSellLimitOrder,
} from "../../utils/order"
import { useOrderBook } from "@/hooks/market/use-order-book"
import { useUserOrders } from "@/hooks/market/use-user-orders"
import { useUserPositions } from "@/hooks/use-user-positions"
import { useUserContext } from "@/providers/user-provider"
import {
  MarketInfo,
  MarketPanelVariant,
  OrderType,
  SignatureType,
  TokenLabels,
  TokenOption,
  TradeType,
  UnsignedOrder,
} from "@/types/Market"
import { useConditionalTokenBalance } from "@/hooks/use-conditional-token-balance"
import { useTokensState } from "@/hooks/use-tokens-state"
import { ActionButton } from "./button/action-button"
import { OrderSummary } from "./order-summary"
import { ExpirationOptions } from "./expiration-options"
import { LimitOrderInputs } from "./limit-order-inputs"
import { MarketOrderInputs } from "./market-order-inputs"
import { TokenSelector } from "./token-selector"
import { syncUserMarketPositions } from "../../utils/positions-sync"
import { useQueryClient } from "@tanstack/react-query"

interface MarketPanelFormProps {
  orderType: OrderType
  tradeType: TradeType
  market?: MarketInfo
  selectedOption: TokenOption
  setSelectedOption: Dispatch<SetStateAction<TokenOption>>
  orderBookData: any
  bestPrices: any
  variant?: MarketPanelVariant
  tokenLabels?: TokenLabels
  selectedMarketId?: string | null
}

export default function MarketPanelForm({
  tradeType,
  market,
  orderType,
  selectedOption,
  setSelectedOption,
  orderBookData,
  bestPrices,
  variant = "default",
  tokenLabels,
  selectedMarketId,
}: MarketPanelFormProps) {
  const { proxyAddress } = useUserContext()
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState<number>(0)
  const [limitPrice, setLimitPrice] = useState<string>("")
  const [sharesAmount, setSharesAmount] = useState<string>("10")
  const [limitPriceError, setLimitPriceError] = useState<string | null>(null)
  const [useExpiration, setUseExpiration] = useState<boolean>(false)
  const [expiration, setExpiration] = useState<number>(24 * 60 * 60)
  const [customExpiration, setCustomExpiration] = useState<string>(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const yesTokenId = market?.yesTokenId
  const noTokenId = market?.noTokenId
  const maxBuy = calculateMaxBuy(orderBookData, selectedOption)
  const { refetchPositionsValue } = useUserPositions()
  const maxMarketSell = calculateMaxMarketSell(orderBookData, selectedOption)
  const {
    yesTokenBalance,
    noTokenBalance,
    refetchNoTokenBalance,
    refetchYesTokenBalance,
  } = useConditionalTokenBalance(yesTokenId, noTokenId)
  const {
    hasERC20Allowance,
    refetchAll,
    balance,
    refetchBalance,
    approveERC1155,
    approveERC20,
  } = useTokensState({})

  const { refetch: refetchUserOrders } = useUserOrders(selectedMarketId ?? "")
  const { refetch: refetchOrderBook } = useOrderBook(selectedMarketId ?? "")

  const maxLimitSell = calculateMaxLimitSell(
    selectedOption,
    yesTokenBalance,
    noTokenBalance
  )

  useEffect(() => {
    setError(null)
    setLimitPriceError(null)
    setSharesAmount("10")
    setAmount(0)
    setCustomExpiration(format(addDays(new Date(), 1), "yyyy-MM-dd"))
    setUseExpiration(false)
    setExpiration(24 * 60 * 60)
    setLimitPrice("")
  }, [selectedOption, tradeType])

  useEffect(() => {
    refetchOrderBook()
    refetchUserOrders()
  }, [selectedMarketId])

  const handleMarketInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    e.preventDefault()
    const inputVal = e.target.value

    const newAmount = parseFloat(inputVal)

    if (tradeType === "BUY") {
      setError(
        newAmount > balance
          ? "Amount exceeds available balance"
          : newAmount > maxBuy
          ? "Amount exceeds maximum buy"
          : null
      )
    } else {
      const selectedTokenBalance =
        selectedOption === "YES"
          ? Number(yesTokenBalance) / 10 ** 6
          : Number(noTokenBalance) / 10 ** 6
      setError(
        newAmount > selectedTokenBalance
          ? "Amount exceeds available balance"
          : newAmount > maxMarketSell
          ? "Amount exceeds maximum sell"
          : null
      )
    }
    setAmount(newAmount)
  }

  const handleLimitPriceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    e.preventDefault()
    const value = e.target.value
    setLimitPrice(value)
    setLimitPriceError(null)
    setError(null)

    const priceValue = parseFloat(value) || 0
    if (priceValue < 1 || priceValue > 99) {
      setLimitPriceError("Limit price must be between 1¢ and 99¢.")
      return
    }

    // Run validation when both limit price and shares amount are present
    if (value && sharesAmount) {
      if (tradeType === "BUY") {
        const validation = validateBuyLimitOrder(balance, sharesAmount, value)
        setError(validation.error)
      } else {
        const validation = validateSellLimitOrder(
          maxLimitSell,
          sharesAmount,
          value
        )
        setError(validation.error)
      }
    }
  }

  const handleSharesAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value
    setSharesAmount(value)

    setError(null)

    if (value && limitPrice) {
      if (tradeType === "BUY") {
        const validation = validateBuyLimitOrder(balance, value, limitPrice)
        setError(validation.error)
      } else {
        const validation = validateSellLimitOrder(
          maxLimitSell,
          value,
          limitPrice
        )
        setError(validation.error)
      }
    }
  }

  const marketOrderAmount = useMemo(() => {
    if (!orderBookData || !market) return null

    // Split the orderbook to get data for both YES and NO sides

    if (orderType === "market" && tradeType === "BUY") {
      // Get the relevant asks based on selected token
      // For BUY orders, we need the lowest asks first (ascending price order)
      const relevantAsks =
        selectedOption === "YES" ? orderBookData.yesAsks : orderBookData.noAsks

      if (!relevantAsks || relevantAsks.length === 0) return null

      // Make sure asks are sorted by price (lowest first) for buying
      const sortedAsks = [...relevantAsks].sort((a, b) => a.price - b.price)

      // Convert to the format expected by quoteMarketBuy
      const asks = sortedAsks.map((ask) => ({
        price: ask.price / 100, // Convert from cents to dollars
        quantity: ask.shares * 10 ** 6, // Convert to raw units with decimals
      }))

      return quoteMarketBuy({
        asks,
        usdcAmount: Number.isNaN(amount) ? 0 : amount,
      })
    }

    if (orderType === "market" && tradeType === "SELL") {
      // Get the relevant bids based on selected token
      // For SELL orders, we need the highest bids first (descending price order)
      const relevantBids =
        selectedOption === "YES" ? orderBookData.yesBids : orderBookData.noBids

      if (!relevantBids || relevantBids.length === 0) return null

      // Make sure bids are sorted by price (highest first) for selling
      const sortedBids = [...relevantBids].sort((a, b) => b.price - a.price)

      // Convert to the format expected by quoteMarketSell
      const bids = sortedBids.map((bid) => ({
        price: bid.price / 100, // Convert from cents to dollars
        quantity: bid.shares * 10 ** 6, // Convert to raw units with decimals
      }))

      return quoteMarketSell({
        bids,
        shares: Number.isNaN(amount) ? 0 : amount,
      })
    }

    return null
  }, [orderBookData, orderType, amount, tradeType, market, selectedOption])

  const handleQuickAdd = (value: number): void => {
    setError(null)
    if (orderType === "limit") {
      // For limit orders
      if (tradeType === "SELL") {
        const selectedTokenBalance =
          selectedOption === "YES"
            ? Number(yesTokenBalance) / 10 ** 6
            : Number(noTokenBalance) / 10 ** 6
        const mSell =
          maxLimitSell > selectedTokenBalance
            ? selectedTokenBalance
            : maxLimitSell

        let newAmount =
          value === 50 ? mSell / 2 : value === 25 ? mSell / 4 : mSell

        // Ensure the amount doesn't exceed available balance
        newAmount = Math.min(newAmount, mSell)

        setSharesAmount(newAmount.toString())

        // Validate the new amount
        if (limitPrice) {
          const validation = validateSellLimitOrder(
            maxLimitSell,
            newAmount.toString(),
            limitPrice
          )
          setError(validation.error)
        }
      } else {
        // For buy limit orders, adjust shares amount
        const newAmount = Number(sharesAmount) + value
        setSharesAmount(newAmount.toString())

        // Validate the new amount
        if (limitPrice) {
          const validation = validateBuyLimitOrder(
            balance,
            newAmount.toString(),
            limitPrice
          )
          setError(validation.error)
        }
      }
      return
    }

    if (tradeType === "SELL") {
      const selectedTokenBalance =
        selectedOption === "YES"
          ? Number(yesTokenBalance) / 10 ** 6
          : Number(noTokenBalance) / 10 ** 6
      const mSell =
        maxMarketSell > selectedTokenBalance
          ? selectedTokenBalance
          : maxMarketSell

      const newAmount =
        value === 50 ? mSell / 2 : value === 25 ? mSell / 4 : mSell
      setAmount(newAmount)
      return
    }

    let newAmount =
      tradeType === "BUY"
        ? (Number.isNaN(amount) ? 0 : amount) + value
        : (balance * value) / 100
    newAmount = Math.min(newAmount, balance)

    if (newAmount > balance) {
      setError("Amount exceeds available balance")
      return
    }
    if (newAmount > maxBuy) {
      toast({
        title: "Amount exceeds maximum buy",
        description:
          "The amount you're trying to trade exceeds the maximum available for this market. Please adjust the amount to be within the available range.",
      })
      return
    }
    setAmount(newAmount)
    setError(newAmount > balance ? "Amount exceeds available balance" : null)
  }

  const handleMaxAmount = (): void => {
    if (orderType === "market") {
      if (tradeType === "BUY") {
        setAmount(Math.min(maxBuy, balance))
      } else {
        const selectedTokenBalance =
          selectedOption === "YES"
            ? Number(yesTokenBalance) / 10 ** 6
            : Number(noTokenBalance) / 10 ** 6
        const mSell =
          maxMarketSell > selectedTokenBalance
            ? selectedTokenBalance
            : maxMarketSell
        setAmount(mSell)
      }
    } else {
      // For limit orders
      if (tradeType === "BUY") {
        // Max shares to buy based on balance and limit price
        if (limitPrice) {
          const price = Number(limitPrice) / 100
          const maxShares = Math.floor(balance / price)
          setSharesAmount(maxShares.toString())

          // Validate after setting
          const validation = validateBuyLimitOrder(
            balance,
            maxShares.toString(),
            limitPrice
          )
          setError(validation.error)
        }
      } else {
        const selectedTokenBalance =
          selectedOption === "YES"
            ? Number(yesTokenBalance) / 10 ** 6
            : Number(noTokenBalance) / 10 ** 6
        const mSell =
          maxLimitSell > selectedTokenBalance
            ? selectedTokenBalance
            : maxLimitSell
        setSharesAmount(mSell.toString())

        // Validate after setting
        if (limitPrice) {
          const validation = validateSellLimitOrder(
            maxLimitSell,
            maxLimitSell.toString(),
            limitPrice
          )
          setError(validation.error)
        }
      }
    }
  }

  const handleApprove = async (): Promise<void> => {
    try {
      await approveERC20()
      refetchAll()
    } catch (error) {
      console.log({ error })
      toast({
        title: "Approval Failed",
        description: "Failed to approve your account. Please try again.",
      })
    }
  }

  const handleTrade = async (): Promise<void> => {
    if (!proxyAddress || !address) {
      toast({
        title: "Please connect your wallet",
        description: "Please connect your wallet to continue",
      })
      return
    }

    // Check for validation errors before proceeding
    if (error) {
      toast({
        title: "Validation Error",
        description: error || "Please fix the errors before placing an order",
      })
      return
    }

    setLoading(true)

    try {
      let success = false
      if (orderType === "limit") {
        // For limit orders, run validation one more time before proceeding
        let validation
        if (tradeType === "BUY") {
          validation = validateBuyLimitOrder(balance, sharesAmount, limitPrice)
        } else {
          validation = validateSellLimitOrder(
            maxLimitSell,
            sharesAmount,
            limitPrice
          )
        }

        // Important: Check validation result and return early if invalid
        if (!validation.isValid) {
          setError(validation.error)
          toast({
            title: "Validation Error",
            description:
              validation.error ||
              "Please fix the errors before placing an order",
          })
          return
        }

        success = await handleLimitOrder()
      } else {
        // For market orders, check if amount is valid
        if ((Number.isNaN(amount) ? 0 : amount) <= 0) {
          toast({
            title: "Invalid Amount",
            description: "Please enter a valid amount greater than 0",
          })
          return
        }

        success = await handleMarketOrder()
      }

      if (success) {
        setAmount(0)
        setSharesAmount("10")
        setLimitPrice("")

        toast({
          title: "Order placed successfully",
          description: `Your ${orderType} order has been placed.`,
        })
      } else {
        toast({
          title: "Error placing order",
          description:
            "There was an error placing your order. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error placing order",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarketOrder = async (): Promise<boolean> => {
    const { makerAmount, takerAmount, averagePrice } = marketOrderAmount ?? {}
    if (!makerAmount || !takerAmount) return false
    if (tradeType === "BUY") {
      if ((Number.isNaN(amount) ? 0 : amount) > maxBuy) {
        setError("Amount exceeds available market balance")
        return false
      }

      const unsignedOrder: UnsignedOrder = {
        salt: generateOrderSalt(),
        maker: proxyAddress || "",
        signer: address || "",
        taker: zeroAddress,
        tokenId: selectedOption === "YES" ? yesTokenId : noTokenId,
        makerAmount,
        takerAmount,
        expiration: 0,
        nonce: BigInt(0),
        feeRateBps: BigInt(FEE_RATE_BPS),
        side: 0,
        signatureType: SignatureType.EOA,
        signature: "0x" as `0x${string}`,
      }

      const hashResult = await fetch("/api/orders/hash-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: formatOrderForApi(unsignedOrder),
        }),
      })

      if (!hashResult.ok) {
        return false
      }

      const { hash } = await hashResult.json()

      const signature = await signMessageAsync({
        message: { raw: hash as `0x${string}` },
      })

      const signedOrder = {
        ...unsignedOrder,
        signature,
      }

      const dbResult = await fetch("/api/orders/market-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: formatOrderForApi(unsignedOrder),
          signature,
          marketId: selectedMarketId,
          conditionId: market?.conditionId,
          price: averagePrice,
        }),
      })

      if (!dbResult.ok) {
        return false
      }

      const { orderHash, pendingMatch } = await dbResult.json()

      const finalOrder = {
        ...signedOrder,
        orderHash,
        pendingMatch: Boolean(pendingMatch),
      }

      console.log({ finalOrder })
      refetchBalance()
      refetchNoTokenBalance()
      refetchYesTokenBalance()
      refetchUserOrders()
      refetchOrderBook()
      refetchPositionsValue()
      await syncUserMarketPositions({
        userAddress: proxyAddress!,
        marketId: selectedMarketId ?? (market?.id as string),
        yesTokenId: market?.yesTokenId as string,
        noTokenId: market?.noTokenId as string,
        conditionId: market?.conditionId as string,
        tradeType,
        side: selectedOption,
        bestPrices,
      })

      return true
    } else {
      if ((Number.isNaN(amount) ? 0 : amount) > maxMarketSell) {
        setError("Amount exceeds available market balance")
        return false
      }
      const unsignedOrder: UnsignedOrder = {
        salt: generateOrderSalt(),
        maker: proxyAddress || "",
        signer: address || "",
        taker: zeroAddress,
        tokenId: selectedOption === "YES" ? yesTokenId : noTokenId,
        makerAmount,
        takerAmount,
        expiration: 0,
        nonce: BigInt(0),
        feeRateBps: BigInt(FEE_RATE_BPS),
        side: 1,
        signatureType: SignatureType.EOA,
        signature: "0x" as `0x${string}`,
      }

      const hashResult = await fetch("/api/orders/hash-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: formatOrderForApi(unsignedOrder),
        }),
      })

      if (!hashResult.ok) {
        return false
      }

      const { hash } = await hashResult.json()

      const signature = await signMessageAsync({
        message: { raw: hash as `0x${string}` },
      })

      const signedOrder = {
        ...unsignedOrder,
        signature,
      }

      const dbResult = await fetch("/api/orders/market-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: formatOrderForApi(unsignedOrder),
          signature,
          marketId: selectedMarketId,
          conditionId: market?.conditionId,
          price: averagePrice,
        }),
      })

      if (!dbResult.ok) {
        return false
      }

      const { orderHash, pendingMatch } = await dbResult.json()

      const finalOrder = {
        ...signedOrder,
        orderHash,
        pendingMatch: Boolean(pendingMatch),
      }

      console.log({ finalOrder })
      refetchBalance()
      refetchNoTokenBalance()
      refetchYesTokenBalance()
      refetchUserOrders()
      refetchOrderBook()
      await syncUserMarketPositions({
        userAddress: proxyAddress!,
        marketId: selectedMarketId ?? (market?.id as string),
        yesTokenId: market?.yesTokenId as string,
        noTokenId: market?.noTokenId as string,
        conditionId: market?.conditionId as string,
        tradeType,
        side: selectedOption,
        bestPrices,
      })
      queryClient.invalidateQueries({ queryKey: ["marketsList"] })
      queryClient.invalidateQueries({ queryKey: ["gamesList"] })
      return true
    }
  }

  const handleLimitOrder = async (): Promise<boolean> => {
    if (!limitPrice || !sharesAmount) {
      setError("Please enter both shares amount and limit price")
      return false
    }

    // Run full validation before proceeding
    const validation =
      tradeType === "BUY"
        ? validateBuyLimitOrder(balance, sharesAmount, limitPrice)
        : validateSellLimitOrder(maxLimitSell, sharesAmount, limitPrice)

    if (!validation.isValid) {
      setError(validation.error)
      // Return early and don't proceed with order
      return false
    }
    const priceValue = parseFloat(limitPrice) || 0
    if (priceValue < 1 || priceValue > 99) {
      setLimitPriceError("Limit price must be between 1¢ and 99¢.")
      return false
    }

    const expirationTimestamp = useExpiration
      ? calculateExpirationTimestamp(expiration, customExpiration)
      : 0
    const orderPrice = (parseFloat(limitPrice) / 100).toString()
    const limitTakerAmount = Math.floor(
      Number(sharesAmount) * Number(orderPrice) * 10 ** 6
    )
    const sharesAmountInt = Math.floor(Number(sharesAmount) * 10 ** 6)

    const takerAmount =
      tradeType === "BUY" ? BigInt(sharesAmountInt) : BigInt(limitTakerAmount)
    const makerAmount =
      tradeType === "BUY" ? BigInt(limitTakerAmount) : BigInt(sharesAmountInt)

    if (tradeType === "SELL") {
      await approveERC1155()
    }
    const unsignedOrder: UnsignedOrder = {
      salt: generateOrderSalt(),
      maker: proxyAddress || "",
      signer: address || "",
      taker: zeroAddress,
      tokenId: selectedOption === "YES" ? yesTokenId : noTokenId,
      makerAmount,
      takerAmount,
      expiration: expirationTimestamp,
      nonce: BigInt(0),
      feeRateBps: BigInt(FEE_RATE_BPS),
      side: tradeType === "BUY" ? 0 : 1,
      signatureType: SignatureType.EOA,
      signature: "0x" as `0x${string}`,
    }

    const hashResult = await fetch("/api/orders/hash-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: formatOrderForApi(unsignedOrder),
      }),
    })

    if (!hashResult.ok) {
      return false
    }

    const { hash } = await hashResult.json()

    const signature = await signMessageAsync({
      message: { raw: hash as `0x${string}` },
    })

    const signedOrder = {
      ...unsignedOrder,
      signature,
    }

    const dbResult = await fetch("/api/orders/limit-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: formatOrderForApi(unsignedOrder),
        signature,
        marketId: selectedMarketId,
        conditionId: market?.conditionId,
        price: orderPrice,
      }),
    })

    if (!dbResult.ok) {
      return false
    }

    const { orderHash, pendingMatch } = await dbResult.json()

    const finalOrder = {
      ...signedOrder,
      orderHash,
      pendingMatch: Boolean(pendingMatch),
    }

    console.log({ finalOrder })
    refetchBalance()
    refetchNoTokenBalance()
    refetchYesTokenBalance()
    refetchUserOrders()
    refetchOrderBook()
    refetchPositionsValue()
    await syncUserMarketPositions({
      userAddress: proxyAddress!,
      marketId: selectedMarketId ?? (market?.id as string),
      yesTokenId: market?.yesTokenId as string,
      noTokenId: market?.noTokenId as string,
      conditionId: market?.conditionId as string,
      tradeType,
      side: selectedOption,
      bestPrices,
    })
    queryClient.invalidateQueries({ queryKey: ["marketsList"] })
    queryClient.invalidateQueries({ queryKey: ["gamesList"] })
    return true
  }

  const marketSummary =
    orderType === "market"
      ? {
          amount: Number.isNaN(amount) ? 0 : amount,
          averagePrice: marketOrderAmount?.averagePrice,
          cost: marketOrderAmount?.cost,
          shares: marketOrderAmount?.shares,
          tradeType,
        }
      : undefined

  const limitSummary =
    orderType === "limit"
      ? {
          limitPrice,
          sharesAmount,
          tradeType,
          calculateTotalCost,
        }
      : undefined

  return (
    <>
      <TokenSelector
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        bestPrices={bestPrices}
        tradeType={tradeType}
        variant={variant}
        tokenLabels={tokenLabels}
      />

      {orderType === "market" ? (
        <MarketOrderInputs
          tradeType={tradeType}
          amount={amount}
          handleMarketInputChange={handleMarketInputChange}
          handleQuickAdd={handleQuickAdd}
          handleMaxAmount={handleMaxAmount}
          balance={balance}
          selectedOption={selectedOption}
          yesTokenBalance={yesTokenBalance?.toString() ?? "0"}
          noTokenBalance={noTokenBalance?.toString() ?? "0"}
          error={error}
        />
      ) : (
        <>
          <LimitOrderInputs
            limitPrice={limitPrice}
            handleLimitPriceChange={handleLimitPriceChange}
            limitPriceError={limitPriceError}
            sharesAmount={sharesAmount}
            handleSharesAmountChange={handleSharesAmountChange}
            handleQuickAdd={handleQuickAdd}
            handleMaxAmount={handleMaxAmount}
            tradeType={tradeType}
            selectedOption={selectedOption}
            yesTokenBalance={yesTokenBalance?.toString() ?? "0"}
            noTokenBalance={noTokenBalance?.toString() ?? "0"}
            error={error}
          />
          <ExpirationOptions
            useExpiration={useExpiration}
            setUseExpiration={setUseExpiration}
            expiration={expiration}
            setExpiration={setExpiration}
            customExpiration={customExpiration}
            setCustomExpiration={setCustomExpiration}
          />
        </>
      )}

      <OrderSummary
        orderType={orderType}
        marketSummaryProps={marketSummary}
        limitSummaryProps={limitSummary}
      />

      <div className="flex p-[10px]">
        <ActionButton
          hasAllowance={hasERC20Allowance}
          balance={balance}
          amount={amount}
          orderType={orderType}
          tradeType={tradeType}
          selectedOption={selectedOption}
          error={error}
          limitPrice={limitPrice}
          sharesAmount={sharesAmount}
          loading={loading}
          calculateTotalCost={calculateTotalCost}
          handleApprove={handleApprove}
          handleTrade={handleTrade}
          variant={variant}
          tokenLabels={tokenLabels}
        />
      </div>
    </>
  )
}
