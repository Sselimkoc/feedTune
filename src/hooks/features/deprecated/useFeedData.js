"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchFeeds, fetchFeedItems, limitItemsPerFeed } from "./useFeeds";

// Cache settings
const SHORT_STALE_TIME = 1000 * 60 * 2; // 2 minutes
const LONG_CACHE_TIME = 1000 * 60 * 60; // 60 minutes

export function useFeedData() {
  const { user } = useAuthStore();

  // If user is not logged in, return empty data
  if (!user) {
    return {
      feeds: [],
      items: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => {
        // console.warn("User is not logged in, data cannot be refetched.");
      },
    };
  }

  // Fetch feeds
  const { data: feeds, isLoading: isLoadingFeeds, isError: isErrorFeeds, error: errorFeeds, refetch: refetchFeeds } = useQuery({
    queryKey: ["feeds", user.id],
    queryFn: () => fetchFeeds(user.id),
    staleTime: SHORT_STALE_TIME,
    cacheTime: LONG_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Fetch feed items
  const { data: items, isLoading: isLoadingItems, isError: isErrorItems, error: errorItems, refetch: refetchItems } = useQuery({
    queryKey: ["feedItems", feeds?.map((feed) => feed.id)],
    queryFn: () => fetchFeedItems(feeds?.map((feed) => feed.id)),
    staleTime: SHORT_STALE_TIME,
    cacheTime: LONG_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Combine loading and error states
  const isLoading = isLoadingFeeds || isLoadingItems;
  const isError = isErrorFeeds || isErrorItems;
  const error = errorFeeds || errorItems;

  // Limit items per feed
  const { items: limitedItems } = limitItemsPerFeed(feeds, items);
  console.log(`useFeedData: ${limitedItems?.length || 0} items loaded`);
  

  return {
    feeds,
    items: limitedItems,
    isLoading,
    isError,
    error,
    refetch: async () => {
      // console.log("useFeedData: Veriler yenileniyor...");

      // Run both refetch processes in parallel
      const [feedsResult, itemsResult] = await Promise.all([refetchFeeds(), refetchItems()]);

      // Get updated feed and item data
      const updatedFeeds = feedsResult.data;
      const updatedItems = itemsResult.data;

      // Limit items per feed
      const { items: updatedLimitedItems } = limitItemsPerFeed(updatedFeeds, updatedItems);

      console.log(`useFeedData: Veriler yenilendi. ${updatedLimitedItems?.length || 0} içerik hazır.`);

      // Return updated data
      return {
        feeds: updatedFeeds,
        items: updatedLimitedItems,
      };
    },
  };
}
