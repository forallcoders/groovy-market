import React from "react"
import { BUY_QUICK_ADDS, SELL_QUICK_ADDS } from "../../utils/constants"
import QuickAddButton from "./button/quick-add-button"
import { TradeType } from "@/types/Market"

export default function QuickAddSection({
  tradeType,
  handleQuickAdd,
  handleMaxAmount,
}: {
  tradeType: TradeType
  handleQuickAdd: (value: number) => void
  handleMaxAmount: () => void
}) {
  return (
    <div className="mt-2 ml-auto flex gap-2">
      {tradeType === "BUY" ? (
        <>
          {BUY_QUICK_ADDS.map((quickAdd) => (
            <QuickAddButton
              key={quickAdd}
              value={`+${quickAdd}`}
              onClick={() => handleQuickAdd(quickAdd)}
            />
          ))}
        </>
      ) : (
        <>
          {SELL_QUICK_ADDS.map((quickAdd) => (
            <QuickAddButton
              key={quickAdd}
              value={`${quickAdd}%`}
              onClick={() => handleQuickAdd(quickAdd)}
            />
          ))}
        </>
      )}
      <QuickAddButton onClick={handleMaxAmount} value="Max" />
    </div>
  )
}
