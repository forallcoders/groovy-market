import { cn } from "@/lib/utils"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useMarketContext } from "@/providers/market-provider"

type Order = {
  price: number
  shares: number
  total: number
}

export type OrderBookProps = {
  tabs: Array<"YES" | "NO">
  asksData: Record<string, Order[]>
  bidsData: Record<string, Order[]>
  activeTab: "YES" | "NO"
  setActiveTab: Dispatch<SetStateAction<"YES" | "NO">>
  showOptions: string[]
  isTabView?: boolean
}

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

const OrderBook = ({
  tabs,
  asksData,
  bidsData,
  activeTab,
  setActiveTab,
  showOptions,
  isTabView = false,
}: OrderBookProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const spreadRef = useRef<HTMLDivElement>(null)
  const orderBookContainerRef = useRef<HTMLDivElement>(null)
  const isYesToken = activeTab === tabs[0]
  const asks = asksData[activeTab] || []
  const bids = bidsData[activeTab] || []
  const { marketPanelVariant, selectedTokenOption, setSelectedTokenOption } =
    useMarketContext()
  const maxAskTotal = asks.length > 0 ? asks[0].total : 0
  const maxBidTotal = bids.length > 0 ? bids[bids.length - 1].total : 0

  const highestAsk = asks.length > 0 ? asks[asks.length - 1].price : 0
  const lowestBid = bids.length > 0 ? bids[0].price : 0

  const spread = Math.max(0, highestAsk - lowestBid)

  const displayPrice = isYesToken ? highestAsk : lowestBid

  useEffect(() => {
    if (isTabView) return
    const timer = setTimeout(() => {
      if (spreadRef.current) {
        spreadRef.current.scrollIntoView({
          behavior: "auto",
          block: "center",
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [activeTab, asks.length, bids.length, spreadRef.current])

  useEffect(() => {
    if (marketPanelVariant === "teamAbbreviations") {
      setActiveTab(selectedTokenOption)
    }
  }, [selectedTokenOption, marketPanelVariant, setActiveTab])

  return (
    <div
      className={cn(
        "text-base rounded-[10px] w-full flex flex-col overflow-hidden",
        {
          "pb-3": !isOpen,
          "pt-3 border-[1.5px] border-[#353739] ": !isTabView,
        }
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {!isTabView && (
          <CollapsibleTrigger className="w-full">
            <div className="flex flex-row justify-between items-center px-4">
              <div className="text-lg font-medium">Order book</div>
              <ChevronDown className={isOpen ? "rotate-180" : ""} />
            </div>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>
          <div className="border-b-2 border-b-[#353739] px-4 mt-3">
            {/* Tabs */}
            <div className="flex gap-5">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab)
                    setSelectedTokenOption(tab)
                  }}
                  className={`pb-3 text-sm -mb-[2px] font-medium ${
                    activeTab === tab
                      ? "border-b-2 border-b-white"
                      : "text-[#81898E]"
                  }`}
                >
                  Trade {showOptions ? showOptions[index] : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] text-xs text-[#81898E] text-center pt-4 font-medium">
            <div className="pl-4 text-start">
              Trade {activeTab === "YES" ? showOptions[0] : showOptions[1]}
            </div>
            <div>Price</div>
            <div>Shares</div>
            <div>Total</div>
          </div>

          {/* Asks */}
          <div
            ref={orderBookContainerRef}
            className="max-h-[400px] overflow-y-auto custom-scrollbar"
          >
            <div className="mt-[0.8rem]">
              {asks.map((ask, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] h-[20px] text-xs text-center font-medium hover:bg-[#DE4702]/20"
                >
                  <div className="flex">
                    <div
                      style={{
                        width: `${(ask.total / maxAskTotal) * 100}%`,
                      }}
                      className="bg-[#DE4702]/20 h-full"
                    ></div>
                    <div className="py-[2px]">
                      {i === asks.length - 1 ? (
                        <div className=" px-[2px] ml-1 text-[10px] text-white bg-[#DE4702] rounded-[2px]">
                          Asks
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                  <div className="text-[#DE4702]">{ask.price}¢</div>
                  <div>{ask.shares.toLocaleString()}</div>
                  <div>{formatUSD(ask.total)}</div>
                </div>
              ))}
            </div>

            {/* Table Mid Headers */}
            <div
              ref={spreadRef}
              className="grid grid-cols-[1fr_1fr] text-xs text-[#81898E] text-center py-2 border-y-2 border-[#353739] my-2"
            >
              <div className="pl-4 text-start">
                Last {displayPrice > 0 ? `${displayPrice}¢` : "-"}
              </div>
              <div className="whitespace-nowrap">Spread: {spread}¢</div>
              <div></div>
              <div></div>
            </div>

            {/* Bids */}
            <div>
              {bids.map((bid, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] h-[20px] text-xs font-medium text-center hover:bg-[#27AE60]/20"
                >
                  <div className="flex">
                    <div
                      style={{
                        width: `${(bid.total / maxBidTotal) * 100}%`,
                      }}
                      className={cn("bg-[#27AE60]/20 h-full", {
                        "rounded-bl-[5px]": i === bids.length - 1,
                      })}
                    ></div>
                    <div className="py-[2px]">
                      {i === 0 && (
                        <div className="text-[10px] bg-[#27AE60] text-white rounded-[2px] px-[2px] ml-1">
                          Bids
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[#27AE60]">{bid.price}¢</div>
                  <div>{bid.shares.toLocaleString()}</div>
                  <div>{formatUSD(bid.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default OrderBook
