"use client"
import Footer from "@/app/markets/components/footer"
import { MarketProvider } from "@/providers/market-provider"
import { League } from "@/types/Sports"
import { slugify } from "@/utils/slugify"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import LeagueSelector from "./league-selector"
import MarketsPanelWrapper from "./order/market-panel-wrapper"
import GameSlider from "./games-slider"

interface LayoutClientProps {
  children: React.ReactNode
  initialLeagueName?: string | null
  initialLeagues: League[]
}

const categories = [
  { name: "All", path: "/markets" },
  { name: "Sports", path: "/markets/sports" },
  { name: "Crypto", path: "/markets/crypto" },
  { name: "Latest", path: "/markets/latest" },
  { name: "Trending", path: "/markets/trending" },
]

export default function MarketsLayout({
  children,
  initialLeagueName = null,
  initialLeagues,
}: LayoutClientProps) {
  const pathname = usePathname()

  const getCurrentCategory = () => {
    if (pathname === "/markets") return "all"
    if (pathname.includes("/markets/crypto")) return "crypto"
    if (pathname.includes("/markets/sports")) return "sports"
    if (pathname.includes("/markets/latest")) return "latest"
    if (pathname.includes("/markets/trending")) return "trending"
    return "all"
  }

  const currentCategory = getCurrentCategory()
  const isCrypto =
    currentCategory === "crypto" || initialLeagueName === "Crypto"
  const showLeagueSelector = currentCategory === "sports"

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  useEffect(() => {
    const prefetchMarketData = async () => {
      let endpoint: string
      let queryKey: string[]

      if (currentCategory === "crypto") {
        endpoint = "/api/markets/list?type=crypto"
        queryKey = ["marketsList", "crypto"]
      } else if (currentCategory === "sports" && initialLeagueName) {
        endpoint = `/api/markets/list?league=${slugify(initialLeagueName)}`
        queryKey = ["gamesList", initialLeagueName]
      } else if (currentCategory === "latest") {
        endpoint = "/api/markets/list?sort=date&order=desc"
        queryKey = ["marketsList", "latest"]
      } else if (currentCategory === "trending") {
        endpoint = "/api/markets/list?sort=volume&order=desc"
        queryKey = ["marketsList", "trending"]
      } else {
        endpoint = "/api/markets/list"
        queryKey = ["marketsList", "all"]
      }

      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const response = await fetch(endpoint)
          if (!response.ok) {
            throw new Error(`Failed to fetch markets list`)
          }
          return response.json()
        },
      })
    }

    prefetchMarketData()
  }, [queryClient, initialLeagueName, isCrypto, currentCategory])

  return (
    <QueryClientProvider client={queryClient}>
      <MarketProvider
        initialLeagueName={initialLeagueName}
        initialLeagues={initialLeagues}
      >
        <main className="grow bg-[#141414] py-4 text-white">
          <div className="w-full">
            <div className="max-w-[1200px] py-3 px-6 mx-auto flex gap-3 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((category) => (
                <Link
                  href={category.path}
                  key={category.name}
                  className={`text-[13px] font-semibold ${
                    category.name.toLowerCase() === currentCategory ||
                    (category.name === "All" && currentCategory === "all")
                      ? "text-white underline"
                      : "text-gray-400"
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
            <GameSlider />
          </div>
          <div className="max-w-[1200px] min-h-[62vh] mx-auto sm:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] lg:grid-cols-[100px_1fr_300px] gap-6 mt-4 sm:mt-6">
              {/* Left Sidebar - Only show for Sports */}
              {showLeagueSelector ? <LeagueSelector /> : <div></div>}

              {/* Main Content */}
              {children}

              {/* Right Sidebar */}
              <MarketsPanelWrapper />
            </div>
          </div>
        </main>
        <Footer />
      </MarketProvider>
    </QueryClientProvider>
  )
}
