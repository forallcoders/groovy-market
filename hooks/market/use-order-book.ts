import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

export const useOrderBook = (marketId: string) => {
  const [activeTab, setActiveTab] = useState<"YES" | "NO">("YES")

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orderBook", marketId],
    queryFn: async () => {
      if (!marketId) return { ordersByMarketId: {} }

      const response = await fetch(`/api/markets/${marketId}/orderbook`)
      if (!response.ok)
        throw new Error(`Failed to fetch orderbook for ${marketId}`)

      const json = await response.json()

      return {
        ordersByMarketId: json.ordersByMarketId ?? {},
      }
    },
    enabled: !!marketId,
  })

  const getOrderBook = (id: string) =>
    data?.ordersByMarketId?.[id] || {
      yesAsks: [],
      noAsks: [],
      noBids: [],
      yesBids: [],
      bestPrices: {},
    }

  const allMarketIds = useMemo(() => {
    return Object.keys(data?.ordersByMarketId ?? {})
  }, [data])

  return {
    activeTab,
    setActiveTab,
    orders: data,
    isLoading,
    error,
    refetch,
    getOrderBook,
    allMarketIds,
  }
}
