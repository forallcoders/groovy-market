import React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface InitialLiquiditySummaryProps {
  initialLiquidity: string
  probability: number
  yesBidAmount: string
  yesAskAmount: string
  noBidAmount: string
  noAskAmount: string
}

export default function InitialLiquiditySummary({
  initialLiquidity,
  probability,
  yesBidAmount,
  yesAskAmount,
  noBidAmount,
  noAskAmount,
}: InitialLiquiditySummaryProps) {
  const totalLiquidity = parseFloat(initialLiquidity || "0")
  const yesBidAmountNum = parseFloat(yesBidAmount || "0")
  const yesAskAmountNum = parseFloat(yesAskAmount || "0")
  const noBidAmountNum = parseFloat(noBidAmount || "0")
  const noAskAmountNum = parseFloat(noAskAmount || "0")
  const totalOrderAmount =
    yesBidAmountNum + yesAskAmountNum + noBidAmountNum + noAskAmountNum
  const yesBidPercent = Math.round(
    (yesBidAmountNum / (totalLiquidity * 2)) * 100
  )
  const yesAskPercent = Math.round(
    (yesAskAmountNum / (totalLiquidity * 2)) * 100
  )
  const noBidPercent = Math.round((noBidAmountNum / (totalLiquidity * 2)) * 100)
  const noAskPercent = Math.round((noAskAmountNum / (totalLiquidity * 2)) * 100)
  const percentInOrders =
    yesBidPercent + yesAskPercent + noBidPercent + noAskPercent

  return (
    <Card className="bg-gray-50 border-gray-200 mb-6">
      <CardContent className="pt-4">
        <h4 className="font-medium text-gray-800 mb-2">
          Initial Liquidity Distribution
        </h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total USDC Provided:</span>
            <span className="font-medium">
              {totalLiquidity.toLocaleString()} USDC
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Total Tokens Received:</span>
            <span className="font-medium">
              {totalLiquidity.toLocaleString()} YES +{" "}
              {totalLiquidity.toLocaleString()} NO
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Tokens In Order Book:</span>
            <span className="font-medium">
              {totalOrderAmount.toLocaleString()} ({percentInOrders}%)
            </span>
          </div>

          <hr className="my-2" />

          <div className="flex justify-between">
            <span className="text-gray-600">YES Tokens (Bid Orders):</span>
            <span className="font-medium">
              {yesBidAmountNum.toLocaleString()} ({yesBidPercent}%)
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">YES Tokens (Ask Orders):</span>
            <span className="font-medium">
              {yesAskAmountNum.toLocaleString()} ({yesAskPercent}%)
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">NO Tokens (Bid Orders):</span>
            <span className="font-medium">
              {noBidAmountNum.toLocaleString()} ({noBidPercent}%)
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">NO Tokens (Ask Orders):</span>
            <span className="font-medium">
              {noAskAmountNum.toLocaleString()} ({noAskPercent}%)
            </span>
          </div>

          <hr className="my-2" />

          <div className="flex justify-between">
            <span className="text-gray-600">Market Probability:</span>
            <span className="font-medium">
              {probability}% YES / {100 - probability}% NO
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
