import { useQuery } from "@tanstack/react-query"

export interface Order {
  orderHash: string
  salt: bigint
  maker: `0x${string}`
  signer: `0x${string}`
  taker: `0x${string}`
  tokenId: bigint
  makerAmount: bigint
  takerAmount: bigint
  expiration: bigint
  nonce: bigint
  feeRateBps: bigint
  side: number
  signatureType: number
  signature: `0x${string}`
  filledAmount: string | null
  status: string
  marketId: string
}

type ResponseType = Order[] | Record<string, Order[]>

export const useUserOrders = (marketId: string) => {
  const { data, isLoading, error, refetch } = useQuery<ResponseType>({
    queryKey: ["userOrders", marketId],
    queryFn: async () => {
      if (!marketId) return []
      const response = await fetch(
        `/api/orders/user-orders?marketId=${marketId}`
      )
      if (!response.ok) throw new Error("Failed to fetch user orders")
      return await response.json()
    },
    enabled: !!marketId,
  })

  const ordersByMarket: Record<string, Order[]> = Array.isArray(data)
    ? data.reduce((acc, order) => {
        if (!acc[order.marketId]) acc[order.marketId] = []
        acc[order.marketId].push(order)
        return acc
      }, {} as Record<string, Order[]>)
    : data ?? {}

  const flatOrders: Order[] = Array.isArray(data)
    ? data
    : Object.values(data ?? {}).flat()

  return {
    orders: flatOrders,
    ordersByMarket,
    isLoading,
    error,
    refetch,
  }
}
