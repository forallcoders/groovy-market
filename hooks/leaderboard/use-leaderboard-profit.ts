import { useQuery } from "@tanstack/react-query"

export const useLeaderboardProfit = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboardProfit"],
    queryFn: () => fetchLeaderboardProfit(),
  })
  return { leaderboardProfit: data, isLoading, error, refetch }
}

const fetchLeaderboardProfit = async () => {
  const response = await fetch(`/api/leaderboard/profit`)
  const data = await response.json()
  return data
}
