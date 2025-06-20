import { TokenOption, TradeType } from "@/types/Market"
import QuickAddSection from "./quick-add-section"

interface MarketOrderInputsProps {
  tradeType: TradeType
  amount: number
  handleMarketInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleQuickAdd: (value: number) => void
  handleMaxAmount: () => void
  balance: number
  selectedOption: TokenOption
  yesTokenBalance: string
  noTokenBalance: string
  error: string | null
}

export function MarketOrderInputs({
  tradeType,
  amount,
  handleMarketInputChange,
  handleQuickAdd,
  handleMaxAmount,
  balance,
  selectedOption,
  yesTokenBalance,
  noTokenBalance,
  error,
}: MarketOrderInputsProps) {
  return (
    <div className="my-3 px-4 gap-1 flex justify-between">
      <div className="w-1/2">
        <span className="text-base">
          {tradeType === "BUY" ? "Amount" : "Shares"}
        </span>
        {tradeType === "BUY" && (
          <p className="text-[11px] font-normal text-[#81898E]">
            Balance: ${balance.toFixed(2)}
          </p>
        )}
        {tradeType === "SELL" && (
          <p className="text-[11px] font-normal text-[#81898E]">
            Balance:{" "}
            {selectedOption === "YES"
              ? Number(yesTokenBalance) / 10 ** 6
              : Number(noTokenBalance) / 10 ** 6}
          </p>
        )}
      </div>
      <div className="flex flex-col w-1/2 items-center">
        <div className="flex w-full rounded-[10px] p-[10px] border-2 border-[#81898E] text-right text-2xl font-medium">
          {tradeType === "BUY" && (
            <span className="text-2xl text-[#81898E]">$</span>
          )}
          <input
            type="number"
            value={amount}
            onChange={handleMarketInputChange}
            onWheel={(e) => e.currentTarget.blur()}
            step="0"
            min="0"
            className="flex-1 bg-transparent w-full outline-none text-right text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
        <QuickAddSection
          handleMaxAmount={handleMaxAmount}
          handleQuickAdd={handleQuickAdd}
          tradeType={tradeType}
        />
      </div>
    </div>
  )
}
