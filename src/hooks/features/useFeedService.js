"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
  const STALE_TIME = 5 * 60 * 1000; // 5 dakika (arttırıldı)
  const CACHE_TIME = 60 * 60 * 1000; // 60 dakika
  const REFRESH_INTERVAL = 1000 * 60 * 10; // 10 dakika (arttırıldı)

  // Son yenileme zamanını takip etmek için state
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Feed listesini getir - öncelikli veri
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
    // Değişiklik: Hata yönetimini geliştirme
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Feed öğelerini getir - optimize edilmiş sorgu
  const {
    data: items,
    isLoading: isLoadingItems,
    isError: isErrorItems,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ["feedItems", userId, feeds?.length],
    queryFn: () => {
      if (!feeds || feeds.length === 0) return [];
      const feedIds = feeds.map((feed) => feed.id);
      return feedService.getFeedItems(feedIds, 100);
    },
    enabled: !!userId && !!feeds && feeds.length > 0,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    onSuccess: () => setLastRefreshTime(new Date()),
    // Değişiklik: Sayfa yüklenirken daha hızlı hale getirmek için
    keepPreviousData: true,
    // Değişiklik: feed değiştiğinde bile eski verileri göster
    placeholderData: (previousData) => previousData,
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
    // Değişiklik: Eski verileri göster
    keepPreviousData: true,
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
    // Değişiklik: Eski verileri göster
    keepPreviousData: true,
  });

  // Otomatik yenileme gerçekleştiğinde son yenileme zamanını güncelle
  useEffect(() => {
    if (items) {
      setLastRefreshTime(new Date());
    }
  }, [items]);

  // Otomatik yenileme için zamanlayıcı
  useEffect(() => {
    // Feed otomatik yenileme için periyodik zamanlayıcı (ek güvence olarak)
    const autoRefreshTimer = setInterval(() => {
      // Son yenilemeden beri belirlenen süre geçtiyse yenile
      const timeSinceLastRefresh = new Date() - (lastRefreshTime || 0);
      if (lastRefreshTime && timeSinceLastRefresh > REFRESH_INTERVAL) {
        // Değişiklik: Otomatik yenilemede sessiz çalışma
        silentRefresh();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(autoRefreshTimer);
  }, [lastRefreshTime]);

  // Değişiklik: Sessiz yenileme - kullanıcıya bildirim göstermeden yeniler
  const silentRefresh = useCallback(async () => {
    if (!userId) return;

    try {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["feeds", userId],
          exact: true,
        }),
        queryClient.refetchQueries({
          queryKey: ["feedItems", userId],
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: ["favorites", userId],
          exact: true,
        }),
        queryClient.refetchQueries({
          queryKey: ["readLater", userId],
          exact: true,
        }),
      ]);

      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Sessiz yenileme hatası:", error);
    }
  }, [userId, queryClient]);

  // Tüm verileri yenile - kullanıcı tarafından tetiklenen
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

      // Sonuçları döndür
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

  // Değişiklik: Cache güncelleme yardımcı fonksiyonu - daha verimli
  const updateItemInCache = useCallback(
    (itemId, updates) => {
      // Tüm feed öğeleri cache'inde güncelleme yap
      queryClient.setQueriesData({ queryKey: ["feedItems"] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
      });

      // Favoriler cache'inde güncelleme yap
      if ("is_favorite" in updates) {
        if (updates.is_favorite) {
          // Favorilere ekle
          queryClient.setQueriesData({ queryKey: ["favorites"] }, (oldData) => {
            if (!oldData) return oldData;
            const item = items?.find((i) => i.id === itemId);
            if (!item) return oldData;
            const existingItem = oldData.find((i) => i.id === itemId);
            if (existingItem) return oldData;
            return [...oldData, { ...item, ...updates }];
          });
        } else {
          // Favorilerden çıkar
          queryClient.setQueriesData({ queryKey: ["favorites"] }, (oldData) => {
            if (!oldData) return oldData;
            return oldData.filter((item) => item.id !== itemId);
          });
        }
      }

      // Sonra oku cache'inde güncelleme yap
      if ("is_read_later" in updates) {
        if (updates.is_read_later) {
          // Sonra oku'ya ekle
          queryClient.setQueriesData({ queryKey: ["readLater"] }, (oldData) => {
            if (!oldData) return oldData;
            const item = items?.find((i) => i.id === itemId);
            if (!item) return oldData;
            const existingItem = oldData.find((i) => i.id === itemId);
            if (existingItem) return oldData;
            return [...oldData, { ...item, ...updates }];
          });
        } else {
          // Sonra oku'dan çıkar
          queryClient.setQueriesData({ queryKey: ["readLater"] }, (oldData) => {
            if (!oldData) return oldData;
            return oldData.filter((item) => item.id !== itemId);
          });
        }
      }
    },
    [queryClient, items]
  );

  // Okuma durumunu değiştir - Optimistic updates ile geliştirildi
  const toggleReadMutation = useMutation({
    mutationFn: ({ itemId, isRead }) =>
      feedService.toggleItemReadStatus(userId, itemId, isRead),
    onMutate: async ({ itemId, isRead }) => {
      // Önceki sorgulardan gelen verileri yedekle
      const previousData = queryClient.getQueryData([
        "feedItems",
        userId,
        feeds?.length,
      ]);

      // Optimistic update - Cache'i hemen güncelle
      updateItemInCache(itemId, { is_read: isRead });

      return { previousData };
    },
    onError: (error, { itemId, isRead }, context) => {
      // Hata durumunda önceki verileri geri yükle
      if (context?.previousData) {
        queryClient.setQueryData(
          ["feedItems", userId, feeds?.length],
          context.previousData
        );
      }
      console.error("Okuma durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
    onSettled: () => {
      // İşlem tamamlandığında verileri bir kere daha yenile (opsiyonel)
      // queryClient.invalidateQueries(["feedItems"]);
    },
  });

  // Favori durumunu değiştir - Optimistic updates ile geliştirildi
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ itemId, isFavorite }) =>
      feedService.toggleItemFavoriteStatus(userId, itemId, isFavorite),
    onMutate: async ({ itemId, isFavorite }) => {
      // Önceki verileri yedekle
      const previousItems = queryClient.getQueryData([
        "feedItems",
        userId,
        feeds?.length,
      ]);
      const previousFavorites = queryClient.getQueryData(["favorites", userId]);

      // Optimistic update - Cache'i hemen güncelle
      updateItemInCache(itemId, { is_favorite: isFavorite });

      return { previousItems, previousFavorites };
    },
    onError: (error, { itemId, isFavorite }, context) => {
      // Hata durumunda önceki verileri geri yükle
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["feedItems", userId, feeds?.length],
          context.previousItems
        );
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          ["favorites", userId],
          context.previousFavorites
        );
      }
      console.error("Favori durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
    onSettled: () => {
      // İşlem tamamlandığında (isteğe bağlı olarak) gerçek verileri alabilirsiniz
      // queryClient.invalidateQueries(["feedItems"]);
      // queryClient.invalidateQueries(["favorites"]);
    },
  });

  // Daha sonra oku durumunu değiştir - Optimistic updates ile geliştirildi
  const toggleReadLaterMutation = useMutation({
    mutationFn: ({ itemId, isReadLater }) =>
      feedService.toggleItemReadLaterStatus(userId, itemId, isReadLater),
    onMutate: async ({ itemId, isReadLater }) => {
      // Önceki verileri yedekle
      const previousItems = queryClient.getQueryData([
        "feedItems",
        userId,
        feeds?.length,
      ]);
      const previousReadLater = queryClient.getQueryData(["readLater", userId]);

      // Optimistic update - Cache'i hemen güncelle
      updateItemInCache(itemId, { is_read_later: isReadLater });

      return { previousItems, previousReadLater };
    },
    onError: (error, { itemId, isReadLater }, context) => {
      // Hata durumunda önceki verileri geri yükle
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["feedItems", userId, feeds?.length],
          context.previousItems
        );
      }
      if (context?.previousReadLater) {
        queryClient.setQueryData(
          ["readLater", userId],
          context.previousReadLater
        );
      }
      console.error("Daha sonra oku durumu güncelleme hatası:", error);
      toast.error(t("errors.updateFailed"));
    },
    onSettled: () => {
      // İşlem tamamlandığında (isteğe bağlı olarak) gerçek verileri alabilirsiniz
      // queryClient.invalidateQueries(["feedItems"]);
      // queryClient.invalidateQueries(["readLater"]);
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
      // Temizlik sonrası verileri bir kere yenile
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

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    return {
      totalItems: items?.length || 0,
      unreadItems: items?.filter((item) => !item.is_read)?.length || 0,
      favoriteItems: Array.isArray(favorites) ? favorites.length : 0,
      readLaterItems: Array.isArray(readLaterItems) ? readLaterItems.length : 0,
    };
  }, [items, favorites, readLaterItems]);

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
    silentRefresh,
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

    // İstatistikler
    stats,
  };
}
