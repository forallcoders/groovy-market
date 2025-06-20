"use client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MarketInfo,
  MarketPanelVariant,
  OrderType,
  TokenOption,
  TradeType,
} from "@/types/Market"
import { Dispatch, SetStateAction, useState } from "react"
import SplitMergeModal from "./split-merge-modal"
import MarketPanelForm from "./market-panel-form"
import { useMarketContext } from "@/providers/market-provider"

interface MarketPanelProps {
  market?: MarketInfo
  selectedTokenOption: TokenOption
  setSelectedTokenOption: Dispatch<SetStateAction<TokenOption>>
  orderbookData: any
  bestPrices: any
  selectedTeam?: {
    name: string
    logo: string
    shortName?: string
  }
  variant?: MarketPanelVariant
  teamAbbreviations?: {
    home: string
    away: string
  }
}

export default function MarketPanel({
  market,
  setSelectedTokenOption,
  selectedTokenOption,
  orderbookData,
  bestPrices,
  selectedTeam,
  variant = "default",
  teamAbbreviations = { home: "HOME", away: "AWAY" },
}: MarketPanelProps) {
  const [tradeType, setTradeType] = useState<TradeType>("BUY")
  const [selectedOrderType, setSelectedOrderType] =
    useState<OrderType>("market")
  const [displayedOrderType, setDisplayedOrderType] =
    useState<OrderType>("market")
  const [isSplitMergeModalOpen, setIsSplitMergeModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<"split" | "merge">("split")
  const { selectedMarketId } = useMarketContext()
  const orderTypes = ["market", "limit", "split", "merge"] as OrderType[]

  const shouldShowTeamHeader =
    variant === "default" && selectedTeam?.name && selectedTeam.logo

  const tokenLabels =
    variant === "teamAbbreviations"
      ? { YES: teamAbbreviations.home, NO: teamAbbreviations.away }
      : undefined

  const handleOrderTypeChange = (value: OrderType) => {
    setSelectedOrderType(value)

    if (value === "split" || value === "merge") {
      setModalAction(value)
      setIsSplitMergeModalOpen(true)
    } else {
      setDisplayedOrderType(value)
    }
  }

  return (
    <div className="sm:col-start-2 lg:col-start-3 px-4 sm:px-0 relative w-[300px]">
      <div className="border border-[#353739] rounded-lg top-4 overflow-hidden sticky h-fit mb-3">
        {shouldShowTeamHeader && (
          <div className="flex items-center justify-between p-[10px] border-b-2 border-b-[#353739]">
            <div className="flex items-center grow gap-2">
              <img
                src={selectedTeam.logo}
                alt={`${selectedTeam.name} logo`}
                className="w-8 h-8 object-cover"
                width={32}
                height={32}
              />
              <span className="font-medium grow">{selectedTeam.name}</span>
            </div>
          </div>
        )}

        {/* Tabs and Market Selector */}
        <div className="flex items-center border-b-2 border-[#353739] justify-between">
          <div className="grid grid-cols-2 gap-2 px-[10px]">
            <button
              onClick={() => setTradeType("BUY")}
              className={`py-3 px-1 text-center font-medium relative ${
                tradeType === "BUY"
                  ? "text-white border-b-2 border-b-white -mb-[2px]"
                  : "text-[#81898E] hover:text-gray-300"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTradeType("SELL")}
              className={`py-3 px-1 text-center font-medium relative ${
                tradeType === "SELL"
                  ? "text-white border-b-2 border-b-white -mb-[2px]"
                  : "text-[#81898E] hover:text-gray-300"
              }`}
            >
              Sell
            </button>
          </div>
          <Select
            onValueChange={handleOrderTypeChange}
            value={selectedOrderType}
          >
            <SelectTrigger className="w-fit text-sm border-0 capitalize">
              <SelectValue placeholder={selectedOrderType} />
            </SelectTrigger>
            <SelectContent>
              {orderTypes.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <MarketPanelForm
          tradeType={tradeType}
          market={market}
          orderType={displayedOrderType}
          selectedOption={selectedTokenOption}
          setSelectedOption={setSelectedTokenOption}
          orderBookData={orderbookData}
          bestPrices={bestPrices}
          variant={variant}
          tokenLabels={tokenLabels}
          selectedMarketId={selectedMarketId}
        />
        {(selectedOrderType === "split" || selectedOrderType === "merge") && (
          <SplitMergeModal
            open={isSplitMergeModalOpen}
            setOpen={(open) => {
              setIsSplitMergeModalOpen(open)
              if (!open) setSelectedOrderType(displayedOrderType)
            }}
            market={market!}
            action={modalAction}
          />
        )}
      </div>
    </div>
  )
}
