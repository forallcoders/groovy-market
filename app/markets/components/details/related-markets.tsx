"use client"

import { useState, useMemo } from "react"
import RelatedRow from "../related-row"
import SimpleSearchBar from "../simple-searchbar"

type RelatedMarketsProps = {
  markets: any[]
}

const ITEMS_PER_PAGE = 5

const RelatedMarket = ({ market }: { market: any }) => {
  if (!market) {
    return null
  }

  return <RelatedRow market={market} />
}

const searchInMarket = (market: any, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase().trim()

  if (!term) return true

  if (market.title && market.title.toLowerCase().includes(term)) {
    return true
  }

  if (market.description && market.description.toLowerCase().includes(term)) {
    return true
  }

  if (market.team1) {
    if (market.team1.name && market.team1.name.toLowerCase().includes(term)) {
      return true
    }
    if (
      market.team2 &&
      market.team2.name &&
      market.team2.name.toLowerCase().includes(term)
    ) {
      return true
    }

    if (
      market.team1.shortName &&
      market.team1.shortName.toLowerCase().includes(term)
    ) {
      return true
    }
    if (
      market.team2 &&
      market.team2.shortName &&
      market.team2.shortName.toLowerCase().includes(term)
    ) {
      return true
    }
  }

  if (market.data) {
    const dataStr = JSON.stringify(market.data).toLowerCase()
    if (dataStr.includes(term)) {
      return true
    }
  }

  if (
    market.markets &&
    Array.isArray(market.markets) &&
    market.markets.length > 0
  ) {
    return market.markets.some((child: any) => searchInMarket(child, term))
  }

  if (
    market.children &&
    Array.isArray(market.children) &&
    market.children.length > 0
  ) {
    return market.children.some((child: any) => searchInMarket(child, term))
  }

  return false
}

const RelatedMarkets: React.FC<RelatedMarketsProps> = ({ markets }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  const filteredMarkets = useMemo(() => {
    if (!markets || markets.length === 0) return []

    return markets.filter((market) => searchInMarket(market, searchTerm))
  }, [markets, searchTerm])

  const displayedMarkets = useMemo(() => {
    return filteredMarkets.slice(0, visibleCount)
  }, [filteredMarkets, visibleCount])

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE)
  }

  const handleShowLess = () => {
    setVisibleCount(ITEMS_PER_PAGE)
  }

  return (
    <div className="my-8">
      <div className="flex justify-between gap-4">
        <h3 className="text-2xl mb-4">Related Markets</h3>

        <SimpleSearchBar
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setVisibleCount(ITEMS_PER_PAGE)
          }}
          placeholder="Search related markets..."
          className="mb-6"
        />
      </div>

      {filteredMarkets.length === 0 ? (
        <div className="text-center text-gray-400 mt-4">No markets found.</div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {displayedMarkets.map((market, index) => (
              <RelatedMarket market={market} key={`${market.id}_${index}`} />
            ))}
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {visibleCount < filteredMarkets.length && (
              <button
                onClick={handleShowMore}
                className="px-4 cursor-pointer font-semibold text-sm py-2 bg-[#CC0066]/90 hover:bg-[#CC0066] text-white rounded-md w-full"
              >
                Show More
              </button>
            )}
            {visibleCount > ITEMS_PER_PAGE && (
              <button
                onClick={handleShowLess}
                className="px-4 cursor-pointer font-semibold text-sm py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md w-full"
              >
                Show Less
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default RelatedMarkets
