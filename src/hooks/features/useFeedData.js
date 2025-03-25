"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchFeeds, fetchFeedItems, limitItemsPerFeed } from "./useFeeds";

// Cache ayarları
const SHORT_STALE_TIME = 1000 * 60 * 2; // 2 dakika - Veriler bu süre sonra "stale" olur
const LONG_CACHE_TIME = 1000 * 60 * 60; // 60 dakika - Cache bu süre saklanır

export function useFeedData() {
  const { user } = useAuthStore();

  // Kullanıcı yoksa boş veriler döndür
  if (!user) {
    return {
      feeds: [],
      items: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => {
        console.warn("Kullanıcı oturum açmamış, veri yenilenemiyor.");
      },
    };
  }

  // Feed'leri çek
  const {
    data: feeds,
    isLoading: isLoadingFeeds,
    isError: isErrorFeeds,
    error: errorFeeds,
    refetch: refetchFeeds,
  } = useQuery({
    queryKey: ["feeds", user.id],
    queryFn: () => fetchFeeds(user.id),
    enabled: !!user.id,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME, // cacheTime yerine gcTime (v5)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
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
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME, // cacheTime yerine gcTime (v5)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Yükleme ve hata durumlarını birleştir
  const isLoading = isLoadingFeeds || isLoadingItems;
  const isError = isErrorFeeds || isErrorItems;
  const error = errorFeeds || errorItems;

  // Her feed için öğe sayısını sınırla
  const { items: limitedItems } = limitItemsPerFeed(feeds, items);

  // İçerikleri logla ve potansiyel sorunları kontrol et
  console.log(`useFeedData: ${limitedItems?.length || 0} içerik yüklendi`);
  
  if (feeds?.length > 0 && (!items || items.length === 0)) {
    console.warn("Feed var ama içerik yok!");
  }

  return {
    feeds,
    items: limitedItems,
    isLoading,
    isError,
    error,
    refetch: async () => {
      console.log("useFeedData: Veriler yenileniyor...");
      
      // Her iki refetch işlemini paralel olarak çalıştır
      const [feedsResult, itemsResult] = await Promise.all([
        refetchFeeds(),
        refetchItems(),
      ]);

      // Güncellenmiş feed ve öğe verilerini al
      const updatedFeeds = feedsResult.data;
      const updatedItems = itemsResult.data;

      // Öğeleri sınırla
      const { items: updatedLimitedItems } = limitItemsPerFeed(
        updatedFeeds,
        updatedItems
      );

      console.log(`useFeedData: Veriler yenilendi. ${updatedLimitedItems?.length || 0} içerik hazır.`);
      
      // Güncellenmiş verileri döndür
      return {
        feeds: updatedFeeds,
        items: updatedLimitedItems,
      };
    },
  };
}
