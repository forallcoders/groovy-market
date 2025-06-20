import { useQuery } from "@tanstack/react-query";


export type PublicOrders = {
  totalValue: number;
  orders: any[];
};

export async function fetchUserOrders(
  user?: string
): Promise<PublicOrders> {
  const response = await fetch(
    `/api/orders/user-orders-public?user=${user}`
  );
  const data = await response.json();
  return data;
}

export function useUserPublicOrders(user?: string) {
  const { isPending, isError, data, refetch } = useQuery({
    queryKey: ["userOrders", user],
    queryFn: () => fetchUserOrders(user),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });
  return {
    isLoading: isPending,
    isError: isError,
    totalValue: data?.totalValue ?? 0,
    orders: data?.orders ?? [],
    refetchOrdersValue: refetch,
  };
}
