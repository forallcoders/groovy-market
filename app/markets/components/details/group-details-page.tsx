/* eslint-disable @next/next/no-img-element */
"use client"

import OpenOrdersTable from "@/app/markets/components/order/open-orders-table"
import UserMarketPositions from "@/app/markets/components/order/user-positions-table"
import MarketSummary from "@/app/markets/components/details/market-summary"
import OrderBook from "@/app/markets/components/details/order-book"
import PredictionChart from "@/app/markets/components/details/prediction-chart"
import Rules from "@/app/markets/components/details/rules"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserMarketPositions } from "@/hooks/market/use-market-positions"
import { useOrderBook } from "@/hooks/market/use-order-book"
import { useUserOrders } from "@/hooks/market/use-user-orders"
import { useMarketContext } from "@/providers/market-provider"
import { TokenOption } from "@/types/Market"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import CommentsSection from "@/app/markets/components/details/comments"
import GroupedPredictionChart from "./group-prediction-chart"
import { generateRulesText } from "../../utils/rules"
import RelatedMarkets from "./related-markets"

const generateColor = (index: number, total: number) => {
  const hue = (index * (360 / total)) % 360
  return `hsl(${hue}, 70%, 55%)`
}

const getMarketData = (market: any, openMarketId: string | null) => {
  const marketsData = market?.markets ?? []
  if (!openMarketId) {
    return marketsData[0].data
  }
  const selectedMarket = marketsData.find((m: any) => m.id === openMarketId)
  return selectedMarket?.data
}

export default function GroupDetailsPage({ market }: { market: any }) {
  const router = useRouter()
  const { leagueName } = useMarketContext()
  const isCrypto = leagueName === "Crypto"
  const [openMarketId, setOpenMarketId] = useState<string | null>(null)
  const { ordersByMarket, refetch: refreshOrders } = useUserOrders(market.id)
  const { positionsByMarket, refetch: refreshPositions } =
    useUserMarketPositions(market.id)
  const {
    activeTab,
    setActiveTab,
    getOrderBook,
    refetch: refreshOrderbook,
  } = useOrderBook(market.id)

  const marketsData = market?.markets ?? []

  const handleRefreshAll = () => {
    refreshPositions()
    refreshOrderbook()
    refreshOrders()
  }
  const availableLabels = marketsData.map((item: any, index: number) => ({
    label: item.title,
    color: generateColor(index, marketsData.length),
  }))
  const marketData = getMarketData(market, openMarketId)

  const text = isCrypto ? [generateRulesText(marketData)] : [""]

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-0">
      <div className="flex gap-2 cursor-pointer" onClick={() => router.back()}>
        <ArrowLeft className="h-6 w-6" />
        <span>Go back</span>
      </div>

      <div className="flex items-center gap-4">
        <img
          src={market.image}
          alt={market.title}
          width={60}
          height={60}
          className="rounded-md"
        />
        <div>
          <h2 className="text-lg font-medium">{market.title}</h2>
          <div className="text-sm text-[#81898E] flex gap-4 items-center">
            {market.volume && (
              <p className="text-sm text-[#81898E] leading-none">
                {market.volume} Vol.
              </p>
            )}
            {market.time && <p>{market.time}</p>}
          </div>
        </div>
      </div>
      <GroupedPredictionChart
        marketId={market.id}
        availableLabels={availableLabels}
        isCrypto={isCrypto}
      />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          {marketsData.map((market: any, index: number) => {
            const legOrders = ordersByMarket?.[market.id] ?? []
            const legPositions = positionsByMarket?.[market.id] ?? []
            const orderbookData = getOrderBook(market.id)

            return (
              <GroupMarketAccordion
                key={`${market.id}-${index}`}
                id={market.id}
                label={market.title}
                market={market}
                legOrders={legOrders}
                legPositions={legPositions as unknown as any[]}
                isCrypto={isCrypto}
                orderbook={orderbookData}
                activeTab={activeTab}
                setActiveTab={setActiveTab as any}
                openMarketId={openMarketId}
                setOpenMarketId={setOpenMarketId}
                handleRefreshAll={handleRefreshAll}
              />
            )
          })}
        </div>
        {market.relatedMarkets?.length > 0 && (
          <RelatedMarkets markets={market.relatedMarkets} />
        )}
        <MarketSummary />
        <Rules text={text} />
        <CommentsSection marketId={market.id} />
      </div>
    </div>
  )
}

function GroupMarketAccordion({
  id,
  label,
  market,
  legOrders,
  legPositions,
  isCrypto,
  orderbook,
  activeTab,
  setActiveTab,
  handleRefreshAll,
  openMarketId,
  setOpenMarketId,
}: {
  id: string
  label: string
  market: any
  legOrders: any[]
  legPositions: any[]
  isCrypto: boolean
  orderbook: any
  activeTab: string
  setActiveTab: (tab: string) => void
  handleRefreshAll: () => void
  openMarketId: string | null
  setOpenMarketId: any
}) {
  const { setSelectedMarketId, setSelectedTeam, setSelectedTokenOption } =
    useMarketContext()
  const yesPriceFormatted = Math.round(
    (orderbook?.bestPrices?.yesBestAsk ?? 0.5) * 100
  )
  const noPriceFormatted = Math.round(
    (orderbook?.bestPrices?.noBestAsk ?? 0.5) * 100
  )

  const handleButtonClick = (e: any, option: TokenOption) => {
    if (openMarketId === id) {
      e.preventDefault()
    }
    setActiveTab(option)
    setSelectedTokenOption(option)
  }

  return (
    <Collapsible
      className="border border-[#353739] rounded-md"
      open={openMarketId === id}
      onOpenChange={(isOpen) => {
        setOpenMarketId(isOpen ? id : null)

        if (isOpen && market?.id && market?.data) {
          const name = market?.title
          setSelectedMarketId(market.id)
          setSelectedTeam({
            logo: market.image,
            name,
            shortName: name,
          })
        }
      }}
    >
      <CollapsibleTrigger className="w-full cursor-pointer">
        <div className="grid grid-cols-[1fr_160px_auto] items-center gap-4 px-4 py-3 hover:bg-[#353739] transition-colors duration-200">
          {/* Left: Outcome title + volume */}
          <div className="flex flex-col text-left">
            <span className="text-white font-medium text-sm leading-tight">
              {label}
            </span>
            <span className="text-xs text-[#81898E]">
              {market?.volume ? `${market.volume} Vol.` : "0 Vol."}
            </span>
          </div>

          {/* Middle: Probability centered */}
          <div className="text-white text-sm font-semibold text-center">
            {yesPriceFormatted < 1 ? "<1%" : `${yesPriceFormatted}%`}
          </div>

          {/* Right: Buy buttons */}
          <div className="flex gap-2 justify-end">
            <div
              onClick={(e) => handleButtonClick(e, "YES")}
              className="text-xs font-semibold bg-[#157245] text-white rounded px-3 py-1"
            >
              Buy Yes {yesPriceFormatted}¢
            </div>
            <div
              onClick={(e) => handleButtonClick(e, "NO")}
              className="text-xs font-semibold bg-[#62321E] text-white rounded px-3 py-1"
            >
              Buy No {noPriceFormatted}¢
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="p-4">
        <Tabs
          defaultValue={
            legPositions.length > 0
              ? "positions"
              : legOrders.length > 0
              ? "orders"
              : "orderbook"
          }
          className="w-full"
        >
          <TabsList className="flex border-b border-[#2B2E33] rounded-none pb-0 h-full items-start justify-start bg-transparent">
            {legPositions.length > 0 && (
              <TabsTrigger
                value="positions"
                className="data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-white text-[#81898E] rounded-none px-3 py-2"
              >
                Positions
              </TabsTrigger>
            )}
            {legOrders.length > 0 && (
              <TabsTrigger
                value="orders"
                className="data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-white text-[#81898E] rounded-none px-3 py-2"
              >
                Orders
              </TabsTrigger>
            )}
            <TabsTrigger
              value="orderbook"
              className="data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-white text-[#81898E] rounded-none px-3 py-2"
            >
              Order Book
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              className="data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-white text-[#81898E] rounded-none px-3 py-2"
            >
              Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="mt-4">
            <UserMarketPositions
              positions={legPositions as unknown as any[]}
              market={market}
              isCrypto={isCrypto}
              isTabView
            />
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <OpenOrdersTable
              yesToken={market?.yesTokenId}
              orders={legOrders}
              refreshOrders={handleRefreshAll}
              showOptions={["YES", "NO"]}
              isCrypto={isCrypto}
              hasPositions={(legPositions as any).length > 0}
              isTabView
            />
          </TabsContent>

          <TabsContent value="orderbook" className="mt-4">
            <OrderBook
              tabs={["YES", "NO"]}
              asksData={{
                YES: orderbook?.yesAsks ?? [],
                NO: orderbook?.noAsks ?? [],
              }}
              bidsData={{
                YES: orderbook?.yesBids ?? [],
                NO: orderbook?.noBids ?? [],
              }}
              activeTab={activeTab as any}
              setActiveTab={setActiveTab as any}
              showOptions={["YES", "NO"]}
              isTabView
            />
          </TabsContent>

          <TabsContent value="chart" className="mt-4">
            <PredictionChart marketId={id} showOptions={["YES", "NO"]} />
          </TabsContent>
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  )
}
