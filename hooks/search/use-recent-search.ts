import { UserSearchHistory } from "@/lib/db/schema";
import { useUserContext } from "@/providers/user-provider";
import { useQuery } from "@tanstack/react-query";

export function useRecentSearch() {
  const { user } = useUserContext();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["recent-search"],
    queryFn: () => recentSearch(),
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return { data, isLoading, error, refetch };
}

const recentSearch = async () => {
  const response = await fetch(`/api/user/recent-search`);
  const data = await response.json();
  return data?.recentSearches as UserSearchHistory[];
};
