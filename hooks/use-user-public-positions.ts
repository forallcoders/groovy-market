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

export async function fetchUserPositions(
  user?: string
): Promise<PositionsResponse> {
  const response = await fetch(
    `/api/positions/user-positions-public?user=${user}`
  )
  const data = await response.json()
  return data
}

export function useUserPublicPositions(user: string) {
  const { isPending, isError, data, refetch } = useQuery({
    queryKey: ["userPositions", user],
    queryFn: () => fetchUserPositions(user),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  return {
    isLoading: isPending,
    isError: isError,
    totalValue: data?.totalValue ?? 0,
    positions: data?.positions ?? [],
    refetchPositionsValue: refetch,
  }
}
