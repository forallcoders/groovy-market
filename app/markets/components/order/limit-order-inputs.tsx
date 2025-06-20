import { TokenOption, TradeType } from "@/types/Market"
import QuickAddSection from "./quick-add-section"

interface LimitOrderInputsProps {
  limitPrice: string
  handleLimitPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  limitPriceError: string | null
  sharesAmount: string
  handleSharesAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleQuickAdd: (value: number) => void
  handleMaxAmount: () => void
  tradeType: TradeType
  selectedOption: TokenOption
  yesTokenBalance: string
  noTokenBalance: string
  error: string | null
}

export function LimitOrderInputs({
  limitPrice,
  handleLimitPriceChange,
  limitPriceError,
  sharesAmount,
  handleSharesAmountChange,
  handleQuickAdd,
  handleMaxAmount,
  tradeType,
  selectedOption,
  yesTokenBalance,
  noTokenBalance,
  error,
}: LimitOrderInputsProps) {
  return (
    <>
      <div className="my-3 px-4 gap-1 flex justify-between">
        <div className="w-1/2">
          <span className="text-base">Limit Price (¢)</span>
          <p className="text-xs mt-1 text-[#81898E]">
            Price in cents per token (1-99)
          </p>
        </div>
        <div className="flex flex-col w-1/2 items-center">
          <div className="flex w-full rounded-[10px] p-[10px] border-2 border-[#81898E] text-right text-2xl font-medium">
            <span className="text-2xl text-[#81898E]">$</span>
            <input
              type="text"
              value={limitPrice}
              onChange={handleLimitPriceChange}
              min="1"
              max="99"
              className="flex-1 bg-transparent w-full outline-none text-right text-2xl"
            />
          </div>
          {limitPriceError && (
            <p className="text-red-600 text-xs mt-1">{limitPriceError}</p>
          )}
        </div>
      </div>

      <div className="my-3 px-4 gap-1 flex justify-between">
        <div className="w-1/2">
          <span className="text-base">Shares</span>
          {tradeType === "SELL" && (
            <p className="text-xs mt-1 text-[#81898E]">
              Balance:{" "}
              {selectedOption === "YES"
                ? Number(yesTokenBalance) / 10 ** 6
                : Number(noTokenBalance) / 10 ** 6}
            </p>
          )}
        </div>
        <div className="flex flex-col w-1/2 items-center">
          <div className="flex border-2 border-[#81898E] rounded-[10px] p-2">
            <input
              type="text"
              value={sharesAmount}
              onChange={handleSharesAmountChange}
              className="flex-1 bg-transparent w-full outline-none text-right text-2xl"
            />
          </div>
          <QuickAddSection
            handleMaxAmount={handleMaxAmount}
            handleQuickAdd={handleQuickAdd}
            tradeType={tradeType}
          />
        </div>
      </div>
      {error && (
        <div className="px-4 mb-3">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}
    </>
  )
}
