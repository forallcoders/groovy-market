import { useQuery } from "@tanstack/react-query"

export interface Comment {
  id: string
  comment: string
  createdAt: Date
  userId?: number
  username?: string
  avatar?: string
}

export const useComments = (marketId: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["comments", marketId],
    queryFn: () => fetchComments(marketId),
  })
  return { comments: data, isLoading, error, refetch }
}

const fetchComments = async (marketId: string) => {
  const response = await fetch(`/api/comments?marketId=${marketId}`)
  const data = await response.json()
  return data as Comment[]
}
