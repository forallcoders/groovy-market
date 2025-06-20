"use client"

import { useQuery } from "@tanstack/react-query"
import SimpleSearchBar from "./simple-searchbar"
import SingleRow from "./single-row"
import GameRow from "./game-row"
import Image from "next/image"
import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { slugify } from "@/utils/slugify"
import { cn } from "@/lib/utils"

export default function DynamicMarketsList({
  category = "all",
  league = "",
  title,
  icon = "",
  displayMode = "list",
}: {
  category?: string
  league?: string
  title?: string
  icon?: string
  displayMode?: "list" | "grid"
}) {
  const DEFAULT_LIMIT = displayMode === "grid" ? 12 : 10
  const LOAD_MORE_INCREMENT = displayMode === "grid" ? 6 : 5
  const [visibleItems, setVisibleItems] = useState(DEFAULT_LIMIT)
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const getEndpoint = () => {
    const baseUrl = "/api/markets/list"
    const params = new URLSearchParams()

    if (category === "crypto") {
      params.append("type", "crypto")
    } else if (category === "sports" && league) {
      params.append("league", slugify(league))
    } else if (category === "latest") {
      params.append("sort", "date")
      params.append("order", "desc")
    } else if (category === "trending") {
      params.append("sort", "volume")
      params.append("order", "desc")
    }

    return `${baseUrl}?${params.toString()}`
  }

  const displayTitle =
    title ||
    (category === "all"
      ? "All Markets"
      : category === "crypto"
      ? "Crypto Markets"
      : category === "latest"
      ? "Latest Markets"
      : category === "trending"
      ? "Trending Markets"
      : league
      ? league
      : category.charAt(0).toUpperCase() + category.slice(1) + " Markets")

  const displayIcon =
    icon || (category === "crypto" ? "/images/crypto-markets.png" : null)

  const { data, isLoading } = useQuery({
    queryKey: ["marketsList", category, league],
    queryFn: async () => {
      const response = await fetch(getEndpoint())
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} data`)
      }
      return response.json()
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    enabled: !!category,
  })
  const allItems = useMemo(() => {
    if (!data) return []

    if (Array.isArray(data)) {
      return data
    } else if (data.items) {
      return data.items
    } else if (data.games) {
      return data.games
    } else if (data.markets || data.games) {
      return [...(data.markets || []), ...(data.games || [])]
    }

    return []
  }, [data])

  const searchInItem = (item: any, query: string): boolean => {
    const searchTerm = query.toLowerCase().trim()

    if (!searchTerm) return true

    if (item.title && item.title.toLowerCase().includes(searchTerm)) {
      return true
    }

    if (
      item.description &&
      item.description.toLowerCase().includes(searchTerm)
    ) {
      return true
    }

    if (
      item.team1 &&
      item.team1.name &&
      item.team1.name.toLowerCase().includes(searchTerm)
    ) {
      return true
    }

    if (
      item.team2 &&
      item.team2.name &&
      item.team2.name.toLowerCase().includes(searchTerm)
    ) {
      return true
    }

    if (
      item.markets &&
      Array.isArray(item.markets) &&
      item.markets.length > 0
    ) {
      return item.markets.some((childMarket: any) =>
        searchInItem(childMarket, searchTerm)
      )
    }

    if (
      item.children &&
      Array.isArray(item.children) &&
      item.children.length > 0
    ) {
      return item.children.some((childMarket: any) =>
        searchInItem(childMarket, searchTerm)
      )
    }

    return false
  }

  const filteredItems = useMemo(() => {
    return allItems.filter((item: any) => searchInItem(item, searchQuery))
  }, [allItems, searchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setVisibleItems(DEFAULT_LIMIT)
    setIsExpanded(false)
  }

  const handleShowMore = () => {
    setVisibleItems((prev) =>
      Math.min(prev + LOAD_MORE_INCREMENT, filteredItems.length)
    )
    if (visibleItems + LOAD_MORE_INCREMENT >= filteredItems.length) {
      setIsExpanded(true)
    }
  }

  const handleShowLess = () => {
    setVisibleItems(DEFAULT_LIMIT)
    setIsExpanded(false)
    const marketListTop = document.getElementById("marketListTop")
    if (marketListTop) {
      window.scrollTo({
        top: marketListTop.offsetTop - 100,
        behavior: "smooth",
      })
    }
  }

  const items = filteredItems.slice(0, visibleItems)
  if (isLoading) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col justify-between mb-4">
          <div className="flex justify-between items-center mb-5">
            <div className="w-full flex justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md h-11 w-11 bg-gray-700 animate-pulse"></div>
                <div className="h-8 w-40 bg-gray-700 animate-pulse rounded"></div>
              </div>
            </div>
            <SimpleSearchBar
              placeholder="Search markets"
              className="hidden sm:flex w-[280px]"
            />
          </div>
        </div>
        <div
          className={cn(
            displayMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          )}
        >
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div
              key={index}
              className="border border-[#353739] rounded-lg p-4 animate-pulse h-32 bg-gray-700/20"
            ></div>
          ))}
        </div>
      </div>
    )
  }

  if (!filteredItems || filteredItems.length === 0) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col justify-between mb-4">
          <div className="flex justify-between items-center mb-5">
            <div className="w-full flex justify-between">
              <div className="flex items-center gap-3">
                {displayIcon && (
                  <Image
                    className={cn("rounded-md h-11 w-11 object-cover")}
                    width={60}
                    height={60}
                    alt={`${displayTitle} Logo`}
                    src={displayIcon}
                  />
                )}
                <h2 className="text-4xl font-medium">{displayTitle}</h2>
              </div>
            </div>
            <SimpleSearchBar
              placeholder="Search markets"
              className="hidden sm:flex w-[280px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <SimpleSearchBar
          placeholder="Search markets"
          className="flex mb-3 sm:hidden w-full"
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <div className="flex items-center justify-center p-8 border border-[#353739] rounded-lg">
          <p className="text-gray-400">
            {searchQuery
              ? "No markets found matching your search"
              : "No markets found"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div id="marketListTop" className="flex flex-col justify-between mb-4">
        <div className="flex justify-between items-center mb-5">
          <div className="w-full flex justify-between">
            <div className="flex items-center gap-3">
              {displayIcon && (
                <Image
                  className={cn("rounded-md h-11 w-11 object-cover")}
                  width={60}
                  height={60}
                  alt={`${displayTitle} Logo`}
                  src={displayIcon}
                />
              )}
              <h2 className="text-4xl font-medium">{displayTitle}</h2>
            </div>
          </div>

          <SimpleSearchBar
            placeholder="Search markets"
            className="hidden sm:flex w-[280px]"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <SimpleSearchBar
        placeholder="Search markets"
        className="flex mb-3 sm:hidden w-[280px]"
        value={searchQuery}
        onChange={handleSearchChange}
      />

      <div
        className={cn(
          displayMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        )}
      >
        {items.map((item: any, index: number) => {
          const key = `${item.id}-${index}`
          const type = item._marketType === "sports" ? "sports" : "crypto"

          if (item.team1 && item.team2 && !item?.creator) {
            return (
              <GameRow game={item} key={key} isGrid={displayMode === "grid"} />
            )
          } else {
            return (
              <SingleRow
                market={item}
                key={key}
                type={type}
                isGrid={displayMode === "grid"}
              />
            )
          }
        })}
      </div>

      {filteredItems.length > visibleItems && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleShowMore}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-[#1E1F20] rounded-md border border-[#353739] text-sm font-medium"
          >
            Show More <ChevronDown size={16} />
          </button>
        </div>
      )}

      {isExpanded && visibleItems > DEFAULT_LIMIT && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleShowLess}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-[#1E1F20] rounded-md border border-[#353739] text-sm font-medium"
          >
            Show Less <ChevronUp size={16} />
          </button>
        </div>
      )}

      {/* Current Items Counter */}
      {filteredItems.length > DEFAULT_LIMIT && (
        <div className="text-center text-sm text-white/70 mb-4">
          Showing {Math.min(visibleItems, filteredItems.length)} of{" "}
          {filteredItems.length} markets
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
    </div>
  )
}
