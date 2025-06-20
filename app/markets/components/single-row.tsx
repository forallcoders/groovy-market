/* eslint-disable @next/next/no-img-element */
import { useMarketContext } from "@/providers/market-provider"
import { Avatar } from "@radix-ui/react-avatar"
import Link from "next/link"
import { BuyMarketWidget } from "../(home)/components/buy-market-widget"
import { useState } from "react"

export default function SingleRow({
  market,
  type = "crypto",
  isGrid = false,
}: {
  market: any
  type?: "crypto" | "sports"
  isGrid?: boolean
}) {
  const { setSelectedMarketId, setSelectedTokenOption, setSelectedTeam } =
    useMarketContext()

  // Add state for buy widget in grid mode
  const [showBuy, setShowBuy] = useState(false)
  const [selectedMarket, setSelectedMarketLocal] = useState<any>(null)
  const [selectedOption, setSelectedOption] = useState<"yes" | "no">("yes")

  const isGrouped = market.grouped === true
  const refLeg = market.markets?.[0]
  const yesProb = refLeg?.odds?.yes?.prob ?? 0
  const noProb = refLeg?.odds?.no?.prob ?? 0
  const linkId =
    type === "sports"
      ? `${market.leagueAbbreviation}/${market.parentMarketId ?? market.id}`
      : market.parentMarketId ?? market.id
  const link = `/markets/${type}/${linkId}/details`
  const creator = market?.creator
  const marketId = refLeg?.id ?? market.id

  // Helper function to get orderbook data
  const getOrderbookData = () => {
    // Default fallback values
    const defaultBestPrices = {
      yesBestAsk: 0.5,
      noBestAsk: 0.5,
      yesBestBid: 0.5,
      noBestBid: 0.5,
    }

    if (selectedMarket) {
      // For grouped markets, find the specific strike market
      if (isGrouped && market.markets) {
        const selectedLeg = market.markets.find(
          (m: any) => m.id === selectedMarket.id
        )

        // Get bestPrices from the selected market
        const marketBestPrices = selectedLeg?.bestPrices || defaultBestPrices

        // Sanitize bestPrices to ensure no null values
        const sanitizedBestPrices = {
          yesBestAsk: marketBestPrices.yesBestAsk ?? 0.5,
          noBestAsk: marketBestPrices.noBestAsk ?? 0.5,
          yesBestBid: marketBestPrices.yesBestBid ?? 0.5,
          noBestBid: marketBestPrices.noBestBid ?? 0.5,
        }

        return {
          bestPrices: sanitizedBestPrices,
          orderbook: selectedLeg?.orderbook || market.orderbook,
        }
      }

      // For single markets
      const marketBestPrices =
        selectedMarket.bestPrices || market.bestPrices || defaultBestPrices

      // Sanitize bestPrices to ensure no null values
      const sanitizedBestPrices = {
        yesBestAsk: marketBestPrices.yesBestAsk ?? 0.5,
        noBestAsk: marketBestPrices.noBestAsk ?? 0.5,
        yesBestBid: marketBestPrices.yesBestBid ?? 0.5,
        noBestBid: marketBestPrices.noBestBid ?? 0.5,
      }

      return {
        bestPrices: sanitizedBestPrices,
        orderbook: selectedMarket.orderbook || market.orderbook,
      }
    }

    // Default fallback - get from market or refLeg
    const marketBestPrices =
      market.bestPrices || refLeg?.bestPrices || defaultBestPrices

    // Sanitize bestPrices to ensure no null values
    const sanitizedBestPrices = {
      yesBestAsk: marketBestPrices.yesBestAsk ?? 0.5,
      noBestAsk: marketBestPrices.noBestAsk ?? 0.5,
      yesBestBid: marketBestPrices.yesBestBid ?? 0.5,
      noBestBid: marketBestPrices.noBestBid ?? 0.5,
    }

    return {
      bestPrices: sanitizedBestPrices,
      orderbook: market.orderbook || refLeg?.orderbook || null,
    }
  }

  // Get the orderbook data
  const orderBookData = getOrderbookData()

  // Calculate prices from orderbook data if bestPrices are null
  const calculatePricesFromOrderbook = () => {
    if (!orderBookData.orderbook) return { yesBestAsk: 0.5, noBestAsk: 0.5 }

    // Calculate yesBestAsk from orderbook.yesAsks
    let yesBestAsk = 0.5
    if (
      orderBookData.orderbook.yesAsks &&
      orderBookData.orderbook.yesAsks.length > 0
    ) {
      // Get the lowest ask price
      const lowestAsk =
        orderBookData.orderbook.yesAsks[
          orderBookData.orderbook.yesAsks.length - 1
        ]
      yesBestAsk = lowestAsk.price / 100
    } else if (
      orderBookData.orderbook.yesBids &&
      orderBookData.orderbook.yesBids.length > 0
    ) {
      // If no asks, use the highest bid as a fallback
      const highestBid = orderBookData.orderbook.yesBids[0]
      yesBestAsk = highestBid.price / 100
    }

    // Calculate noBestAsk from orderbook.noAsks
    let noBestAsk = 0.5
    if (
      orderBookData.orderbook.noAsks &&
      orderBookData.orderbook.noAsks.length > 0
    ) {
      // Get the lowest ask price
      const lowestAsk =
        orderBookData.orderbook.noAsks[
          orderBookData.orderbook.noAsks.length - 1
        ]
      noBestAsk = lowestAsk.price / 100
    } else if (
      orderBookData.orderbook.noBids &&
      orderBookData.orderbook.noBids.length > 0
    ) {
      // If no asks, use the highest bid as a fallback
      const highestBid = orderBookData.orderbook.noBids[0]
      noBestAsk = highestBid.price / 100
    }

    return { yesBestAsk, noBestAsk }
  }

  // Use calculated prices if bestPrices contains null values
  const finalPrices =
    orderBookData.bestPrices.yesBestAsk === null ||
    orderBookData.bestPrices.noBestAsk === null
      ? calculatePricesFromOrderbook()
      : {
          yesBestAsk: orderBookData.bestPrices.yesBestAsk,
          noBestAsk: orderBookData.bestPrices.noBestAsk,
        }

  const getDisplayTitle = () => {
    if (isGrouped && selectedMarket) {
      return selectedMarket.title || market.title
    }
    return market.title
  }

  const handleSelect = (leg: any, option: "yes" | "no", name?: string) => {
    if (isGrid) {
      // Grid mode - handle buy widget directly
      setSelectedMarketLocal({
        ...leg,
        image: market.image,
        id: leg.id || marketId,
        tokenId: option === "yes" ? leg.yesTokenId : leg.noTokenId,
        title: name || leg.title || market.title,
        bestPrices: leg.bestPrices,
      })
      setSelectedOption(option)
      setShowBuy(true)
    } else {
      // List mode - use market context
      setSelectedMarketId(leg.id)
      if (name) {
        setSelectedTeam({
          logo: leg.image,
          name: name,
          shortName: name,
        })
      } else {
        setSelectedTeam(null)
      }
      setSelectedTokenOption(option === "yes" ? "YES" : "NO")
    }
  }

  const titleElement = (
    <Link
      href={link}
      className="hover:underline text-white font-semibold text-base"
    >
      {market.title}
    </Link>
  )

  const content = (
    <div className="flex justify-between w-full">
      <div className="flex items-center gap-4 max-w-[320px]">
        <img
          src={market.image}
          alt={market.title}
          className={"h-[65px] w-[65px] rounded-[10px]"}
        />
        {titleElement}
      </div>

      {isGrouped && (
        <p className="text-xs text-[#81898E] leading-none mt-1">
          {market.volume} Vol.
        </p>
      )}

      {!isGrouped && market.volume && (
        <div className="flex flex-col items-center">
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium">{yesProb}%</span>
            <div className="w-[75px] h-[0.4rem] flex overflow-hidden gap-[2px]">
              <div
                className="bg-[#CC0066] rounded-[5px] h-full"
                style={{ width: yesProb + "%" }}
              />
              <div
                className="bg-[#9900CC] rounded-[5px] h-full"
                style={{ width: noProb + "%" }}
              />
            </div>
            <span className="text-xs font-medium">{noProb}%</span>
          </div>
          <p className="text-xs text-[#81898E] leading-none mt-1">
            {market.volume} Vol.
          </p>
        </div>
      )}
    </div>
  )

  const creatorElement = (
    <div className="flex items-center gap-2 mt-2 -mb-1 text-sm text-[#A0A0A0]">
      <span className="text-white">Created by</span>
      {creator?.avatar ? (
        <img
          src={creator.avatar}
          alt={creator.username}
          width={24}
          height={24}
          className="rounded-full border border-[#3f3f3f]"
        />
      ) : (
        <Avatar className="w-6 h-6 rounded-full bg-[#2d2f32]" />
      )}
      <span className="text-[#81898E] font-medium">{creator?.username}</span>
    </div>
  )

  const buttons = isGrouped ? (
    <div className=" space-y-2 w-full overflow-y-auto max-h-[76px]">
      {market.markets?.map((strike: any, index: number) => {
        const odds = strike.markets?.[0]?.odds ?? {}
        const yesProb = odds?.yes?.prob ?? 0
        return (
          <div
            key={`${strike.variantKey}-${index}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-sm font-medium">{strike.title}</span>
            <span className="text-sm ml-auto mr-2 leading-none mt-1">
              {yesProb}%
            </span>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 cursor-pointer bg-[#157245] rounded-[3px]"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(
                    {
                      ...strike,
                      id: strike.id,
                      yesTokenId: strike.yesTokenId,
                      image: market.image,
                      title: strike.title,
                      bestPrices: strike.bestPrices,
                    },
                    "yes",
                    strike.title
                  )
                }}
              >
                YES {strike.odds?.yes?.value}
              </button>
              <button
                className="px-2 py-1 cursor-pointer bg-[#62321E] rounded-[3px]"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(
                    {
                      ...strike,
                      id: strike.id,
                      noTokenId: strike.noTokenId,
                      image: market.image,
                      title: strike.title,
                      bestPrices: strike.bestPrices,
                    },
                    "no",
                    strike.title
                  )
                }}
              >
                NO {strike.odds?.no?.value}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  ) : (
    <div className={"flex gap-4 mt-5 w-full"}>
      <button
        onClick={() =>
          handleSelect(
            {
              ...refLeg,
              image: market.image,
              id: refLeg?.id || marketId,
              yesTokenId: refLeg?.yesTokenId,
              bestPrices: refLeg?.bestPrices || market.bestPrices,
            },
            "yes",
            refLeg?.title
          )
        }
        className="cursor-pointer py-2 bg-[rgba(1,185,93,0.5)] hover:bg-[#01B95D] transition rounded-[5px] font-semibold w-full text-[13px]"
      >
        YES&nbsp;{refLeg?.odds?.yes?.value}
      </button>
      <button
        onClick={() =>
          handleSelect(
            {
              ...refLeg,
              image: market.image,
              id: refLeg?.id || marketId,
              noTokenId: refLeg?.noTokenId,
              bestPrices: refLeg?.bestPrices || market.bestPrices,
            },
            "no",
            refLeg?.title
          )
        }
        className="cursor-pointer py-2 bg-[rgba(203,66,4,0.35)] hover:bg-[#E1372D] transition rounded-[5px] font-semibold text-[13px] w-full"
      >
        NO&nbsp;{refLeg?.odds?.no?.value}
      </button>
    </div>
  )

  // Grid mode with Buy Widget
  if (isGrid) {
    return (
      <div className="border border-[#353739] bg-neutral-750 rounded-lg p-4 w-full relative max-h-[188px]">
        {showBuy ? (
          <BuyMarketWidget
            selectedName={selectedOption === "yes" ? "YES" : "NO"}
            selectedToken={
              selectedMarket?.tokenId ??
              (selectedOption === "yes"
                ? selectedMarket?.yesTokenId
                : selectedMarket?.noTokenId)
            }
            marketType="single"
            assetImage={market.image}
            title={getDisplayTitle()}
            orders={orderBookData.orderbook}
            isYesToken={selectedOption === "yes"}
            marketId={selectedMarket?.id ?? marketId}
            yesPrice={finalPrices.yesBestAsk}
            noPrice={finalPrices.noBestAsk}
            setShowBuy={setShowBuy}
            marketInfo={{
              ...selectedMarket,
              id: selectedMarket?.id ?? marketId,
              image: market.image,
              title: getDisplayTitle(),
            }}
          />
        ) : (
          <>
            {content}
            {market.creator && creatorElement}
            {buttons}
          </>
        )}
      </div>
    )
  }

  // Standard list mode
  return (
    <div className="border border-[#353739] rounded-lg p-4">
      {content}
      {market.creator && creatorElement}
      {buttons}
    </div>
  )
}
