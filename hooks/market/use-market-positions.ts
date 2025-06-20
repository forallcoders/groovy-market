import { useUserContext } from "@/providers/user-provider"
import { useQuery } from "@tanstack/react-query"

export type MarketPosition = {
  marketId: string
  tokenId: string
  conditionId: string
  balance: number
  isYesToken: boolean
  price: number | null
  value: number
  entryPrice: number
  status: string
}

type ResponseType = MarketPosition[] | Record<string, MarketPosition[]>

export async function fetchUserMarketPositions(
  marketId: string
): Promise<ResponseType> {
  if (!marketId) return []

  const response = await fetch(
    `/api/positions/market-positions?marketId=${marketId}`
  )

  if (!response.ok) {
    throw new Error("Failed to fetch market positions")
  }

  const data = await response.json()
  return data.positions
}

export function useUserMarketPositions(marketId: string) {
  const { proxyAddress, isConnected } = useUserContext()

  const { data, isLoading, error, refetch } = useQuery<ResponseType>({
    queryKey: ["userMarketPositions", marketId],
    queryFn: () => fetchUserMarketPositions(marketId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!proxyAddress && isConnected && !!marketId,
  })

  const positionsByMarket: Record<string, MarketPosition[]> = Array.isArray(
    data
  )
    ? data.reduce((acc, pos) => {
        if (!acc[pos.marketId]) acc[pos.marketId] = []
        acc[pos.marketId].push(pos)
        return acc
      }, {} as Record<string, MarketPosition[]>)
    : data || {}

  const flatPositions: MarketPosition[] = Array.isArray(data)
    ? data
    : Object.values(data || {}).flat()

  return {
    positions: flatPositions,
    isLoading,
    error,
    refetch,
    positionsByMarket,
  }
}
