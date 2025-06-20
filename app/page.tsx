"use client"

import Footer from "@/app/markets/components/footer"
import Onboarding from "@/components/flows/onboarding"
import { slugify } from "@/utils/slugify"
import { useQuery } from "@tanstack/react-query"
import { Clock, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import MarketFilters from "./markets/(home)/components/market-filters"
import GameRow from "./markets/components/game-row"
import MarketHeader from "./markets/components/header/market-header"
import SingleRow from "./markets/components/single-row"

const categories = ["All", "Sports", "Crypto", "Latest", "Trending"]

export default function HomePage() {
  // Fetch trending markets (high volume)
  const { data: trendingData = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["marketsList", "trending"],
    queryFn: () =>
      fetch("/api/markets/list?sort=volume&order=desc").then((r) => r.json()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  // Fetch latest markets (most recent)
  const { data: latestData = [], isLoading: latestLoading } = useQuery({
    queryKey: ["marketsList", "latest"],
    queryFn: () =>
      fetch("/api/markets/list?sort=date&order=desc").then((r) => r.json()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  // Fetch crypto markets
  const { data: cryptoData = [], isLoading: cryptoLoading } = useQuery({
    queryKey: ["marketsList", "crypto"],
    queryFn: () => fetch("/api/markets/list?type=crypto").then((r) => r.json()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  // Fetch sports markets
  const { data: sportsData = { games: [] }, isLoading: sportsLoading } =
    useQuery({
      queryKey: ["marketsList", "sports"],
      queryFn: () =>
        fetch("/api/markets/list?league=serie-a").then((r) => r.json()),
      staleTime: 30000,
      refetchOnWindowFocus: true,
    })

  if (trendingLoading || latestLoading || cryptoLoading || sportsLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MarketHeader />
        <Onboarding />
        <main className="grow bg-[#141414] md:py-4 mb-4 md:mb-10 text-white">
          <div className="flex justify-center items-center h-full">
            Loading...
          </div>
        </main>
      </div>
    )
  }

  // Normalize data structures
  const trendingMarkets = Array.isArray(trendingData)
    ? trendingData
    : trendingData.items || trendingData.games || []

  const latestMarkets = Array.isArray(latestData)
    ? latestData
    : latestData.items || latestData.games || []

  const cryptoMarkets = Array.isArray(cryptoData)
    ? cryptoData
    : cryptoData.items || []

  const sportsMarkets = sportsData.games || []
  // Prepare sections with deduplication
  const displayedMarketIds = new Set()

  // Helper to filter and track displayed markets
  const prepareMarkets = (markets: any, count: number) => {
    if (!markets || !markets.length) return []

    const filtered = markets.filter(
      (market: any) => !displayedMarketIds.has(market.id)
    )
    const toDisplay = filtered.slice(0, count)

    // Track these markets as displayed
    toDisplay.forEach((market: any) => displayedMarketIds.add(market.id))

    return toDisplay
  }

  // Prepare each section (in priority order)
  const trendingToDisplay = prepareMarkets(trendingMarkets, 3)
  const latestToDisplay = prepareMarkets(latestMarkets, 3)

  // Filter sports and crypto sections to remove duplicates
  const sportsToDisplay = prepareMarkets(sportsMarkets, 3)
  const cryptoToDisplay = prepareMarkets(cryptoMarkets, 3)
  return (
     <div className="flex min-h-screen flex-col">
      <MarketHeader />
      <Onboarding />
      <main className="grow bg-[#141414] md:py-4 mb-4 md:mb-10 text-white">
        <div className="w-full py-3 mb-3 border-b-2 border-b-neutral-800">
          <div className="max-w-[1200px] px-6 mx-auto flex gap-3 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((category) => (
              <Link
                href={
                  category === "All"
                    ? `/markets`
                    : `/markets/${slugify(category)}`
                }
                key={category}
                className="text-[13px] font-semibold"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
        <div className="max-w-[1200px] min-h-[62vh] mx-auto px-4">
          <div className="flex flex-col gap-4">
            <MarketFilters />

            {/* Trending Section */}
            {trendingToDisplay.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <TrendingUp size={18} className="text-[#CC0066]" />
                  <h2 className="text-xl font-semibold">Trending</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {trendingToDisplay.map((market: any, idx: number) => {
                    const marketType =
                      market._marketType ||
                      (market.team1 && market.team2 ? "sports" : "crypto")

                    return marketType === "crypto" || !market.team1 ? (
                      <SingleRow
                        market={market}
                        isGrid
                        key={`trending-crypto-${idx}`}
                      />
                    ) : (
                      <GameRow
                        game={market}
                        isGrid
                        key={`trending-sport-${idx}`}
                      />
                    )
                  })}
                </div>
              </>
            )}

            {/* Latest Section */}
            {latestToDisplay.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <Clock size={18} className="text-[#9900CC]" />
                  <h2 className="text-xl font-semibold">Latest</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {latestToDisplay.map((market: any, idx: any) => {
                    const marketType =
                      market._marketType ||
                      (market.team1 && market.team2 ? "sports" : "crypto")

                    return marketType === "crypto" || !market.team1 ? (
                      <SingleRow
                        market={market}
                        isGrid
                        key={`latest-crypto-${idx}`}
                      />
                    ) : (
                      <GameRow
                        game={market}
                        isGrid
                        key={`latest-sport-${idx}`}
                      />
                    )
                  })}
                </div>
              </>
            )}

            {/* Banner */}
            <Link href="/markets/create" className="hidden md:block">
              <Image
                alt="banner"
                width={1000}
                height={30}
                src="/images/banner.svg"
                className="w-full"
              />
            </Link>
            <Link href="/markets/create" className="md:hidden">
              <Image
                alt="banner"
                width={1000}
                height={30}
                src="/images/banner-mobile.svg"
              />
            </Link>

            {/* Sports Section */}
            {sportsToDisplay.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mt-4">Sports</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {sportsToDisplay.map((game: any, idx: number) => (
                    <GameRow game={game} isGrid key={`sports-${idx}`} />
                  ))}
                </div>
              </>
            )}

            {/* Crypto Section */}
            {cryptoToDisplay.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mt-4">Crypto</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {cryptoToDisplay.map((item: any, idx: number) => (
                    <SingleRow market={item} key={`crypto-${idx}`} isGrid />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
