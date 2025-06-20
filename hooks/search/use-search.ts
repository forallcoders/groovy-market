import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => search(debouncedQuery),
    enabled: !!debouncedQuery,
  });

  return { data, isLoading, error };
}

const search = async (query: string) => {
  const response = await fetch(`/api/search?query=${query}`);
  const data = await response.json();
  return data;
};
