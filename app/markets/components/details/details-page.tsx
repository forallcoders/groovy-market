"use client"

import CommentsSection from "@/app/markets/components/details/comments"
import CryptoCard from "@/app/markets/components/details/crypto-card"
import GameCard from "@/app/markets/components/details/game-card"
import MarketSummary from "@/app/markets/components/details/market-summary"
import OrderBook from "@/app/markets/components/details/order-book"
import PredictionChart from "@/app/markets/components/details/prediction-chart"
import Rules from "@/app/markets/components/details/rules"
import MarketResolvedHeader from "@/app/markets/components/market-resolved-header"
import OpenOrdersTable from "@/app/markets/components/order/open-orders-table"
import UserMarketPositions from "@/app/markets/components/order/user-positions-table"
import { useUserMarketPositions } from "@/hooks/market/use-market-positions"
import { useOrderBook } from "@/hooks/market/use-order-book"
import { useUserOrders } from "@/hooks/market/use-user-orders"
import { useMarketContext } from "@/providers/market-provider"
import { useUserContext } from "@/providers/user-provider"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { generateRulesText } from "../../utils/rules"
import RelatedMarkets from "./related-markets"

const getMarketData = (market: any) => {
  const marketsData = market?.markets ?? []
  return marketsData[0]?.data ?? market
}

export default function DetailsPage({ market }: { market: any }) {
  const router = useRouter()
  const { leagueName, selectedMarketId } = useMarketContext()
  const isSingleSportOrCrypto = Boolean(
    leagueName === "Crypto" || market?.creator
  )
  const { proxyAddress } = useUserContext()
  const [activeMarketId, setActiveMarketId] = useState(market.id)

  const {
    activeTab,
    setActiveTab,
    refetch: refreshOrderbook,
    getOrderBook,
    orders: orderbookMapping,
  } = useOrderBook(market.id)

  const { positions } = useUserMarketPositions(market.id)
  const { orders, refetch: refreshOrders } = useUserOrders(market.id)
  const marketData = getMarketData(market)
  const text = isSingleSportOrCrypto
    ? [generateRulesText(marketData)]
    : [
        `If ${market?.team1?.name} wins, the market will resolve to "${market?.team1?.name}".`,
        `If ${market?.team2?.name} wins, the market will resolve to "${market?.team2?.name}".`,
        market?.draw
          ? `If the match ends in a draw, the market will resolve to "Draw".`
          : "",
        "If the match is postponed, the market will remain open until it is completed.",
        "If the match is canceled with no rescheduled date, the market will resolve 50-50.",
      ].filter(Boolean)

  const activeLegType = useMemo(() => {
    if (!market.grouped) return null
    if (activeMarketId === market.homeMarketId) return "home"
    if (activeMarketId === market.drawMarketId) return "draw"
    if (activeMarketId === market.awayMarketId) return "away"
    return null
  }, [activeMarketId, market])

  useEffect(() => {
    if (selectedMarketId) {
      setActiveMarketId(selectedMarketId)
      refreshOrderbook()
    } else {
      if (market.grouped) {
        setActiveMarketId(market.markets[0]?.id)
        refreshOrderbook()
      }
    }
  }, [market])

  const showOptions =
    isSingleSportOrCrypto || market.grouped
      ? ["YES", "NO"]
      : [market.team1.shortName, market.team2.shortName]

  const orderbookData = getOrderBook(activeMarketId)

  const orderBookProps = {
    asksData: {
      YES: orderbookData?.yesAsks ?? [],
      NO: orderbookData?.noAsks ?? [],
    },
    bidsData: {
      YES: orderbookData?.yesBids ?? [],
      NO: orderbookData?.noBids ?? [],
    },
  }

  const formattedGame = useMemo(() => {
    const hasDraw = Boolean(market.drawMarketId)
    const totalOutcomes = hasDraw ? 3 : 2

    const fallback = 1 / totalOutcomes

    const homePrice =
      orderbookMapping?.ordersByMarketId?.[market?.homeMarketId]?.bestPrices
        ?.yesBestAsk ?? fallback
    const awayPrice =
      orderbookMapping?.ordersByMarketId?.[market?.awayMarketId]?.bestPrices
        ?.yesBestAsk ?? fallback
    const drawPrice = hasDraw
      ? orderbookMapping?.ordersByMarketId?.[market?.drawMarketId]?.bestPrices
          ?.yesBestAsk ?? fallback
      : null

    const odds: Record<string, string> = {
      team1: `${Math.round(homePrice * 100)} ¢`,
      team2: `${Math.round(awayPrice * 100)} ¢`,
    }

    if (hasDraw) {
      odds.draw = `${Math.round(drawPrice! * 100)} ¢`
    }

    let team1Prob = Math.round(homePrice * 100)
    let team2Prob = Math.round(awayPrice * 100)
    const drawProb = hasDraw ? Math.round(drawPrice! * 100) : undefined

    if (activeLegType === "away") {
      ;[team1Prob, team2Prob] = [team2Prob, team1Prob]
    }

    return {
      ...market,
      id: activeMarketId,
      volume: market?.volume ? market.volume : "$0",
      team1: market?.team1 && {
        ...market.team1,
        prob: team1Prob,
      },
      team2: market?.team2 && {
        ...market.team2,
        prob: team2Prob,
      },
      draw: hasDraw
        ? {
            ...market.draw,
            prob: activeLegType === "draw" ? team1Prob : drawProb!,
          }
        : undefined,
      odds,
    }
  }, [
    market,
    orderbookMapping?.ordersByMarketId,
    activeLegType,
    activeMarketId,
  ])

  const handleGoBack = () => {
    router.back()
  }

  const marketResolved = market?.status === "resolved"

  const handleRefreshOpenOrders = () => {
    refreshOrders()
    refreshOrderbook()
  }

  const handleLegChange = (legId: string) => {
    setActiveMarketId(legId)
    refreshOrderbook()
  }

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-0">
      <div className="flex gap-2 cursor-pointer" onClick={handleGoBack}>
        <ArrowLeft className="h-6 w-6" />
        <span>Go back</span>
      </div>
      <div className="flex flex-col gap-6">
        {marketResolved && (
          <MarketResolvedHeader
            market={market}
            awayTeam={market.team2}
            homeTeam={market.team1}
            isCrypto={isSingleSportOrCrypto}
          />
        )}
        <div>
          {market && (
            <UserMarketPositions
              positions={positions}
              market={market}
              yesTokenLabel={showOptions[0]}
              noTokenLabel={showOptions[1]}
              isCrypto={isSingleSportOrCrypto}
              hasOrders={(orders?.length ?? 0) > 0}
            />
          )}
          {market && proxyAddress && (
            <OpenOrdersTable
              yesToken={market?.yesTokenId}
              orders={orders}
              refreshOrders={handleRefreshOpenOrders}
              showOptions={showOptions}
              isCrypto={isSingleSportOrCrypto}
              hasPositions={positions.length > 0}
            />
          )}
        </div>
        {!isSingleSportOrCrypto && (
          <GameCard
            gameData={formattedGame}
            onSelectLeg={market.grouped ? handleLegChange : undefined}
          />
        )}
        {isSingleSportOrCrypto && market && (
          <CryptoCard
            marketInfo={market}
            bestPrices={orderbookData.bestPrices}
          />
        )}
        <OrderBook
          tabs={["YES", "NO"]}
          {...orderBookProps}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showOptions={showOptions}
        />
        <PredictionChart marketId={activeMarketId} showOptions={showOptions} />
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
