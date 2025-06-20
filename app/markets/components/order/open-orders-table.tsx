import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Order } from "@/hooks/market/use-user-orders"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { useGaslessTransactions } from "@/hooks/use-gasless-client"

export default function OpenOrdersTable({
  yesToken,
  showOptions,
  isCrypto = false,
  hasPositions = false,
  orders,
  refreshOrders,
  isTabView = false,
}: {
  yesToken: string
  showOptions: string[]
  isCrypto?: boolean
  hasPositions?: boolean
  orders?: Order[]
  refreshOrders: () => void
  isTabView?: boolean
}) {
  const [cancellingOrderHash, setCancellingOrderHash] = useState<string | null>(
    null
  )
  const { executeTransaction } = useGaslessTransactions()

  const handleCancelOrder = async (hash: string) => {
    try {
      setCancellingOrderHash(hash)

      // Step 1: Validate if the order is valid for cancellation
      const validateResponse = await fetch(
        `/api/orders/cancel-order/validate?orderHash=${hash}`
      )

      if (!validateResponse.ok) {
        const error = await validateResponse.json()
        throw new Error(
          error.message || "Failed to validate order cancellation"
        )
      }

      const { valid, order } = await validateResponse.json()

      if (!valid) {
        throw new Error("This order cannot be cancelled")
      }

      const cancelProxyResponse = await fetch(
        "/api/orders/cancel-order/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order,
          }),
        }
      )

      if (!cancelProxyResponse.ok) {
        const error = await cancelProxyResponse.json()
        throw new Error(
          error.message || "Failed to cancel order with proxy wallet"
        )
      }

      const { request } = await cancelProxyResponse.json()

      const result = await executeTransaction({
        targetContract: request.targetContract,
        amount: request.amount,
        data: request.data,
      })

      if (!result.success) {
        throw new Error("Failed to cancel order")
      }

      // Step 3: Update order status in the database
      const updateStatusResponse = await fetch("/api/orders/cancel-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderHash: hash,
          txHash: result?.result?.tx?.hash ?? "",
        }),
      })

      if (!updateStatusResponse.ok) {
        const error = await updateStatusResponse.json()
        throw new Error(error.message || "Failed to update order status")
      }

      refreshOrders()
    } catch (error) {
      console.error("Error cancelling order:", error)
    } finally {
      setCancellingOrderHash(null)
    }
  }

  const isYesToken = (tokenId: string) => {
    return yesToken === tokenId
  }

  // Calculate price from maker and taker amounts (price in cents)
  const calculatePrice = (order: Order) => {
    if (order.side === 1) {
      // SELL
      return (
        (Number(order.takerAmount) / Number(order.makerAmount)) *
        100
      ).toFixed(1)
    } else {
      // BUY
      return (
        (Number(order.makerAmount) / Number(order.takerAmount)) *
        100
      ).toFixed(1)
    }
  }

  // Calculate total in USD
  const calculateTotal = (order: Order) => {
    if (order.side === 1) {
      // SELL
      return `$${(Number(order.takerAmount) / 1000000).toFixed(0)}`
    } else {
      // BUY
      return `$${(Number(order.makerAmount) / 1000000).toFixed(0)}`
    }
  }

  // Calculate filled amount
  const calculateFilled = (order: Order) => {
    const filledAmountRaw = order.filledAmount
      ? BigInt(order.filledAmount)
      : BigInt(0)
    const makerAmountRaw = BigInt(order.makerAmount)
    const takerAmountRaw = BigInt(order.takerAmount)

    let filledShares = 0
    let totalShares = 0

    if (order.side === 0) {
      if (makerAmountRaw > BigInt(0)) {
        filledShares =
          Number((filledAmountRaw * takerAmountRaw) / makerAmountRaw) / 1000000
        totalShares = Number(takerAmountRaw) / 1000000
      }
    } else {
      filledShares = Number(filledAmountRaw) / 1000000
      totalShares = Number(makerAmountRaw) / 1000000
    }

    return `${filledShares.toFixed(0)} / ${totalShares.toFixed(0)}`
  }

  const formatExpiration = (expiration: number) => {
    if (!expiration || expiration === 0) return "Until Cancelled"

    const expirationDate = new Date(expiration * 1000)
    const now = new Date()

    if (expirationDate <= now) {
      return "Expired"
    }

    return `In ${formatDistanceToNow(expirationDate)}`
  }

  const showOrders = (orders?.length ?? 0) > 0

  if (!showOrders) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-b-[10px] border-[1.5px] border-[#353739]  backdrop-blur-sm",
        {
          "rounded-t-[10px]": !hasPositions || isTabView,
          "p-4": !isTabView,
          "p-2": isTabView,
        }
      )}
    >
      {!isTabView && (
        <h2 className="text-xl font-semibold mb-4">Open Orders</h2>
      )}
      <div className="max-h-[260px] overflow-y-auto">
        <Table className="table-fixed w-full">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-white hover:bg-transparent">
              <TableHead className="text-white font-bold">Side</TableHead>
              <TableHead className="text-white font-bold">Outcome</TableHead>
              <TableHead className="text-white font-bold">Filled</TableHead>
              <TableHead className="text-white font-bold">Stake</TableHead>
              <TableHead className="text-white font-bold text-center">
                Expiration
              </TableHead>
              <TableHead className="text-right text-white font-bold"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders?.map((order, index) => {
              const token = isYesToken(order.tokenId.toString())
                ? showOptions[0]
                : showOptions[1]
              const label = token
              return (
                <TableRow
                  key={index}
                  className="border-white hover:bg-muted/20"
                >
                  <TableCell>{order.side === 1 ? "Sell" : "Buy"}</TableCell>
                  <TableCell>
                    <span className="flex flex-col gap-1">
                      <span
                        className={cn("rounded p-1 text-sm w-fit font-medium", {
                          "text-white bg-[#CC0066]":
                            isYesToken(order.tokenId.toString()) && !isCrypto,
                          "text-white bg-[#9900CC]":
                            !isYesToken(order.tokenId.toString()) && !isCrypto,
                          "text-white bg-[#157245]":
                            isYesToken(order.tokenId.toString()) && isCrypto,
                          "text-white bg-[#62321E]":
                            !isYesToken(order.tokenId.toString()) && isCrypto,
                        })}
                      >
                        {label}
                      </span>
                      <span>{calculatePrice(order)}¢</span>
                    </span>
                  </TableCell>
                  <TableCell>{calculateFilled(order)}</TableCell>
                  <TableCell>{calculateTotal(order)}</TableCell>
                  <TableCell className="text-center">
                    {formatExpiration(Number(order.expiration))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      className="h-fit w-fit p-2 bg-[#4E5458] text-white"
                      disabled={
                        cancellingOrderHash === order.orderHash ||
                        order.status === "cancelled"
                      }
                      onClick={() => handleCancelOrder(order.orderHash)}
                    >
                      {cancellingOrderHash === order.orderHash ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Cancel"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
