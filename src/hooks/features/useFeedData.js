"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchFeeds, fetchFeedItems, limitItemsPerFeed } from "./useFeeds";

export function useFeedData() {
  const { user } = useAuthStore();

  // Feed'leri çek
  const {
    data: feeds,
    isLoading: isLoadingFeeds,
    isError: isErrorFeeds,
    error: errorFeeds,
    refetch: refetchFeeds,
  } = useQuery({
    queryKey: ["feeds", user?.id],
    queryFn: () => fetchFeeds(user?.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 dakika
    cacheTime: 1000 * 60 * 30, // 30 dakika
  });

  // Feed öğelerini çek
  const {
    data: items,
    isLoading: isLoadingItems,
    isError: isErrorItems,
    error: errorItems,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ["feedItems", feeds?.map((feed) => feed.id)],
    queryFn: () => fetchFeedItems(feeds?.map((feed) => feed.id)),
    enabled: !!feeds && feeds.length > 0,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  // Yükleme ve hata durumlarını birleştir
  const isLoading = isLoadingFeeds || isLoadingItems;
  const isError = isErrorFeeds || isErrorItems;
  const error = errorFeeds || errorItems;

  // Her feed için öğe sayısını sınırla
  const { items: limitedItems } = limitItemsPerFeed(feeds, items);

  return {
    feeds,
    items: limitedItems,
    isLoading,
    isError,
    error,
    refetch: () => {
      refetchFeeds();
      refetchItems();
    },
  };
}
