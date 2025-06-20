import { OrderType, TradeType } from "@/types/Market"
import Image from "next/image"

interface MarketOrderSummaryProps {
  amount: number
  shares?: number
  cost?: number
  averagePrice?: number
  tradeType: TradeType
}

interface LimitOrderSummaryProps {
  limitPrice: string
  sharesAmount: string
  tradeType: TradeType
  calculateTotalCost: (shares: number, limitPrice: number) => number
}

interface OrderSummaryProps {
  orderType: OrderType
  marketSummaryProps?: MarketOrderSummaryProps
  limitSummaryProps?: LimitOrderSummaryProps
}

export function OrderSummary({
  orderType,
  marketSummaryProps,
  limitSummaryProps,
}: OrderSummaryProps) {
  if (
    orderType === "market" &&
    marketSummaryProps &&
    marketSummaryProps.amount > 0
  ) {
    return (
      <div className="mt-3 flex justify-between px-4 pt-3 border-t-2 border-[#353739]">
        <div>
          <p className="text-[#81898E] text-base flex items-center gap-1">
            To win{" "}
            <Image src="/dollars.png" alt="dollars" width={20} height={16} />
          </p>
          <p className="text-[#81898E] text-xs">
            Avg. price: $
            {marketSummaryProps?.averagePrice
              ? marketSummaryProps.averagePrice.toFixed(2)
              : "0"}
          </p>
        </div>
        <span className="text-[#4EA50B] text-2xl">
          $
          {marketSummaryProps.tradeType === "BUY"
            ? marketSummaryProps?.shares?.toFixed(2)
            : marketSummaryProps?.cost?.toFixed(2)}
        </span>
      </div>
    )
  }

  if (
    orderType === "limit" &&
    limitSummaryProps &&
    limitSummaryProps.limitPrice &&
    limitSummaryProps.sharesAmount
  ) {
    return (
      <div className="mt-3 px-4 pt-3 border-t-2 border-[#353739]">
        {limitSummaryProps.tradeType === "BUY" && (
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-[#81898E] text-base">Total</p>
              <p className="text-[#81898E] text-xs">{"Amount you'll spend"}</p>
            </div>
            <span className="text-blue-400 text-2xl">
              $
              {limitSummaryProps
                .calculateTotalCost(
                  Number(limitSummaryProps.sharesAmount),
                  Number(limitSummaryProps.limitPrice)
                )
                .toFixed(2)}
            </span>
          </div>
        )}

        {/* To Win section */}
        <div className="flex justify-between">
          <div>
            <p className="text-[#81898E] text-base flex items-center gap-1">
              {limitSummaryProps.tradeType === "BUY"
                ? "To win"
                : "You'll receive"}{" "}
              <Image src="/dollars.png" alt="dollars" width={20} height={16} />
            </p>
            <p className="text-[#81898E] text-xs">
              Price: {parseFloat(limitSummaryProps.limitPrice).toFixed(2)}¢ per
              token
            </p>
          </div>
          <span className="text-[#4EA50B] text-2xl">
            $
            {limitSummaryProps.tradeType === "BUY"
              ? Number(limitSummaryProps.sharesAmount).toFixed(2)
              : limitSummaryProps
                  .calculateTotalCost(
                    Number(limitSummaryProps.sharesAmount),
                    Number(limitSummaryProps.limitPrice)
                  )
                  .toFixed(2)}
          </span>
        </div>
      </div>
    )
  }

  return null
}
