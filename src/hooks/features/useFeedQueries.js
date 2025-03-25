"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/services/feedService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Cache ayarları
const SHORT_STALE_TIME = 1000 * 60 * 2; // 2 dakika
const LONG_CACHE_TIME = 1000 * 60 * 60; // 60 dakika

/**
 * React Query ile feed verilerini yöneten hook.
 * Servis katmanı ile iletişim kurar.
 */
export function useFeedQueries() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const userId = user?.id;

  // Feeds sorgusu
  const feedsQuery = useQuery({
    queryKey: ["feeds", userId],
    queryFn: () => feedService.getFeeds(userId),
    enabled: !!userId,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Feed öğeleri sorgusu
  const feedItemsQuery = useQuery({
    queryKey: ["feedItems", feedsQuery.data?.map((feed) => feed.id)],
    queryFn: () =>
      feedService.getFeedItems(feedsQuery.data?.map((feed) => feed.id)),
    enabled: !!feedsQuery.data?.length,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    select: (data) => {
      if (!data || !feedsQuery.data) return [];
      const { items: limitedItems } = feedService.limitItemsPerFeed(
        feedsQuery.data,
        data,
        10
      );
      return limitedItems;
    },
  });

  // Favoriler sorgusu
  const favoritesQuery = useQuery({
    queryKey: ["favorites", userId],
    queryFn: () => feedService.getFavorites(userId),
    enabled: !!userId,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME,
  });

  // Read Later sorgusu
  const readLaterQuery = useQuery({
    queryKey: ["readLater", userId],
    queryFn: () => feedService.getReadLaterItems(userId),
    enabled: !!userId,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME,
  });

  // Cache'i manuel olarak güncelleyen yardımcı fonksiyon
  const updateQueryCache = (itemId, updates) => {
    // Tüm ilgili sorguları al
    const feedItemsData = queryClient.getQueryData(["feedItems"]);
    const favoritesData = queryClient.getQueryData(["favorites"]);
    const readLaterData = queryClient.getQueryData(["readLater"]);

    // Güncellenen öğeyi bul
    const updatedItem = feedItemsData?.find((item) => item.id === itemId);

    // feedItems cache'ini güncelle
    if (feedItemsData) {
      queryClient.setQueryData(["feedItems"], (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
      });
    }

    // favorites cache'ini güncelle (eğer is_favorite değişti ise)
    if ("is_favorite" in updates && favoritesData) {
      queryClient.setQueryData(["favorites"], (old) => {
        if (!old) return old;

        if (updates.is_favorite) {
          // Favorilere eklenmiş ve zaten listede değilse ekle
          const itemExists = old.some((item) => item.id === itemId);
          if (!itemExists && updatedItem) {
            return [...old, { ...updatedItem, ...updates }];
          } else {
            // Zaten varsa sadece durum bilgisini güncelle
            return old.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            );
          }
        } else {
          // Favorilerden kaldırılmışsa listeden çıkar
          return old.filter((item) => item.id !== itemId);
        }
      });
    }

    // readLater cache'ini güncelle (eğer is_read_later değişti ise)
    if ("is_read_later" in updates && readLaterData) {
      queryClient.setQueryData(["readLater"], (old) => {
        if (!old) return old;

        if (updates.is_read_later) {
          // Okuma listesine eklenmiş ve zaten listede değilse ekle
          const itemExists = old.some((item) => item.id === itemId);
          if (!itemExists && updatedItem) {
            return [...old, { ...updatedItem, ...updates }];
          } else {
            // Zaten varsa sadece durum bilgisini güncelle
            return old.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            );
          }
        } else {
          // Okuma listesinden kaldırılmışsa listeden çıkar
          return old.filter((item) => item.id !== itemId);
        }
      });
    }

    // Güncelleme sonrası cache durumunu kontrol et ve logla
    console.log("Cache güncellemesi tamamlandı:", {
      itemId,
      updates,
      feedItemsCacheSize: queryClient.getQueryData(["feedItems"])?.length || 0,
      favoritesCacheSize: queryClient.getQueryData(["favorites"])?.length || 0,
      readLaterCacheSize: queryClient.getQueryData(["readLater"])?.length || 0,
    });
  };

  // Toggle Read Mutation
  const toggleReadMutation = useMutation({
    mutationFn: async ({ itemId, isRead, skipInvalidation = false }) => {
      if (!userId) {
        toast.error(t("errors.needToBeLoggedIn"));
        throw new Error("User not logged in");
      }
      return feedService.toggleItemReadStatus(userId, itemId, isRead);
    },
    onMutate: async ({ itemId, isRead, skipInvalidation = false }) => {
      // Önceki sorguları tut
      await queryClient.cancelQueries({ queryKey: ["feedItems"] });

      // Mevcut veriyi kaydet
      const previousItems = queryClient.getQueryData(["feedItems"]);

      // İyimser güncelleme yap
      updateQueryCache(itemId, { is_read: isRead });

      // Context içinde önceki veriyi döndür (hata olursa rollback için)
      return { previousItems, skipInvalidation };
    },
    onSuccess: (data, { skipInvalidation }) => {
      // Eğer skipInvalidation doğruysa, verileri yeniden sorgulama
      if (!skipInvalidation) {
        queryClient.invalidateQueries({ queryKey: ["feedItems"] });
      }
      // Toast ile bildirim göster
      toast.success(
        data.is_read
          ? t("feeds.itemMarkedAsRead")
          : t("feeds.itemMarkedAsUnread"),
        { duration: 2000 }
      );
    },
    onError: (error, { itemId, isRead }, context) => {
      // Hata varsa önceki duruma geri dön
      if (context?.previousItems) {
        queryClient.setQueryData(["feedItems"], context.previousItems);
      }
      console.error("Toggle read error:", error);
      toast.error(t("errors.errorUpdatingItemStatus"));
    },
  });

  // Toggle Favorite Mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ itemId, isFavorite, skipInvalidation = false }) => {
      if (!userId) {
        toast.error(t("errors.needToBeLoggedIn"));
        throw new Error("User not logged in");
      }
      return feedService.toggleItemFavoriteStatus(userId, itemId, isFavorite);
    },
    onMutate: async ({ itemId, isFavorite, skipInvalidation = false }) => {
      // Önceki sorguları tut
      await queryClient.cancelQueries({ queryKey: ["feedItems"] });
      await queryClient.cancelQueries({ queryKey: ["favorites"] });

      // Mevcut veriyi kaydet
      const previousItems = queryClient.getQueryData(["feedItems"]);
      const previousFavorites = queryClient.getQueryData(["favorites"]);

      // İyimser güncelleme yap
      updateQueryCache(itemId, { is_favorite: isFavorite });

      // Context içinde önceki veriyi döndür (hata olursa rollback için)
      return { previousItems, previousFavorites, skipInvalidation };
    },
    onSuccess: (data, { skipInvalidation }) => {
      // Eğer skipInvalidation doğruysa, verileri yeniden sorgulama
      if (!skipInvalidation) {
        queryClient.invalidateQueries({ queryKey: ["feedItems"] });
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
      }
      // Toast ile bildirim göster
      toast.success(
        data.is_favorite
          ? t("feeds.itemAddedToFavorites")
          : t("feeds.itemRemovedFromFavorites"),
        { duration: 2000 }
      );
    },
    onError: (error, { itemId, isFavorite }, context) => {
      // Hata varsa önceki duruma geri dön
      if (context?.previousItems) {
        queryClient.setQueryData(["feedItems"], context.previousItems);
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites"], context.previousFavorites);
      }
      console.error("Toggle favorite error:", error);
      toast.error(t("errors.errorUpdatingFavoriteStatus"));
    },
  });

  // Toggle Read Later Mutation
  const toggleReadLaterMutation = useMutation({
    mutationFn: async ({ itemId, isReadLater, skipInvalidation = false }) => {
      if (!userId) {
        toast.error(t("errors.needToBeLoggedIn"));
        throw new Error("User not logged in");
      }
      return feedService.toggleItemReadLaterStatus(userId, itemId, isReadLater);
    },
    onMutate: async ({ itemId, isReadLater, skipInvalidation = false }) => {
      // Önceki sorguları tut
      await queryClient.cancelQueries({ queryKey: ["feedItems"] });
      await queryClient.cancelQueries({ queryKey: ["readLater"] });

      // Mevcut veriyi kaydet
      const previousItems = queryClient.getQueryData(["feedItems"]);
      const previousReadLater = queryClient.getQueryData(["readLater"]);

      // İyimser güncelleme yap
      updateQueryCache(itemId, { is_read_later: isReadLater });

      // Context içinde önceki veriyi döndür (hata olursa rollback için)
      return { previousItems, previousReadLater, skipInvalidation };
    },
    onSuccess: (data, { skipInvalidation }) => {
      // Eğer skipInvalidation doğruysa, verileri yeniden sorgulama
      if (!skipInvalidation) {
        queryClient.invalidateQueries({ queryKey: ["feedItems"] });
        queryClient.invalidateQueries({ queryKey: ["readLater"] });
      }
      // Toast ile bildirim göster
      toast.success(
        data.is_read_later
          ? t("feeds.itemAddedToReadLater")
          : t("feeds.itemRemovedFromReadLater"),
        { duration: 2000 }
      );
    },
    onError: (error, { itemId, isReadLater }, context) => {
      // Hata varsa önceki duruma geri dön
      if (context?.previousItems) {
        queryClient.setQueryData(["feedItems"], context.previousItems);
      }
      if (context?.previousReadLater) {
        queryClient.setQueryData(["readLater"], context.previousReadLater);
      }
      console.error("Toggle read later error:", error);
      toast.error(t("errors.errorUpdatingReadLaterStatus"));
    },
  });

  // Tüm verileri yenileme fonksiyonu
  const refreshAllData = async () => {
    console.log("Tüm veriler yenileniyor...");
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feeds"] }),
        queryClient.invalidateQueries({ queryKey: ["feedItems"] }),
        queryClient.invalidateQueries({ queryKey: ["favorites"] }),
        queryClient.invalidateQueries({ queryKey: ["readLater"] }),
      ]);
      toast.success(t("feeds.refreshed"));
      return "Veriler yenilendi";
    } catch (error) {
      console.error("Yenileme hatası:", error);
      toast.error(t("errors.refreshFailed"));
      throw error;
    }
  };

  return {
    // Sorgular
    feeds: feedsQuery.data || [],
    items: feedItemsQuery.data || [],
    favorites: favoritesQuery.data || [],
    readLater: readLaterQuery.data || [],

    // Yükleme durumları
    isLoadingFeeds: feedsQuery.isLoading,
    isLoadingItems: feedItemsQuery.isLoading,
    isLoadingFavorites: favoritesQuery.isLoading,
    isLoadingReadLater: readLaterQuery.isLoading,

    // Genel yükleme durumu
    isLoading: feedsQuery.isLoading || feedItemsQuery.isLoading,

    // Hata durumları
    isError: feedsQuery.isError || feedItemsQuery.isError,
    error: feedsQuery.error || feedItemsQuery.error,

    // Mutasyonlar
    toggleRead: (itemId, isRead, skipInvalidation = false) =>
      toggleReadMutation.mutate({ itemId, isRead, skipInvalidation }),
    toggleFavorite: (itemId, isFavorite, skipInvalidation = false) =>
      toggleFavoriteMutation.mutate({ itemId, isFavorite, skipInvalidation }),
    toggleReadLater: (itemId, isReadLater, skipInvalidation = false) =>
      toggleReadLaterMutation.mutate({ itemId, isReadLater, skipInvalidation }),

    // Mutasyon durumları
    isTogglingRead: toggleReadMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isTogglingReadLater: toggleReadLaterMutation.isPending,

    // Yenileme fonksiyonu
    refreshData: refreshAllData,
  };
}
