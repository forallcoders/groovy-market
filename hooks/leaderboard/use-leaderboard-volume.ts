import { useQuery } from "@tanstack/react-query"

export const useLeaderboardVolume = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboardVolume"],
    queryFn: () => fetchLeaderboardVolume(),
  })
  return { leaderboardVolume: data, isLoading, error, refetch }
}

const fetchLeaderboardVolume = async () => {
  const response = await fetch(`/api/leaderboard/volume`)
  const data = await response.json()
  return data
}
