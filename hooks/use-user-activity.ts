import { useQuery } from "@tanstack/react-query";

export type UserActivity = {
  type: string;
  market: {
    id: string;
    league: string;
    description: string;
    image: string;
    pricePerShare: string;
    outcome: boolean | null;
    noLabel: string;
    yesLabel: string;
    shares: number;
  },
  details: {
    amount: number;
    date: string;
    transactionHash: string;
  };
  user: {
    username: string;
    avatar: string;
    proxyWallet: string;
  };
};

export async function fetchUserActivity(user?: string): Promise<UserActivity[]> {
  const search = user ? `?user=${user}` : "";
  const response = await fetch(`/api/user/activity${search}`);
  const data = await response.json();
  return data;
}

export function useUserActivity(user?: string) {
  const { isPending, isError, data, refetch } = useQuery({
    queryKey: ["userActivity", user],
    queryFn: () => fetchUserActivity(user),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount:true,
  });
  return {
    isLoading: isPending,
    isError: isError,
    activities: data ?? [],
    refetchActivityValue: refetch,
  };
}
