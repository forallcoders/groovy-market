import { useQuery } from "@tanstack/react-query"

export interface PriceHistoryPoint {
  t: number
  p: number
}

export interface PriceHistoryResponseGrouped {
  history: {
    t: number
    p: number
    label: string
  }[]
  meta: any
}

export interface PriceHistoryResponseSingle {
  yes: PriceHistoryPoint[]
  no: PriceHistoryPoint[]
  meta: any
}

export const usePriceHistory = ({
  marketId,
  interval = "all",
}: {
  marketId: string
  interval: string
}) => {
  return useQuery({
    queryKey: ["priceHistory", marketId, interval],
    queryFn: async () => {
      const res = await fetch(
        `/api/markets/${marketId}/price-history?interval=${interval}`
      )
      if (!res.ok) throw new Error("Failed to fetch price history")
      return res.json()
    },
    refetchOnWindowFocus: false,
  })
}
