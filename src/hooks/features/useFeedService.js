"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/services/feedService";
import { youtubeService } from "@/services/youtubeService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";
import { FeedRepository } from "@/repositories/feedRepository";

/**
 * Feed servisi ile etkileşim için merkezi hook.
 * Tüm feed işlemleri için tek bir giriş noktası sağlar.
 */
export function useFeedService() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const userId = user?.id;

  console.log("useFeedService Hook başlatıldı");
  console.log(
    "Kullanıcı bilgisi:",
    user ? `ID: ${user.id}` : "Kullanıcı bulunamadı"
  );

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
    queryFn: () => {
      console.log("feedService.getFeeds çağrılıyor, userId:", userId);
      return feedService.getFeeds(userId);
    },
    onSuccess: (data) => {
      console.log("Feed sorgusu başarılı, feed sayısı:", data?.length || 0);
      console.log("Feed verileri:", data);
      setLastRefreshTime(new Date());
    },
    onError: (error) => {
      console.error("Feed sorgusu hatası:", error);
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
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

      console.log("Feed öğeleri getiriliyor...");
      console.log("Feed sayısı:", feeds.length);

      const feedIds = feeds.map((feed) => feed.id);
      console.log("Feed ID'leri:", feedIds);

      // Timestamp oluştur - şu anki zamanı ISO string olarak kullan
      const timestamp = new Date().toISOString();
      console.log("Feed öğeleri için timestamp:", timestamp);

      // Parametreleri düzgün sırayla geçir: feedIds, limit, userId (timestamp'i kaldırdım)
      return feedService.getFeedItems(feedIds, 100, userId);
    },
    enabled: !!userId && !!feeds && feeds.length > 0,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    onSuccess: (data) => {
      console.log("Feed öğeleri başarıyla alındı:", data);
      setLastRefreshTime(new Date());
    },
    onError: (error) => {
      console.error("Feed öğeleri alınırken hata:", error);
    },
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

  // Belirli bir feed'i yenile
  const refreshFeed = useCallback(
    async (feedId, userId, skipCache = false) => {
      if (!feedId || !userId) {
        console.error("refreshFeed: feedId ve userId gerekli");
        return;
      }

      try {
        console.log(`Tek feed yenileniyor: ${feedId}, skipCache: ${skipCache}`);

        // FeedService üzerinden feed bilgilerini al
        const feed = feeds?.find((f) => f.id === feedId);
        if (!feed) {
          console.warn(`Feed bulunamadı: ${feedId}`);
          throw new Error("Feed bulunamadı");
        }

        // Feed öğelerini senkronize et (skipCache parametresini geçirerek)
        const result = await feedService.syncFeedItems(
          feedId,
          userId,
          feed.type,
          { skipCache }
        );

        console.log("Feed yenileme sonucu:", result);

        // Önbelleği güncelle
        queryClient.invalidateQueries({
          queryKey: ["feedItems", userId, feedId],
        });

        // Feed öğelerini yeniden getir
        await refetchItems();

        return result;
      } catch (error) {
        console.error(`Feed yenileme hatası (ID: ${feedId}):`, error);
        toast.error(t("feeds.refreshError"));
        throw error;
      }
    },
    [feeds, userId, queryClient, refetchItems, t]
  );

  // YouTube önbelleğini temizleme
  const cleanYoutubeCache = useCallback(async () => {
    try {
      await youtubeService.cleanCache();
      toast.success(t("youtube.cacheCleanSuccess"));
      return true;
    } catch (error) {
      console.error("YouTube önbellek temizleme hatası:", error);
      toast.error(t("youtube.cacheCleanError"));
      return false;
    }
  }, [t]);

  // Değişiklik: Cache güncelleme yardımcı fonksiyonu - daha verimli
  const updateItemInCache = useCallback(
    (itemId, updates) => {
      // Tüm feed öğeleri cache'inde güncelleme yap
      queryClient.setQueriesData({ queryKey: ["feedItems"] }, (oldData) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
      });

      // Favoriler cache'inde güncelleme yap
      if ("is_favorite" in updates) {
        if (updates.is_favorite) {
          // Favorilere ekle
          queryClient.setQueriesData({ queryKey: ["favorites"] }, (oldData) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;

            // items değişkeni dizi değilse veya boşsa, işlemi yapma
            if (!Array.isArray(items)) return oldData;

            const item = items.find((i) => i.id === itemId);
            if (!item) return oldData;

            const existingItem = oldData.find((i) => i.id === itemId);
            if (existingItem) return oldData;

            return [...oldData, { ...item, ...updates }];
          });
        } else {
          // Favorilerden çıkar
          queryClient.setQueriesData({ queryKey: ["favorites"] }, (oldData) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            return oldData.filter((item) => item.id !== itemId);
          });
        }
      }

      // Sonra oku cache'inde güncelleme yap
      if ("is_read_later" in updates) {
        if (updates.is_read_later) {
          // Sonra oku'ya ekle
          queryClient.setQueriesData({ queryKey: ["readLater"] }, (oldData) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;

            // items değişkeni dizi değilse veya boşsa, işlemi yapma
            if (!Array.isArray(items)) return oldData;

            const item = items.find((i) => i.id === itemId);
            if (!item) return oldData;

            const existingItem = oldData.find((i) => i.id === itemId);
            if (existingItem) return oldData;

            return [...oldData, { ...item, ...updates }];
          });
        } else {
          // Sonra oku'dan çıkar
          queryClient.setQueriesData({ queryKey: ["readLater"] }, (oldData) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            return oldData.filter((item) => item.id !== itemId);
          });
        }
      }
    },
    [queryClient, items]
  );

  // Okuma durumunu değiştir - Optimistic updates ile geliştirildi
  const toggleReadMutation = useMutation({
    mutationFn: ({ itemId, isRead, itemType = "rss" }) =>
      feedService.toggleItemReadStatus(userId, itemId, itemType, isRead),
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
    mutationFn: ({ itemId, isFavorite, itemType = "rss" }) =>
      feedService.toggleItemFavoriteStatus(
        userId,
        itemId,
        itemType,
        isFavorite
      ),
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
    mutationFn: ({ itemId, isReadLater, itemType = "rss" }) =>
      feedService.toggleItemReadLaterStatus(
        userId,
        itemId,
        itemType,
        isReadLater
      ),
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
    (itemId, isRead, itemType = "rss") => {
      if (!userId) return;
      toggleReadMutation.mutate({ itemId, isRead, itemType });
    },
    [userId, toggleReadMutation]
  );

  const toggleFavorite = useCallback(
    (itemId, isFavorite, itemType = "rss") => {
      if (!userId) return;
      toggleFavoriteMutation.mutate({ itemId, isFavorite, itemType });
    },
    [userId, toggleFavoriteMutation]
  );

  const toggleReadLater = useCallback(
    (itemId, isReadLater, itemType = "rss") => {
      if (!userId) return;
      toggleReadLaterMutation.mutate({ itemId, isReadLater, itemType });
    },
    [userId, toggleReadLaterMutation]
  );

  // Feed ekleme
  const addFeedMutation = useMutation({
    mutationFn: ({ url, type }) => {
      if (!userId) throw new Error("User ID is required");
      return feedService.addFeed(url, type, userId);
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
    // Güvenlik kontrolü ve hata loglama: items tipi
    if (items && !Array.isArray(items)) {
      console.warn(
        "useFeedService: items bir dizi değil:",
        typeof items,
        items
      );
    }

    return {
      totalItems: Array.isArray(items) ? items.length : 0,
      unreadItems: Array.isArray(items)
        ? items.filter((item) => !item.is_read)?.length || 0
        : 0,
      favoriteItems: Array.isArray(favorites) ? favorites.length : 0,
      readLaterItems: Array.isArray(readLaterItems) ? readLaterItems.length : 0,
    };
  }, [items, favorites, readLaterItems]);

  // YouTube besleme senkronizasyonu
  const syncYoutubeFeed = async (feedId) => {
    if (!user?.id) {
      toast.error("Önce giriş yapmalısınız");
      return;
    }

    if (!feedId) {
      toast.error("Geçerli bir feed ID belirtilmelidir");
      return;
    }

    // Yükleniyor bildirimini göster
    const toastId = toast.loading("YouTube beslemesi senkronize ediliyor...");
    console.log(`📡 YouTube beslemesi senkronize ediliyor: ${feedId}`);

    try {
      // Önce feed bilgisini al
      const { data: feed, error: feedError } = await supabase
        .from("feeds")
        .select("id, title, url, type")
        .eq("id", feedId)
        .eq("user_id", user.id)
        .single();

      // Feed bulunamadı mı?
      if (feedError || !feed) {
        console.error("Feed bilgisi alınamadı:", feedError);
        toast.error(feedError?.message || "Feed bilgisi alınamadı", {
          id: toastId,
        });
        return;
      }

      // YouTube beslemesi değilse hata ver
      if (feed.type !== "youtube") {
        toast.error("Bu besleme YouTube türünde değil", { id: toastId });
        return;
      }

      // Ara bildirim göster
      toast.loading(`"${feed.title}" kanalı senkronize ediliyor...`, {
        id: toastId,
      });

      const response = await fetch("/api/youtube/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Senkronizasyon API hatası:", errorData);
        toast.error(
          `Senkronizasyon hatası: ${errorData.error || "Bilinmeyen hata"}`,
          {
            id: toastId,
          }
        );
        return;
      }

      const data = await response.json();
      console.log("Senkronizasyon sonucu:", data);

      // Bildirimi güncelle
      if (data.added > 0) {
        toast.success(`${data.added} yeni video eklendi`, { id: toastId });
      } else if (data.error) {
        toast.error(`Hata: ${data.error}`, { id: toastId });
      } else {
        toast.success("Senkronizasyon tamamlandı, yeni video yok", {
          id: toastId,
        });
      }

      // Sorguları yenile
      await Promise.all([
        queryClient.invalidateQueries(["feeds"]),
        queryClient.invalidateQueries(["feedItems"]),
      ]);
    } catch (error) {
      console.error("Senkronizasyon hatası:", error);

      // Hata türüne göre özel mesajlar
      let errorMessage = "Senkronizasyon sırasında bir hata oluştu";

      if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage = "Bağlantı hatası: Sunucuya ulaşılamıyor";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Zaman aşımı: İşlem çok uzun sürdü";
      } else if (error.message?.includes("permission")) {
        errorMessage = "Yetki hatası: Bu işlemi gerçekleştirme izniniz yok";
      }

      toast.error(errorMessage, { id: toastId });
    }
  };

  return {
    // Veriler
    feeds,
    items,
    favorites,
    readLaterItems,

    // Yükleme durumları
    isLoading:
      isLoadingFeeds ||
      isLoadingItems ||
      isLoadingFavorites ||
      isLoadingReadLater,
    isLoadingFeeds,
    isLoadingItems,
    isLoadingFavorites,
    isLoadingReadLater,

    // Hata durumları
    isError: isErrorFeeds || isErrorItems,
    error: feedsError || itemsError,

    // Yenileme fonksiyonları
    refreshAll,
    refreshFeed,
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

    // Feed servisi - artık feedService'i kullanıyoruz
    feedService: feedService,

    // YouTube önbelleğini temizleme
    cleanYoutubeCache,

    // YouTube besleme senkronizasyonu
    syncYoutubeFeed,
  };
}
