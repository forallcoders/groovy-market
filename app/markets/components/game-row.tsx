/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"
import { useMarketContext } from "@/providers/market-provider"
import { shortname } from "@/utils/slugify"
import { Radio } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { BuyMarketWidget } from "../(home)/components/buy-market-widget"

export default function GameRow({
  game,
  isGrid = false,
}: {
  game: any
  isGrid?: boolean
}) {
  const [showBuy, setShowBuy] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<string>("")
  const [selectedTeamLocal, setSelectedTeamLocal] = useState<any>(null)
  const [isDraw, setIsDraw] = useState(false)
  const {
    setSelectedMarketId,
    setSelectedTeam,
    setSelectedTokenOption,
    marketPanelVariant,
  } = useMarketContext()
  const homeId = game.homeMarketId ?? game.id
  const drawId = game.drawMarketId
  const awayId = game.awayMarketId ?? game.id
  const linkId = game.parentMarketId ?? game.id
  const link = `/markets/sports/${game.leagueAbbreviation}/${linkId}/details`

  const getOrderbookData = () => {
    // Default fallback values
    const defaultBestPrices = {
      yesBestAsk: 0.5,
      noBestAsk: 0.5,
      yesBestBid: 0.5,
      noBestBid: 0.5,
    }

    if (isDraw && game.markets) {
      // For draw market
      const drawMarket = game.markets.find(
        (m: any) => m.variantKey === "draw" || m.id === drawId
      )

      // Get bestPrices from game.bestPrices.draw
      const drawBestPrices = game.bestPrices?.draw || defaultBestPrices

      // Ensure we have non-null values for yesBestAsk and noBestAsk
      const sanitizedBestPrices = {
        yesBestAsk: drawBestPrices.yesBestAsk ?? 0.5,
        noBestAsk: drawBestPrices.noBestAsk ?? 0.5,
        yesBestBid: drawBestPrices.yesBestBid ?? 0.5,
        noBestBid: drawBestPrices.noBestBid ?? 0.5,
      }

      return {
        bestPrices: sanitizedBestPrices,
        orderbook: drawMarket?.orderbook || game.orderbook,
      }
    } else if (selectedTeamLocal?.name === game.team1.name && game.markets) {
      // For home team
      const homeMarket = game.markets.find(
        (m: any) => m.variantKey === "home" || m.id === homeId
      )

      // Get bestPrices from game.bestPrices.team1
      const homeBestPrices = game.bestPrices?.team1 || defaultBestPrices

      // Ensure we have non-null values for yesBestAsk and noBestAsk
      const sanitizedBestPrices = {
        yesBestAsk: homeBestPrices.yesBestAsk ?? 0.5,
        noBestAsk: homeBestPrices.noBestAsk ?? 0.5,
        yesBestBid: homeBestPrices.yesBestBid ?? 0.5,
        noBestBid: homeBestPrices.noBestBid ?? 0.5,
      }

      return {
        bestPrices: sanitizedBestPrices,
        orderbook: homeMarket?.orderbook || game.orderbook,
      }
    } else if (selectedTeamLocal?.name === game.team2.name && game.markets) {
      // For away team
      const awayMarket = game.markets.find(
        (m: any) => m.variantKey === "away" || m.id === awayId
      )

      // Get bestPrices from game.bestPrices.team2
      const awayBestPrices = game.bestPrices?.team2 || defaultBestPrices

      // Ensure we have non-null values for yesBestAsk and noBestAsk
      const sanitizedBestPrices = {
        yesBestAsk: awayBestPrices.yesBestAsk ?? 0.5,
        noBestAsk: awayBestPrices.noBestAsk ?? 0.5,
        yesBestBid: awayBestPrices.yesBestBid ?? 0.5,
        noBestBid: awayBestPrices.noBestBid ?? 0.5,
      }

      return {
        bestPrices: sanitizedBestPrices,
        orderbook: awayMarket?.orderbook || game.orderbook,
      }
    }

    // Default fallback
    return {
      bestPrices: defaultBestPrices,
      orderbook: null,
    }
  }

  const orderBookData = getOrderbookData()

  const handleTeamSelect = (
    team: any,
    marketId: string,
    isDrawSelection: boolean = false
  ) => {
    if (isGrid) {
      let tokenId

      if (isDrawSelection) {
        tokenId = findTokenId("draw")
      } else if (team.name === game.team1.name) {
        tokenId = findTokenId("home")
      } else {
        tokenId = findTokenId("away")
      }

      setSelectedMarket(marketId)
      setSelectedTeamLocal({
        ...team,
        tokenId: tokenId,
      })
      setIsDraw(isDrawSelection)
      setShowBuy(true)
    } else {
      setSelectedMarketId(team.id)
      const title = team?.grouped
        ? team.name
        : `${game.team1.shortName} vs ${game.team2.shortName}`
      setSelectedTeam({
        name: title,
        shortName: team.shortName,
        logo: team.logo,
      })

      if (marketPanelVariant === "teamAbbreviations") {
        if (team.shortName === game.team1.shortName) {
          setSelectedTokenOption("YES")
        } else if (team.shortName === game.team2.shortName) {
          setSelectedTokenOption("NO")
        }
      }
    }
  }
  const titleElement = (
    <Link href={link}>
      <div className="flex gap-2 hover:underline">
        <span className="text-[#81898E]">Game View</span>
        <Radio className="text-[#81898E] h-6 w-6" />
      </div>
    </Link>
  )

  const content = (
    <div className="flex flex-col items-center justify-between gap-6">
      <div className="w-full flex justify-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="bg-[#353739] leading-none flex text-white items-center text-xs font-light p-1.5 rounded-[3px] tracking-[0.5px]">
            {game.time}
          </div>
          <div className="text-[#81898E] text-xs tracking-[0.5px]">
            {game.volume}
          </div>
        </div>
        <div className="hidden sm:flex gap-4">
          {titleElement}
          {/* <Pin className="text-[#81898E] h-6 w-6 rotate-[45deg]" /> */}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-3  w-full justify-between",
          {
            "xl:flex-row": !isGrid,
          }
        )}
      >
        <div
          className={cn("flex flex-wrap w-full justify-between gap-2 mb-2", {
            "xl:flex-col": !isGrid,
          })}
        >
          {[game.team1, game.team2].map((team, i) => (
            <div key={i} className="flex items-center gap-2">
              <img
                src={team.logo}
                alt={team.name}
                width={50}
                height={50}
                className="w-8 h-8"
              />
              <div className="flex gap-1 items-baseline">
                {/* <span className="text-[13px] font-medium">
                  {shortname(team.name)}
                </span> */}
                <span className="text-[13px] font-medium">{team.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 items-center w-full justify-between xl:justify-center">
          <button
            onClick={() => handleTeamSelect(game.team1, homeId)}
            className="w-[26vw] cursor-pointer max-w-32 py-2 bg-[#cc00667e] hover:bg-[#CC0066] transition flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]"
          >
            <span className="opacity-70">{shortname(game.team1.name)}</span>
            <span>{game.odds?.team1}</span>
          </button>
          {drawId && game.odds?.draw && (
            <button
              onClick={() =>
                handleTeamSelect(
                  {
                    name: `Draw (${game.team1.name} vs ${game.team2.name})`,
                    logo: "/icons/circle-pause.svg",
                    shortName: `DRAW (${game.team1.shortName} vs ${game.team2.shortName})`,
                  },
                  drawId,
                  true
                )
              }
              className="w-[26vw] cursor-pointer max-w-32 py-2 bg-[#375361] hover:bg-[#365E73] transition flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]"
            >
              <span className="opacity-70">DRAW</span>
              <span>{game.odds?.draw}</span>
            </button>
          )}
          <button
            onClick={() => handleTeamSelect(game.team2, awayId)}
            className="w-[26vw] cursor-pointer max-w-32 py-2 bg-[#9900cc83] hover:bg-[#9900CC] flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]"
          >
            <span className="opacity-70">{shortname(game.team2.name)}</span>
            <span>{game.odds?.team2}</span>
          </button>
        </div>
      </div>
    </div>
  )

  const findTokenId = (team: "home" | "away" | "draw") => {
    if (team === "home") {
      if (game.homeYesTokenId) return game.homeYesTokenId

      if (game.markets && Array.isArray(game.markets)) {
        const homeLeg = game.markets.find(
          (m: any) => m.variantKey === "home" || m.id === homeId
        )
        if (homeLeg?.yesTokenId) return homeLeg.yesTokenId
      }

      if (game.children && Array.isArray(game.children)) {
        const homeLeg = game.children.find(
          (c: any) => c.variantKey === "home" || c.id === homeId
        )
        if (homeLeg?.yesTokenId) return homeLeg.yesTokenId
      }

      return game.yesTokenId || game.conditionId
    } else if (team === "away") {
      if (game.awayYesTokenId) return game.awayYesTokenId

      if (game.markets && Array.isArray(game.markets)) {
        const awayLeg = game.markets.find(
          (m: any) => m.variantKey === "away" || m.id === awayId
        )
        if (awayLeg?.yesTokenId) return awayLeg.yesTokenId
      }

      if (game.children && Array.isArray(game.children)) {
        const awayLeg = game.children.find(
          (c: any) => c.variantKey === "away" || c.id === awayId
        )
        if (awayLeg?.yesTokenId) return awayLeg.yesTokenId
      }

      return game.awayTokenId || game.noTokenId
    } else if (team === "draw") {
      if (game.drawYesTokenId) return game.drawYesTokenId

      if (game.markets && Array.isArray(game.markets)) {
        const drawLeg = game.markets.find(
          (m: any) => m.variantKey === "draw" || m.id === drawId
        )
        if (drawLeg?.yesTokenId) return drawLeg.yesTokenId
      }

      if (game.children && Array.isArray(game.children)) {
        const drawLeg = game.children.find(
          (c: any) => c.variantKey === "draw" || c.id === drawId
        )
        if (drawLeg?.yesTokenId) return drawLeg.yesTokenId
      }

      return game.drawTokenId
    }

    return undefined
  }

  if (isGrid) {
    return (
      <div
        className={cn(
          "border border-[#353739] bg-neutral-750 rounded-lg p-4 min-h-[188px]",
          {
            " my-auto": isGrid,
          }
        )}
      >
        {showBuy ? (
          <BuyMarketWidget
            selectedName={isDraw ? "DRAW" : selectedTeamLocal?.name}
            selectedToken={selectedTeamLocal?.tokenId}
            marketType="team-with-draw"
            team1Logo={game.team1.logo}
            team2Logo={game.team2.logo}
            isDraw={isDraw}
            title={`${game.team1.name} vs ${game.team2.name}`}
            orders={orderBookData.orderbook}
            isYesToken={!isDraw && selectedTeamLocal?.name === game.team1.name}
            marketId={selectedMarket}
            yesPrice={orderBookData?.bestPrices.yesBestAsk}
            noPrice={orderBookData?.bestPrices.noBestAsk}
            setShowBuy={setShowBuy}
            marketInfo={{
              ...game,
              id: selectedMarket,
            }}
          />
        ) : (
          content
        )}
      </div>
    )
  }

  return (
    <div
      className={cn("border border-[#353739] rounded-lg p-2", {
        "h-fit my-auto": isGrid,
      })}
    >
      {content}
    </div>
  )
}
