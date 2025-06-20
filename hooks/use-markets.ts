import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { useState, useEffect } from "react"
import { useWatchContractEvent } from "wagmi"

export interface Market {
  conditionId: `0x${string}`
  yesTokenId: bigint
  noTokenId: bigint
  question: string
  createdAt: number
  resolved: boolean
}

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useWatchContractEvent({
    address: ctfExchangeContract.address,
    abi: ctfExchangeContract.abi,
    eventName: "TokenRegistered",
    onLogs() {
      fetchMarkets()
    },
  })

  const fetchMarkets = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/markets")

      if (!response.ok) {
        throw new Error("Failed to fetch markets")
      }

      const data = await response.json()

      setMarkets(data)
    } catch (err) {
      console.error("Error fetching markets:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch markets")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
  }, [])

  return {
    markets,
    isLoading,
    error,
    refreshMarkets: fetchMarkets,
  }
}
