"use client"
import { useState } from "react"
import ConditionsCard, {
  SportsPrediction,
} from "@/app/markets/create/components/conditions-card"
import DescriptionCard from "@/app/markets/create/components/description-card"
import LiquidityCard from "@/app/markets/create/components/liquidity-card"
import { useGaslessTransactions } from "@/hooks/use-gasless-client"
import { useToast } from "@/hooks/use-toast"
import { getMarketChainData } from "@/lib/market/get-markets"
import { publicClient } from "@/lib/wallet/public-client"
import { useUserContext } from "@/providers/user-provider"
import { slugify } from "@/utils/slugify"
import { useRouter } from "next/navigation"
import { syncUserMarketPositions } from "../utils/positions-sync"
import { generateInitialOrders } from "./utils/initial-orders"
import { handleLimitOrderDirect } from "../utils/limit-order"
import { useAccount, useSignMessage } from "wagmi"
import { useTokensState } from "@/hooks/use-tokens-state"

export type ConditionCardData = {
  id: string
  category: string
  values: Record<string, any>
  sportsPrediction?: SportsPrediction
}

export interface FormValues {
  marketName: string
  description: string
  initialLiquidity: number
  image?: File
  isCombined: boolean
}

export default function CreatePage() {
  const [cards, setCards] = useState<ConditionCardData[]>([
    {
      id: Date.now().toString(),
      category: "sports",
      values: {},
    },
  ])
  const [formValues, setFormValues] = useState<FormValues>({
    marketName: "",
    description: "",
    initialLiquidity: 100,
    isCombined: false,
  })
  const [probability, setProbability] = useState(50)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { executeTransaction } = useGaslessTransactions()
  const { toast } = useToast()
  const { user, proxyAddress } = useUserContext()
  const { address } = useAccount()
  const { refetchAll, approveERC1155 } = useTokensState({})
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()

  const addNewCard = () => {
    setCards((prev) => [
      ...prev,
      { id: Date.now().toString(), category: "sports", values: {} },
    ])
  }

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id))
  }

  const updateCardCategory = (id: string, category: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, category, values: {} } : card
      )
    )
  }

  const updateCardField = (id: string, fieldName: string, value: any) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? { ...card, values: { ...card.values, [fieldName]: value } }
          : card
      )
    )
  }

  const handleSportsPredictionChange = (
    id: string,
    prediction: SportsPrediction
  ) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, sportsPrediction: prediction } : card
      )
    )
  }

  const handleDescriptionChange = (field: keyof FormValues, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))

    if (field === "image" && value instanceof File) {
      const preview = URL.createObjectURL(value)
      setImagePreview(preview)
    }

    if (field === "image" && value === null) {
      setImagePreview(null)
    }
  }

  const handleLiquidityChange = (value: number) => {
    setFormValues((prev) => ({ ...prev, initialLiquidity: value }))
  }

  const handleCombinedChange = (value: boolean) => {
    setFormValues((prev) => ({ ...prev, isCombined: value }))
  }

  const validateForm = (): boolean => {
    // At least one condition card is required
    if (cards.length === 0) {
      setError("At least one condition is required")
      return false
    }

    if (!formValues.marketName) {
      setError("Market name is required")
      return false
    }

    if (!formValues.description) {
      setError("Market description is required")
      return false
    }

    if (formValues.initialLiquidity < 100) {
      setError("Initial liquidity must be at least 100 USDC")
      return false
    }

    if (!formValues.image) {
      setError("Image is required.")
      return false
    }
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/svg+xml",
    ]
    if (!validTypes.includes(formValues.image.type)) {
      setError("Invalid image type. Only JPEG, PNG, and WEBP are allowed.")
      return false
    }

    const maxSizeMB = 5
    if (formValues.image.size > maxSizeMB * 1024 * 1024) {
      setError("Image size exceeds 5MB limit.")
      return false
    }

    // Then validate each card...
    for (const card of cards) {
      if (card.category === "sports") {
        if (!card.values?.sport) {
          setError("Each sports card must have a sport selected")
          return false
        }
        if (!card.values?.league) {
          setError("Each sports card must have a league selected")
          return false
        }
        if (!card.values?.match) {
          setError("Each sports card must have a match selected")
          return false
        }
        if (!card.values?.metric) {
          setError("Each sports card must have a metric selected")
          return false
        }
        if (!card.values?.condition) {
          setError("Each sports card must have a condition selected")
          return false
        }
        if (!card.values?.value) {
          setError("Each sports card must have a value set")
          return false
        }
      } else if (card.category === "crypto") {
        if (!card.values.fiat || !card.values["second-fiat"]) {
          setError("Each crypto card must have both currencies selected")
          return false
        }
        if (!card.values.outcome || !card.values.condition) {
          setError("Each crypto card must have outcomes selected")
          return false
        }
        if (card.values.condition === "between" && !card.values.price2) {
          setError("Each crypto card must have a price range")
          return false
        }
        if (!card.values.date) {
          setError("Each card must have a prediction date")
          return false
        }
      }
    }

    return true
  }

  // Helper function to create a market on the blockchain
  const createBlockchainMarket = async (
    params: string | string[],
    isGrouped = false,
    hasLiquidity = false
  ) => {
    // Prepare the request for the contract
    const marketsProxyResponse = await fetch("/api/markets/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params, isGrouped }),
    })

    if (!marketsProxyResponse.ok) {
      throw new Error(
        `Failed to fetch market transaction for market ID: ${params}`
      )
    }

    const { request } = await marketsProxyResponse.json()

    // Execute the market creation transaction through the proxy wallet
    const marketsProxyResult = await executeTransaction({
      targetContract: request.targetContract,
      amount: request.amount,
      data: request.data,
    })

    if (!marketsProxyResult.success) {
      throw new Error(
        `Failed to create market on chain for market ID: ${params}`
      )
    }
    const tx = marketsProxyResult.result.tx.hash
    const response = await publicClient.waitForTransactionReceipt({
      hash: tx,
    })
    if (response.status === "reverted") {
      console.error("Transaction reverted:", tx)
      throw new Error("Transaction reverted")
    }
    if (!hasLiquidity) {
      if (Array.isArray(params)) {
        for (const marketId of params) {
          await updateBlockchainMarket(marketId)
        }
      } else {
        await updateBlockchainMarket(params)
      }
    }

    return marketsProxyResult
  }

  const updateBlockchainMarket = async (marketId: string) => {
    const { conditionId, noTokenId, yesTokenId } = await getMarketChainData(
      marketId
    )

    // Update market status to 'created'
    const updateResponse = await fetch(`/api/markets`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "created",
        id: marketId,

        conditionId,
        yesTokenId,
        noTokenId,
      }),
    })

    const updateResult = await updateResponse.json()
    if (!updateResult.success) {
      throw new Error(
        `Failed to update market status for market ID: ${marketId}`
      )
    }
  }

  // Helper function to split liquidity across markets
  const splitLiquidityAcrossMarkets = async (
    marketIds: string[],
    totalLiquidity: number
  ) => {
    // Calculate liquidity per market
    const liquidityPerMarket = Math.floor(totalLiquidity / marketIds.length)

    // Process each market
    for (const marketId of marketIds) {
      const splitPositionsProxyResponse = await fetch(
        "/api/positions/split-position",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: liquidityPerMarket,
            marketId,
          }),
        }
      )

      if (!splitPositionsProxyResponse.ok) {
        throw new Error(
          `Failed to fetch split positions transaction for market ID: ${marketId}`
        )
      }

      const { request: splitPositionsRequest } =
        await splitPositionsProxyResponse.json()

      // Execute the split positions transaction through the proxy wallet
      const splitPositionsProxyResult = await executeTransaction({
        targetContract: splitPositionsRequest.targetContract,
        amount: splitPositionsRequest.amount,
        data: splitPositionsRequest.data,
      })

      if (!splitPositionsProxyResult.success) {
        throw new Error(`Failed to split tokens for market ID: ${marketId}`)
      }
      const { conditionId, noTokenId, yesTokenId } = await getMarketChainData(
        marketId
      )
      await handlePostMarketCreation({
        marketId,
        yesTokenId,
        noTokenId,
        conditionId,
      })
      // Update market status to 'created'
      const updateResponse = await fetch(`/api/markets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "created",
          id: marketId,
          volume: liquidityPerMarket,
          conditionId,
          yesTokenId,
          noTokenId,
        }),
      })

      const updateResult = await updateResponse.json()
      if (!updateResult.success) {
        throw new Error(
          `Failed to update market status for market ID: ${marketId}`
        )
      }

      // Sync positions
      await syncUserMarketPositions({
        userAddress: proxyAddress!,
        marketId,
        yesTokenId: yesTokenId,
        noTokenId: noTokenId,
        conditionId: conditionId,
        tradeType: "SELL",
        side: "BOTH",
        bestPrices: {
          yesBestBid: 0.5,
          yesBestAsk: 0.5,
          noBestBid: 0.5,
          noBestAsk: 0.5,
        },
      })
    }
  }

  const handleCreateMarket = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setError(null)
      // Prepare market conditions
      const marketConditions = cards.map((card) => {
        if (card.category === "sports" && card.values) {
          const predictionDate = new Date(card.values?.match?.event_date)
          return {
            type: "sports",
            predictionDate: predictionDate.toISOString().slice(0, 10),
            variantKey: card.values?.metric,
            asset: card.values?.match?.id,
            metric: card.values?.metric,
            metricCondition: card.values?.condition,
            leagueAbbreviation: slugify(card.values?.league?.name ?? ""),
            data: {
              ...card.values?.match,
              sportId: card.values?.sport?.id,
              metric: card.values?.metric,
              condition: card.values?.condition,
              value: card.values?.value,
              predictionDate: predictionDate.toISOString(),
            },
          }
        } else {
          const predictionDate = new Date(card.values.date)
          return {
            type: "crypto",
            predictionDate: predictionDate.toISOString().slice(0, 10),
            variantKey: card.values.outcome,
            asset: card.values.fiat,
            metric: card.values.outcome,
            metricCondition: card.values.condition,
            data: {
              primaryCurrency: card.values.fiat,
              secondaryCurrency: card.values["second-fiat"],
              outcome: card.values.outcome,
              condition: card.values.condition,
              predictionDate: predictionDate.toISOString(),
              price: card.values.price,
              priceMax: card.values.price2,
            },
          }
        }
      })
      let imageUrl = ""

      if (formValues.image) {
        const formData = new FormData()
        formData.append("file", formValues.image)
        formData.append("userId", user?.id.toString() ?? "groovy")
        formData.append("marketName", formValues.marketName)

        const res = await fetch("/api/markets/upload", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()
        if (!res.ok || !data.url) {
          throw new Error("Image upload failed")
        }

        imageUrl = data.url
      }
      const body: any = {
        title: formValues.marketName,
        description: formValues.description,
        marketConditions,
        isCombined: formValues.isCombined,
      }

      if (imageUrl) {
        body.image = imageUrl
      }

      // Create market in database first
      const response = await fetch("/api/markets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error("Failed to save market to database")
      }

      const parentMarketId = result.data.parent.id
      const hasLiquidity = formValues.initialLiquidity > 0
      if (!formValues.isCombined && cards.length === 1) {
        await createBlockchainMarket(parentMarketId, false, hasLiquidity)

        if (formValues.initialLiquidity > 0) {
          await splitLiquidityAcrossMarkets(
            [parentMarketId],
            formValues.initialLiquidity
          )
        }
      } else if (formValues.isCombined) {
        await createBlockchainMarket(parentMarketId, false, hasLiquidity)

        if (formValues.initialLiquidity > 0) {
          await splitLiquidityAcrossMarkets(
            [parentMarketId],
            formValues.initialLiquidity
          )
        }
      } else {
        const childMarketIds: string[] = result.data.children.map(
          (child: any) => child.id
        )

        await createBlockchainMarket(childMarketIds, true, hasLiquidity)

        if (formValues.initialLiquidity > 0) {
          await splitLiquidityAcrossMarkets(
            childMarketIds,
            formValues.initialLiquidity
          )
        }

        await fetch(`/api/markets`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "created",
            id: result.data.parent.id,
            volume: formValues.initialLiquidity,
          }),
        })
      }

      toast({
        title: "Success",
        description: "Market created successfully!",
      })

      // Reset form
      setCards([])
      setFormValues({
        marketName: "",
        description: "",
        initialLiquidity: 100,
        isCombined: false,
        image: undefined,
      })
      setImagePreview(null)
      setProbability(50)
      router.push("/markets/latest")
    } catch (err) {
      setError(
        "Error creating market: " +
          (err instanceof Error ? err.message : String(err))
      )
      toast({
        title: "Error",
        description:
          "Failed to create market. Please check your inputs and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePostMarketCreation = async ({
    marketId,
    yesTokenId,
    noTokenId,
    conditionId,
  }: {
    marketId: string
    yesTokenId: string
    noTokenId: string
    conditionId: string
  }) => {
    const orders = generateInitialOrders({
      probability,
      initialLiquidity: formValues.initialLiquidity,
      yesTokenId,
      noTokenId,
      marketId,
      userAddress: proxyAddress!,
    })

    for (const order of orders) {
      const success = await handleLimitOrderDirect({
        proxyAddress: proxyAddress!,
        address: address!,
        signMessageAsync,
        approveERC1155,
        refetchAll,
        tokenId: order.tokenId,
        side: order.side as "BUY" | "SELL",
        marketId: order.marketId,
        conditionId,
        sharesAmount: order.amount,
        limitPrice: order.price,
      })

      if (!success) {
        throw new Error("Failed to place initial limit order")
      }
    }
  }

  return (
    <main className="grow bg-[#141414] py-4 text-white px-4 sm:px-0">
      <div className="max-w-[600px] mx-auto sm:px-4 pb-20 md:pb-4">
        <div className="grid grid-cols-1 gap-4">
          <h1 className="text-lg font-medium">Market creation</h1>

          <DescriptionCard
            marketName={formValues.marketName}
            description={formValues.description}
            onMarketNameChange={(value) =>
              handleDescriptionChange("marketName", value)
            }
            onDescriptionChange={(value) =>
              handleDescriptionChange("description", value)
            }
            onImageChange={(file) => handleDescriptionChange("image", file)}
            previewUrl={imagePreview}
          />

          {/* Combined Market Toggle */}
          {/* <div className="flex items-center justify-between p-3.5 bg-neutral-750 rounded-lg">
            <div>
              <h3 className="text-lg font-medium">Combined Market</h3>
              <p className="text-sm text-neutral-400 max-w-md">
                When enabled, all conditions will be part of a single market.
                When disabled, each condition will be created as a separate
                market grouped under a parent market.
              </p>
            </div>
            <Switch
              checked={formValues.isCombined}
              onCheckedChange={handleCombinedChange}
            />
          </div> */}

          {cards.map((card, index) => (
            <ConditionsCard
              id={card.id}
              key={card.id}
              index={index + 1}
              values={card.values}
              category={card.category}
              onDeleteCard={removeCard}
              onFieldChange={(fieldName, value) =>
                updateCardField(card.id, fieldName, value)
              }
              onCategoryChange={(category) =>
                updateCardCategory(card.id, category)
              }
              onSportsPredictionChange={(prediction) =>
                handleSportsPredictionChange(card.id, prediction)
              }
            />
          ))}
          {/* 
          <div className="flex justify-end">
            <Button onClick={addNewCard} variant="orchid">
              Add condition
            </Button>
          </div> */}

          <LiquidityCard
            initialLiquidity={formValues.initialLiquidity}
            onLiquidityChange={handleLiquidityChange}
            onPreviewMarket={handleCreateMarket}
            isSubmitting={isSubmitting}
            probability={probability}
            setProbability={setProbability}
          />

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
