import { useQuery } from "@tanstack/react-query"

export const useSports = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sports"],
    queryFn: fetchSports,
  })
  return { data, isLoading, error }
}

export const useMatches = ({
  sportType,
  leagueId,
}: {
  leagueId?: number
  sportType?: string
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["matches", sportType, leagueId],
    queryFn: () =>
      fetchMatches({
        sportType,
        leagueId,
      }),
    enabled: !!sportType && !!leagueId,
  })
  return { data, isLoading, error }
}

export const useLeagues = ({ sport }: { sport?: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leagues", sport],
    queryFn: () => fetchLeagues({ sport }),
    enabled: !!sport,
  })
  return { data, isLoading, error }
}

const fetchSports = async () => {
  try {
    const response = await fetch("/api/sports")
    const data = await response.json()
    return data
      .map((d: any) => ({ ...d }))
      .filter(
        (item: any) =>
          item.short_name !== "american_football" && item.short_name !== "f1"
      )
  } catch (error) {
    console.error("Error fetching sports:", error)
    return []
  }
}

const fetchMatches = async ({
  sportType,
  leagueId,
}: {
  sportType?: string
  leagueId?: number
}) => {
  try {
    const searchParams = new URLSearchParams()
    if (sportType) searchParams.set("sport", sportType.toString())
    if (leagueId && sportType !== "mma")
      searchParams.set("leagueId", leagueId.toString())

    const response = await fetch(`/api/matches?${searchParams.toString()}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching matches:", error)
    return []
  }
}

const fetchLeagues = async ({ sport }: { sport?: string }) => {
  try {
    const searchParams = new URLSearchParams()
    if (sport) searchParams.set("sport", sport.toString())

    const response = await fetch(`/api/leagues?${searchParams.toString()}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching leagues:", error)
    return []
  }
}
