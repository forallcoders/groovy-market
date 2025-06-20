"use client"

import MarketPanel from "@/app/markets/components/order/market-panel"
import { useOrderBook } from "@/hooks/market/use-order-book"
import { useMarketContext } from "@/providers/market-provider"
import { useQuery } from "@tanstack/react-query"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type GameRow = {
  id: string
  creator?: any
  grouped?: boolean
  homeMarketId?: string
  drawMarketId?: string
  awayMarketId?: string
  team1?: any
  team2?: any
  draw?: any
  image?: string
  title: string
}

function pickCryptoLeg(group: any, rule: "highestVolume" | "first" = "first") {
  if (!group?.markets?.length) return undefined

  if (rule === "highestVolume") {
    return group.markets.reduce((top: any, leg: any) =>
      Number(leg.volume ?? 0) > Number(top.volume ?? 0) ? leg : top
    )
  }

  return group.markets[0]
}

function findGameByLegId(list: any[], legId?: string) {
  if (!legId) return undefined

  for (const g of list) {
    if (!g.grouped) {
      if (g.id === legId) return g
      if (g?.markets?.some?.((m: any) => m?.id === legId)) {
        return {
          ...g,
          activeLegId: legId,
        }
      }
    }
    if (g.grouped) {
      const isLegMatch =
        g.id === legId ||
        g.homeMarketId === legId ||
        g.awayMarketId === legId ||
        g.drawMarketId === legId ||
        g?.markets?.some?.((m: any) => m?.id === legId)

      if (isLegMatch) {
        return {
          ...g,
          activeLegId: legId,
        }
      }
    }
  }
  if (list?.some((g: any) => g.id === legId)) {
    return { ...list.find((g: any) => g.id === legId), activeLegId: legId }
  }
  return undefined
}

function findMarketById(list: any[], marketId?: string) {
  for (const item of list) {
    if (item?.markets?.length) {
      const child = item.markets.find((c: any) => c.id === marketId)
      if (child) return child
    } else if (item.id === marketId && !item.grouped) {
      return item
    }
  }

  for (const item of list) {
    if (item?.markets?.length) {
      return item.markets[0]
    } else if (!item.grouped) {
      return item
    }
  }

  return undefined
}

function isSportsMarket(market: any) {
  return market && market.team1 && market.team2 && !market.creator
}

function MarketsPanelWrapper() {
  const { league: leagueSlug, market: marketSlug } = useParams<{
    league: string
    market: string
  }>()
  const pathname = usePathname()
  const leagueAbbreviation = leagueSlug ?? ""

  const {
    selectedMarketId,
    selectedTeam,
    selectedTokenOption,
    setSelectedTokenOption,
    setSelectedMarketId,
    setSelectedTeam,
    marketPanelVariant,
    setMarketPanelVariant,
  } = useMarketContext()

  const getCurrentCategory = () => {
    if (pathname.includes("/markets/crypto")) return "crypto"
    if (pathname.includes("/markets/sports")) return "sports"
    if (pathname.includes("/markets/latest")) return "latest"
    if (pathname.includes("/markets/trending")) return "trending"
    return "all"
  }

  const currentCategory = getCurrentCategory()
  const isCrypto = currentCategory === "crypto"
  const isSports = currentCategory === "sports"
  const isLatest = currentCategory === "latest"
  const isTrending = currentCategory === "trending"
  const isMixed = isLatest || isTrending || currentCategory === "all"

  const [activeMarketIds, setActiveMarketIds] = useState<string[]>([])

  const getApiEndpoint = () => {
    if (isCrypto) {
      return "/api/markets/list?type=crypto"
    } else if (isSports && leagueAbbreviation) {
      return `/api/markets/list?league=${leagueAbbreviation}`
    } else if (isLatest) {
      return "/api/markets/list?sort=date&order=desc"
    } else if (isTrending) {
      return "/api/markets/list?sort=volume&order=desc"
    }
    return "/api/markets/list"
  }

  const getQueryKey = () => {
    if (isCrypto) {
      return ["marketsList", "crypto"]
    } else if (isSports && leagueAbbreviation) {
      return ["gamesList", leagueAbbreviation]
    } else if (isLatest) {
      return ["marketsList", "latest"]
    } else if (isTrending) {
      return ["marketsList", "trending"]
    }
    return ["marketsList", "all"]
  }

  const { data: marketData = [], isLoading: isMarketDataLoading } = useQuery({
    queryKey: getQueryKey(),
    queryFn: () => fetch(getApiEndpoint()).then((r) => r.json()),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

  const lastCategoryRef = useRef<string>(currentCategory)
  const lastLeagueRef = useRef<string>(leagueAbbreviation)
  const { isLoading: isOrderbookLoading, getOrderBook } = useOrderBook(
    marketSlug || ""
  )

  useEffect(() => {
    if (
      lastCategoryRef.current !== currentCategory ||
      (isSports && lastLeagueRef.current !== leagueAbbreviation)
    ) {
      lastCategoryRef.current = currentCategory
      lastLeagueRef.current = leagueAbbreviation

      setSelectedMarketId(null)
      setSelectedTeam(null)
    }
  }, [
    currentCategory,
    leagueAbbreviation,
    setSelectedMarketId,
    setSelectedTeam,
    isSports,
  ])

  useEffect(() => {
    if (isMarketDataLoading) return

    let marketsList = []
    if (Array.isArray(marketData)) {
      marketsList = marketData
    } else if (marketData.items) {
      marketsList = marketData.items
    } else if (marketData.games || marketData.markets) {
      marketsList = [...(marketData.markets || []), ...(marketData.games || [])]
    } else if (isSports && marketData.games) {
      marketsList = marketData.games
    }

    if (!marketsList?.length) return

    if (marketSlug) {
      const directMatch = marketsList.find(
        (item: any) => item.id === marketSlug
      )
      const isSports = directMatch && isSportsMarket(directMatch)

      if (!isSports) {
        const cryptoMarket =
          directMatch ||
          marketsList.find((m: any) => {
            if (m.markets?.length) {
              return m.markets.some((child: any) => child.id === marketSlug)
            }
            return false
          })

        if (cryptoMarket) {
          if (cryptoMarket.markets?.length > 0) {
            const childMarket = cryptoMarket.markets.find(
              (m: any) => m.id === marketSlug
            )

            if (childMarket) {
              setActiveMarketIds([childMarket.id])
              setSelectedMarketId(childMarket.id)

              if (!selectedTeam) {
                setSelectedTeam({
                  logo: childMarket.image,
                  name: childMarket.title,
                  shortName: childMarket.title,
                })
              }
            } else {
              const childIds = cryptoMarket.markets.map((c: any) => c.id)
              setActiveMarketIds(childIds)

              const defaultLeg =
                pickCryptoLeg(cryptoMarket, "highestVolume") ??
                cryptoMarket.markets[0]
              setSelectedMarketId(defaultLeg.id)

              if (!selectedTeam) {
                setSelectedTeam({
                  logo: defaultLeg.image,
                  name: defaultLeg.title,
                  shortName: defaultLeg.title,
                })
              }
            }
          } else {
            setActiveMarketIds([cryptoMarket.id])
            setSelectedMarketId(cryptoMarket.id)

            if (!selectedTeam) {
              setSelectedTeam({
                logo: cryptoMarket.image,
                name: cryptoMarket.title,
                shortName: cryptoMarket.title,
              })
            }
          }
          return
        }
      }

      if (isSports || (!isCrypto && !directMatch)) {
        const gameRow = findGameByLegId(marketsList as GameRow[], marketSlug)

        if (gameRow) {
          const legId = gameRow.activeLegId ?? gameRow.id
          const marketIdsToActivate = []

          if (gameRow.grouped) {
            if (gameRow.homeMarketId) {
              marketIdsToActivate.push(gameRow.homeMarketId)
              if (gameRow.drawMarketId)
                marketIdsToActivate.push(gameRow.drawMarketId)
              if (gameRow.awayMarketId)
                marketIdsToActivate.push(gameRow.awayMarketId)
              if (!selectedMarketId) setSelectedMarketId(gameRow.homeMarketId)
            } else if (gameRow.drawMarketId) {
              marketIdsToActivate.push(gameRow.drawMarketId)
              if (gameRow.homeMarketId)
                marketIdsToActivate.push(gameRow.homeMarketId)
              if (gameRow.awayMarketId)
                marketIdsToActivate.push(gameRow.awayMarketId)
              if (!selectedMarketId) setSelectedMarketId(gameRow.drawMarketId)
            } else if (gameRow.awayMarketId) {
              marketIdsToActivate.push(gameRow.awayMarketId)
              if (gameRow.homeMarketId)
                marketIdsToActivate.push(gameRow.homeMarketId)
              if (gameRow.drawMarketId)
                marketIdsToActivate.push(gameRow.drawMarketId)
              if (!selectedMarketId) setSelectedMarketId(gameRow.awayMarketId)
            }
          } else {
            marketIdsToActivate.push(legId)
            setSelectedMarketId(legId)
          }

          setActiveMarketIds(marketIdsToActivate)

          let teamObj = gameRow.team1
          if (gameRow.grouped) {
            if (legId === gameRow.awayMarketId) {
              teamObj = gameRow.team2
            } else if (legId === gameRow.drawMarketId) {
              teamObj = {
                name: `Draw (${gameRow.team1.shortName} vs ${gameRow.team2.shortName})`,
                shortName: `DRAW (${gameRow.team1.shortName} vs ${gameRow.team2.shortName})`,
                logo: "/icons/circle-pause.svg",
              }
            }
          }

          if (!selectedTeam) {
            if (gameRow.creator) {
              setSelectedTeam({
                logo: gameRow.image,
                name: gameRow.title,
                shortName: gameRow.title,
              })
            } else {
              if (!gameRow.grouped) {
                const title = `${gameRow.team1.shortName} vs ${gameRow.team2.shortName}`
                setSelectedTeam({
                  logo: gameRow.image!,
                  name: title,
                  shortName: title,
                })
              } else {
                setSelectedTeam(gameRow.team1)
              }
            }
          }

          return
        }
      }

      const firstItem = marketsList[0]
      if (firstItem) {
        setActiveMarketIds([firstItem.id])
        setSelectedMarketId(firstItem.id)

        if (!selectedTeam) {
          if (isSportsMarket(firstItem)) {
            setSelectedTeam(firstItem.team1)
          } else {
            setSelectedTeam({
              logo: firstItem.image,
              name: firstItem.title,
              shortName: firstItem.title,
            })
          }
        }
      }
    } else {
      if (isMixed) {
        const firstItem = marketsList[0]
        if (!firstItem) return

        if (isSportsMarket(firstItem) && firstItem.grouped) {
          const gameRow = firstItem as GameRow
          const marketIdsToActivate = []

          if (gameRow.homeMarketId) {
            marketIdsToActivate.push(gameRow.homeMarketId)
            if (gameRow.drawMarketId)
              marketIdsToActivate.push(gameRow.drawMarketId)
            if (gameRow.awayMarketId)
              marketIdsToActivate.push(gameRow.awayMarketId)
            setSelectedMarketId(gameRow.homeMarketId)
          } else if (gameRow.drawMarketId) {
            marketIdsToActivate.push(gameRow.drawMarketId)
            setSelectedMarketId(gameRow.drawMarketId)
          } else if (gameRow.awayMarketId) {
            marketIdsToActivate.push(gameRow.awayMarketId)
            setSelectedMarketId(gameRow.awayMarketId)
          }

          setActiveMarketIds(marketIdsToActivate)

          if (!selectedTeam) {
            setSelectedTeam(gameRow.team1)
          }
        } else if (isSportsMarket(firstItem)) {
          setActiveMarketIds([firstItem.id])
          setSelectedMarketId(firstItem.id)

          if (!selectedTeam) {
            setSelectedTeam(firstItem.team1)
          }
        } else if (firstItem.grouped && firstItem.markets?.length) {
          const childIds = firstItem.markets.map((c: any) => c.id)
          const defaultLeg =
            pickCryptoLeg(firstItem, "highestVolume") ?? firstItem.markets[0]

          setActiveMarketIds(childIds)
          setSelectedMarketId(defaultLeg.id)

          if (!selectedTeam) {
            setSelectedTeam({
              logo: defaultLeg.image,
              name: defaultLeg.title,
              shortName: defaultLeg.title,
            })
          }
        } else {
          setActiveMarketIds([firstItem.id])
          setSelectedMarketId(firstItem.id)

          if (!selectedTeam) {
            setSelectedTeam({
              logo: firstItem.image,
              name: firstItem.title,
              shortName: firstItem.title,
            })
          }
        }
      } else if (isCrypto) {
        const cryptoMarkets = marketsList.filter(
          (m: any) => !m._marketType || m._marketType === "crypto"
        )

        if (!cryptoMarkets.length) return

        const firstMarket = cryptoMarkets[0]

        if (firstMarket.grouped && firstMarket.markets?.length) {
          const defaultLeg =
            pickCryptoLeg(firstMarket, "highestVolume") ??
            firstMarket.markets[0]
          const defaultLegId = defaultLeg?.id

          if (defaultLegId && !selectedMarketId) {
            setSelectedMarketId(defaultLegId)
            setActiveMarketIds([defaultLegId])

            if (!selectedTeam) {
              setSelectedTeam({
                logo: defaultLeg.image,
                name: defaultLeg.title,
                shortName: defaultLeg.title,
              })
            }
          }
        } else {
          setActiveMarketIds([firstMarket.id])
          setSelectedMarketId(firstMarket.id)

          if (!selectedTeam) {
            setSelectedTeam({
              logo: firstMarket.image,
              name: firstMarket.title,
              shortName: firstMarket.title,
            })
          }
        }
      } else if (isSports) {
        const sportsMarkets = marketsList
        if (!sportsMarkets.length) return

        const firstGame = sportsMarkets[0] as GameRow
        const legId = firstGame.id
        const marketIdsToActivate = []

        if (firstGame.grouped) {
          if (firstGame.homeMarketId) {
            marketIdsToActivate.push(firstGame.homeMarketId)
            if (firstGame.drawMarketId)
              marketIdsToActivate.push(firstGame.drawMarketId)
            if (firstGame.awayMarketId)
              marketIdsToActivate.push(firstGame.awayMarketId)
            setSelectedMarketId(firstGame.homeMarketId)
          } else if (firstGame.drawMarketId) {
            marketIdsToActivate.push(firstGame.drawMarketId)
            setSelectedMarketId(firstGame.drawMarketId)
          } else if (firstGame.awayMarketId) {
            marketIdsToActivate.push(firstGame.awayMarketId)
            setSelectedMarketId(firstGame.awayMarketId)
          }
        } else {
          marketIdsToActivate.push(legId)
          setSelectedMarketId(legId)
        }

        setActiveMarketIds(marketIdsToActivate)

        if (!selectedTeam) {
          if (firstGame.creator) {
            setSelectedTeam({
              logo: firstGame.image!,
              name: firstGame.title,
              shortName: firstGame.title,
            })
          } else {
            if (!firstGame.grouped) {
              const title = `${firstGame.team1.shortName} vs ${firstGame.team2.shortName}`
              setSelectedTeam({
                logo: firstGame.image!,
                name: title,
                shortName: title,
              })
            } else {
              setSelectedTeam(firstGame.team1)
            }
          }
        }
      }
    }
  }, [
    currentCategory,
    isCrypto,
    isSports,
    isMixed,
    marketData,
    marketSlug,
    selectedMarketId,
    selectedTeam,
    setSelectedMarketId,
    setSelectedTeam,
    isMarketDataLoading,
  ])

  useEffect(() => {
    if (isMarketDataLoading) return

    let marketsList = []
    if (Array.isArray(marketData)) {
      marketsList = marketData
    } else if (marketData.items) {
      marketsList = marketData.items
    } else if (marketData.games || marketData.markets) {
      marketsList = [...(marketData.markets || []), ...(marketData.games || [])]
    } else if (isSports && marketData.games) {
      marketsList = marketData.games
    }

    if (!marketsList?.length) return

    const market = marketSlug
      ? marketsList.find((m: any) => m.id === marketSlug) ||
        findGameByLegId(marketsList as GameRow[], marketSlug)
      : marketsList[0]

    if (!market) return

    if (!marketSlug) {
      setMarketPanelVariant("default")
    } else {
      if (isSportsMarket(market)) {
        setMarketPanelVariant(market.grouped ? "default" : "teamAbbreviations")
      } else {
        setMarketPanelVariant("default")
      }
    }
  }, [
    currentCategory,
    isCrypto,
    isSports,
    marketData,
    marketSlug,
    setMarketPanelVariant,
    isMarketDataLoading,
  ])

  if (isOrderbookLoading || activeMarketIds.length === 0) {
    return SkeletonState()
  }

  let marketsList = []
  if (Array.isArray(marketData)) {
    marketsList = marketData
  } else if (marketData.items) {
    marketsList = marketData.items
  } else if (marketData.games || marketData.markets) {
    marketsList = [...(marketData.markets || []), ...(marketData.games || [])]
  } else if (isSports && marketData.games) {
    marketsList = marketData.games
  }

  const currentMarket = findMarketById(marketsList, selectedMarketId ?? "")

  const teamAbbreviations =
    currentMarket?.team1 && currentMarket?.team2 && !currentMarket?.creator
      ? {
          home: currentMarket.team1.shortName,
          away: currentMarket.team2.shortName,
        }
      : { home: "YES", away: "NO" }

  const selectedTeamBestPrices = getOrderBook(
    selectedMarketId ?? ""
  )?.bestPrices
  const bestPrices = selectedTeamBestPrices
    ? {
        yesBestAsk: selectedTeamBestPrices.yesBestAsk ?? 0.5,
        noBestAsk: selectedTeamBestPrices.noBestAsk ?? 0.5,
        yesBestBid: selectedTeamBestPrices.yesBestBid ?? 0.5,
        noBestBid: selectedTeamBestPrices.noBestBid ?? 0.5,
      }
    : { yesBestAsk: 0.5, noBestAsk: 0.5, yesBestBid: 0.5, noBestBid: 0.5 }

  if (currentMarket.status === "resolved") {
    return null
  }

  return (
    <MarketPanel
      market={currentMarket}
      selectedTeam={selectedTeam ?? undefined}
      selectedTokenOption={selectedTokenOption}
      setSelectedTokenOption={setSelectedTokenOption}
      orderbookData={getOrderBook(selectedMarketId ?? "")}
      bestPrices={bestPrices}
      variant={marketPanelVariant}
      teamAbbreviations={teamAbbreviations}
    />
  )
}

const SkeletonState = () => (
  <div className="sm:col-start-2 lg:col-start-3 px-4 sm:px-0 w-[300px]">
    <div className="border border-[#353739] rounded-lg h-min mb-3 p-4">
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-8 bg-gray-700/30 rounded w-3/4" />
        <div className="h-32 bg-gray-700/20 rounded" />
        <div className="h-6 bg-gray-700/30 rounded w-1/2" />
      </div>
    </div>
  </div>
)

export default MarketsPanelWrapper
