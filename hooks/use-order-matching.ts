import { useState, useEffect } from "react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { Order } from "./use-order-creation"

export function useOrderMatching() {
  const { address, isConnected } = useAccount()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: undefined,
  })

  // Fetch all available orders
  const fetchOrders = async () => {
    if (!isConnected || !address) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/orders/user-orders?address=${address.toLowerCase()}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data = await response.json()
      setOrders(data.orders)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  // Initial load of orders
  useEffect(() => {
    if (isConnected && address) {
      fetchOrders()
    } else {
      setOrders([])
    }
  }, [isConnected, address])

  return {
    orders,
    loading,
    isProcessing: isApproving,
    error,
    fetchOrders,

    reset: () => {
      setError(null)
    },
  }
}
