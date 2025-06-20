import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  MarketPanelVariant,
  TokenLabels,
  TokenOption,
  TradeType,
} from "@/types/Market"
import { useMemo } from "react"

interface TokenSelectorProps {
  selectedOption: TokenOption
  setSelectedOption: (option: TokenOption) => void
  bestPrices?: any
  tradeType: TradeType
  variant?: MarketPanelVariant
  tokenLabels?: TokenLabels
}

export function TokenSelector({
  selectedOption,
  setSelectedOption,
  bestPrices,
  tradeType,
  variant = "default",
  tokenLabels,
}: TokenSelectorProps) {
  const firstPrice = useMemo(() => {
    if (!bestPrices) return 0
    const value =
      tradeType === "BUY"
        ? bestPrices?.yesBestAsk || 0
        : bestPrices?.yesBestBid || 0
    return value * 100
  }, [bestPrices, tradeType])

  const secondPrice = useMemo(() => {
    if (!bestPrices) return 0
    const value =
      tradeType === "BUY"
        ? bestPrices?.noBestAsk || 0
        : bestPrices?.noBestBid || 0
    return value * 100
  }, [bestPrices, tradeType])
  const yesLabel =
    variant === "teamAbbreviations" && tokenLabels ? tokenLabels.YES : "Yes"
  const noLabel =
    variant === "teamAbbreviations" && tokenLabels ? tokenLabels.NO : "No"

  return (
    <div className="grid grid-cols-2 gap-1 mt-3 px-4">
      <Button
        className={cn("py-3 cursor-pointer w-full rounded-[5px] ", {
          "bg-[#00CC66] text-white hover:bg-[#00CC66]":
            selectedOption === "YES",
          "bg-[#4E5458] text-gray-300 hover:bg-[#4E5458]":
            selectedOption === "NO",
        })}
        onClick={() => setSelectedOption("YES")}
      >
        <span className="ml-auto font-bold text-sm">{yesLabel}</span>
        <span className="ml-auto">{firstPrice.toFixed(0)}¢</span>
      </Button>
      <Button
        className={cn("py-3 cursor-pointer w-full rounded-[5px]", {
          "bg-[#00CC66] text-white hover:bg-[#00CC66]": selectedOption === "NO",
          "bg-[#4E5458] text-gray-300 hover:bg-[#4E5458]":
            selectedOption === "YES",
        })}
        onClick={() => setSelectedOption("NO")}
      >
        <span className="ml-auto font-bold text-sm">{noLabel}</span>
        <span className="ml-auto">{secondPrice.toFixed(0)}¢ </span>
      </Button>
    </div>
  )
}
