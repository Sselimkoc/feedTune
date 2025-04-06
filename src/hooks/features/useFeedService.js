"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/services/feedService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Feed servisi ile etkileşim için merkezi hook.
 * Tüm feed işlemleri için tek bir giriş noktası sağlar.
 */
export function useFeedService() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const userId = user?.id;

  // Cache ayarları
  const STALE_TIME = 2 * 60 * 1000; // 2 dakika
  const CACHE_TIME = 60 * 60 * 1000; // 60 dakika
  const REFRESH_INTERVAL = 1000 * 60 * 5; // 5 dakika (otomatik yenileme için)

  // Son yenileme zamanını takip etmek için state
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Feed listesini getir
  const {
    data: feeds,
    isLoading: isLoadingFeeds,
    isError: isErrorFeeds,
    error: feedsError,
    refetch: refetchFeeds,
  } = useQuery({
    queryKey: ["feeds", userId],
    queryFn: () => feedService.getFeeds(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    onSuccess: () => setLastRefreshTime(new Date()),
  });

  // Feed öğelerini getir
  const {
    data: items,
    isLoading: isLoadingItems,
    isError: isErrorItems,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ["feedItems", userId, feeds],
    queryFn: () => {
      const feedIds = feeds?.map((feed) => feed.id) || [];
      return feedService.getFeedItems(feedIds, 100);
    },
    enabled: !!userId && !!feeds && feeds.length > 0,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    onSuccess: () => setLastRefreshTime(new Date()),
  });

  // Favori öğeleri getir
  const {
    data: favorites,
    isLoading: isLoadingFavorites,
    refetch: refetchFavorites,
  } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: () => feedService.getFavorites(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
  });

  // Daha sonra oku listesini getir
  const {
    data: readLaterItems,
    isLoading: isLoadingReadLater,
    refetch: refetchReadLater,
  } = useQuery({
    queryKey: ["readLater", userId],
    queryFn: () => feedService.getReadLaterItems(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
  });

  // Otomatik yenileme gerçekleştiğinde son yenileme zamanını güncelle
  useEffect(() => {
    if (items) {
      setLastRefreshTime(new Date());
    }
  }, [items]);

  // Otomatik yenileme için zamanlayıcı (5 dakikada bir)
  useEffect(() => {
    // Feed otomatik yenileme için periyodik zamanlayıcı (ek güvence olarak)
    const autoRefreshTimer = setInterval(() => {
      // Son yenilemeden beri 5 dakika geçtiyse yenile
      const timeSinceLastRefresh = new Date() - lastRefreshTime;
      if (timeSinceLastRefresh > REFRESH_INTERVAL) {
        refreshAll();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(autoRefreshTimer);
  }, [lastRefreshTime]);

  // Tüm verileri yenile
  const refreshAll = useCallback(async () => {
    if (!userId) return;

    try {
      const results = await Promise.all([
        refetchFeeds(),
        refetchItems(),
        refetchFavorites(),
        refetchReadLater(),
      ]);

      setLastRefreshTime(new Date());

      // Sadece kullanıcı tarafından manuel yenileme yapıldığında mesaj göster
      if (results[0].isSuccess || results[1].isSuccess) {
        toast.success(t("feeds.refreshed"));
      }

      return results;
    } catch (error) {
      console.error("Yenileme hatası:", error);
      toast.error(t("errors.refreshFailed"));
      return [];
    }
  }, [
    userId,
    refetchFeeds,
    refetchItems,
    refetchFavorites,
    refetchReadLater,
    t,
  ]);

  // Okuma durumunu değiştir
  const toggleReadMutation = useMutation({
    mutationFn: ({ itemId, isRead }) =>
      feedService.toggleItemReadStatus(userId, itemId, isRead),
    onSuccess: (result, variables) => {
      // Cache'i güncelleme
      queryClient.invalidateQueries(["feedItems"]);

      // Doğrudan Cache güncelleme
      queryClient.setQueriesData(["feedItems"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((item) =>
          item.id === variables.itemId
            ? { ...item, is_read: variables.isRead }
            : item
        );
      });
    },
    onError: (error) => {
      console.error("Okuma durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
  });

  // Favori durumunu değiştir
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ itemId, isFavorite }) =>
      feedService.toggleItemFavoriteStatus(userId, itemId, isFavorite),
    onSuccess: (result, variables) => {
      // Cache'i güncelle - UI güncellemesi için önemli
      queryClient.invalidateQueries(["feedItems"]);
      queryClient.invalidateQueries(["favorites"]);

      // Doğrudan Cache güncelleme
      queryClient.setQueriesData(["feedItems"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((item) =>
          item.id === variables.itemId
            ? { ...item, is_favorite: variables.isFavorite }
            : item
        );
      });

      // Favoriler listesini de güncelle
      if (variables.isFavorite) {
        queryClient.setQueriesData(["favorites"], (oldData) => {
          const newItem = items?.find((item) => item.id === variables.itemId);
          if (!oldData || !newItem) return oldData;
          return [...oldData, newItem];
        });
      } else {
        queryClient.setQueriesData(["favorites"], (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter((item) => item.id !== variables.itemId);
        });
      }
    },
    onError: (error) => {
      console.error("Favori durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
  });

  // Daha sonra oku durumunu değiştir
  const toggleReadLaterMutation = useMutation({
    mutationFn: ({ itemId, isReadLater }) =>
      feedService.toggleItemReadLaterStatus(userId, itemId, isReadLater),
    onSuccess: (result, variables) => {
      // Cache'i güncelle - UI güncellemesi için önemli
      queryClient.invalidateQueries(["feedItems"]);
      queryClient.invalidateQueries(["readLater"]);

      // Doğrudan Cache güncelleme
      queryClient.setQueriesData(["feedItems"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((item) =>
          item.id === variables.itemId
            ? { ...item, is_read_later: variables.isReadLater }
            : item
        );
      });

      // Daha sonra oku listesini de güncelle
      if (variables.isReadLater) {
        queryClient.setQueriesData(["readLater"], (oldData) => {
          const newItem = items?.find((item) => item.id === variables.itemId);
          if (!oldData || !newItem) return oldData;
          return [...oldData, newItem];
        });
      } else {
        queryClient.setQueriesData(["readLater"], (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter((item) => item.id !== variables.itemId);
        });
      }
    },
    onError: (error) => {
      console.error("Daha sonra oku durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
  });

  // Eski içerikleri temizle
  const cleanupMutation = useMutation({
    mutationFn: ({
      olderThanDays = 30,
      keepFavorites = true,
      keepReadLater = true,
    }) =>
      feedService.cleanUpOldItems(
        userId,
        olderThanDays,
        keepFavorites,
        keepReadLater
      ),
    onSuccess: (result) => {
      // Verileri yenilemek için invalidate
      queryClient.invalidateQueries(["feedItems", userId]);

      // Sonuçları döndür
      return result;
    },
  });

  // Helper fonksiyonlar
  const toggleRead = useCallback(
    (itemId, isRead) => {
      if (!userId) return;
      toggleReadMutation.mutate({ itemId, isRead });
    },
    [userId, toggleReadMutation]
  );

  const toggleFavorite = useCallback(
    (itemId, isFavorite) => {
      if (!userId) return;
      toggleFavoriteMutation.mutate({ itemId, isFavorite });
    },
    [userId, toggleFavoriteMutation]
  );

  const toggleReadLater = useCallback(
    (itemId, isReadLater) => {
      if (!userId) return;
      toggleReadLaterMutation.mutate({ itemId, isReadLater });
    },
    [userId, toggleReadLaterMutation]
  );

  // Feed ekleme
  const addFeedMutation = useMutation({
    mutationFn: ({ url, type }) => {
      if (type === "rss") {
        return feedService.addRssFeed(url, userId);
      } else if (type === "youtube") {
        return feedService.addYoutubeFeed(url, userId);
      }
      throw new Error("Geçersiz feed türü");
    },
    onSuccess: () => {
      // Feed eklendiğinde feed listesini güncelle
      queryClient.invalidateQueries(["feeds", userId]);
    },
  });

  // Feed silme
  const deleteFeedMutation = useMutation({
    mutationFn: (feedId) => feedService.deleteFeed(feedId, userId),
    onSuccess: () => {
      // Feed silindiğinde feed listesini ve item'ları güncelle
      queryClient.invalidateQueries(["feeds", userId]);
      queryClient.invalidateQueries(["feedItems", userId]);
    },
  });

  // Feed ekle
  const addFeed = useCallback(
    (url, type) => addFeedMutation.mutateAsync({ url, type }),
    [addFeedMutation]
  );

  // Feed sil
  const deleteFeed = useCallback(
    (feedId) => deleteFeedMutation.mutateAsync(feedId),
    [deleteFeedMutation]
  );

  // Eski içerikleri temizle
  const cleanupOldItems = useCallback(
    (options = {}) => {
      const {
        olderThanDays = 30,
        keepFavorites = true,
        keepReadLater = true,
      } = options;
      return cleanupMutation.mutateAsync({
        olderThanDays,
        keepFavorites,
        keepReadLater,
      });
    },
    [cleanupMutation]
  );

  return {
    // Veriler
    feeds,
    items,
    favorites,
    readLaterItems,

    // Yükleme durumları
    isLoading: isLoadingFeeds || isLoadingItems,
    isLoadingFeeds,
    isLoadingItems,
    isLoadingFavorites,
    isLoadingReadLater,

    // Hata durumları
    isError: isErrorFeeds || isErrorItems,
    error: feedsError || itemsError,

    // Yenileme fonksiyonları
    refreshAll,
    refetchFeeds,
    refetchItems,
    refetchFavorites,
    refetchReadLater,
    lastRefreshTime,

    // Etkileşim fonksiyonları
    toggleRead,
    toggleFavorite,
    toggleReadLater,

    // Mutation durumları
    isTogglingRead: toggleReadMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isTogglingReadLater: toggleReadLaterMutation.isPending,

    // Temizleme fonksiyonları
    cleanupOldItems,
    isCleaningUp: cleanupMutation.isLoading,

    // Feed ekleme ve silme fonksiyonları
    addFeed,
    deleteFeed,
  };
}
