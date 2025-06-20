import { useUserContext } from "@/providers/user-provider"
import { useQuery } from "@tanstack/react-query"

export type UserPosition = {
  marketId: string
  tokenId: string
  conditionId: string
  balance: number
  price: number | null
  value: number
}

export type PositionsResponse = {
  totalValue: number
  positions: UserPosition[]
}

export async function fetchUserPositions(): Promise<PositionsResponse> {
  const response = await fetch("/api/positions/user-positions")
  const data = await response.json()
  return data
}

export function useUserPositions() {
  const { proxyAddress, isConnected } = useUserContext()
  const { isPending, isError, data, refetch } = useQuery({
    queryKey: ["userPositions"],
    queryFn: fetchUserPositions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!proxyAddress && isConnected,
  })

  return {
    isLoading: isPending,
    isError: isError,
    totalValue: data?.totalValue ?? 0,
    positions: data?.positions ?? [],
    refetchPositionsValue: refetch,
  }
}
