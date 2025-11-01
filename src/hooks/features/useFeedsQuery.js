import { useQuery, useQueryClient } from "@tanstack/react-query";

const FEEDS_QUERY_KEY = ["feeds"];
const FEEDS_SUMMARY_QUERY_KEY = ["feeds", "summary"];

export function useFeedsData() {
  return useQuery({
    queryKey: FEEDS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/feeds", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch feeds");
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (cache time)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });
}

export function useFeedsSummary() {
  return useQuery({
    queryKey: FEEDS_SUMMARY_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/feeds/summary", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch summary");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes 
    refetchOnWindowFocus: false, 
    refetchOnReconnect: false, 
    retry: 1,
  });
}

export function useInvalidateFeedsCache() {
  const queryClient = useQueryClient();

  return () => {
    // Invalidate both caches
    queryClient.invalidateQueries({ queryKey: FEEDS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: FEEDS_SUMMARY_QUERY_KEY });
  };
}

export function usePrefetchFeeds() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: FEEDS_QUERY_KEY,
      queryFn: async () => {
        const response = await fetch("/api/feeds", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch feeds");
        return response.json();
      },
      staleTime: 1000 * 60 * 10,
    });
  };
}
