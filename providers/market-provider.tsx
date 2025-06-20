"use client"

import { MarketPanelVariant, TokenOption } from "@/types/Market"
import { League, LeagueWithGame } from "@/types/Sports"
import { useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"

type TeamInfo = {
  name: string
  logo: string
  shortName?: string
}

interface MarketContextType {
  selectedMarketId: string | null
  selectedTeam: TeamInfo | null
  selectedTokenOption: TokenOption
  setSelectedMarketId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedTeam: React.Dispatch<React.SetStateAction<TeamInfo | null>>
  setSelectedTokenOption: React.Dispatch<React.SetStateAction<TokenOption>>
  leagues: League[]
  leagueData: LeagueWithGame | null
  leagueName: string | null
  setLeagueData: (data: LeagueWithGame) => void
  setLeagueName: (name: string) => void
  marketPanelVariant: MarketPanelVariant
  setMarketPanelVariant: React.Dispatch<
    React.SetStateAction<MarketPanelVariant>
  >
}

const MarketContext = createContext<MarketContextType>({
  selectedMarketId: null,
  selectedTeam: null,
  selectedTokenOption: "YES",
  setSelectedMarketId: () => {},
  setSelectedTeam: () => {},
  setSelectedTokenOption: () => {},
  leagues: [],
  leagueData: null,
  leagueName: null,
  setLeagueData: () => {},
  setLeagueName: () => {},
  marketPanelVariant: "default",
  setMarketPanelVariant: () => {},
})

interface MarketProviderProps {
  children: ReactNode
  initialLeagueName?: string | null
  initialLeagues?: League[]
}

export function MarketProvider({
  children,
  initialLeagueName = null,
  initialLeagues = [],
}: MarketProviderProps) {
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null)
  const [selectedTokenOption, setSelectedTokenOption] =
    useState<TokenOption>("YES")
  const [leagueData, setLeagueData] = useState<LeagueWithGame | null>(null)
  const [leagueName, setLeagueName] = useState<string | null>(initialLeagueName)
  const [leagues] = useState<League[]>(initialLeagues)

  const [marketPanelVariant, setMarketPanelVariant] =
    useState<MarketPanelVariant>("teamAbbreviations")
  const queryClient = useQueryClient()

  // This effect runs when the league changes
  useEffect(() => {
    // When league changes, reset selections
    setSelectedMarketId(null)
    setSelectedTeam(null)

    // Get the current league
    const currentLeague = leagueName?.toLowerCase() || ""
    const isCrypto = currentLeague === "crypto"

    // Get data from React Query cache - no timeout needed
    const queryKey = isCrypto
      ? ["marketsList", "crypto"]
      : ["gamesList", currentLeague]
    const marketData = queryClient.getQueryData(queryKey)

    // If we have data, select the first market
    if (marketData && Array.isArray(marketData) && marketData.length > 0) {
      const firstMarket = marketData[0]
      setSelectedMarketId(firstMarket.id)

      // For sports, also set the team
      if (!isCrypto && firstMarket.team1) {
        setSelectedTeam({
          name: firstMarket.team1.name,
          shortName: firstMarket.team1.shortName,
          logo: firstMarket.team1.logo,
        })
      }
    }
  }, [leagueName, queryClient])

  return (
    <MarketContext.Provider
      value={{
        selectedMarketId,
        selectedTeam,
        selectedTokenOption,
        setSelectedMarketId,
        setSelectedTeam,
        setSelectedTokenOption,
        leagues,
        leagueData,
        leagueName,
        setLeagueData,
        setLeagueName,
        marketPanelVariant,
        setMarketPanelVariant,
      }}
    >
      {children}
    </MarketContext.Provider>
  )
}

export function useMarketContext() {
  return useContext(MarketContext)
}
