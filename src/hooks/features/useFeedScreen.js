"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useFeedService } from "./useFeedService";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/store/useAuthStore";
import { useFilters } from "./feed-screen/useFilters";
import { usePagination } from "./feed-screen/usePagination";
import { useFeedActions } from "./feed-screen/useFeedActions";

/**
 * Feed ekranı için özelleştirilmiş hook
 * @returns {Object} Feed ekranı verileri ve fonksiyonları
 */
export function useFeedScreen() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const userId = user?.id;

  // Feed servisini kullan
  const {
    feeds,
    items,
    favorites,
    readLaterItems,
    isLoading,
    isError,
    error,
    refreshAll,
    refreshFeed: serviceRefreshFeed,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    cleanupOldItems: serviceCleanupOldItems,
    isCleaningUp,
    stats: serviceStats,
    feedService,
  } = useFeedService() || {};

  // State yönetimi
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [activeFilter, setActiveFilterState] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Alt hook'ları kullan
  const { filters, applyFilters, resetFilters } = useFilters();

  const {
    paginatedItems,
    pagination,
    isLoadingMore,
    isInitialLoading,
    isTransitioning,
    loadMoreItems,
    resetPagination,
  } = usePagination({
    feedService,
    userId: user?.id,
    selectedFeedId,
    activeFilter,
    filters,
  });

  const { syncFeeds, addFeed, removeFeed, markAllRead, shareItem } =
    useFeedActions(user, refreshAll, refreshAll, feedService);

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    if (serviceStats) return serviceStats;

    return {
      totalItems: Array.isArray(items) ? items.length : 0,
      unreadItems: Array.isArray(items)
        ? items.filter((item) => !item.is_read).length
        : 0,
      favoriteItems: Array.isArray(favorites) ? favorites.length : 0,
      readLaterItems: Array.isArray(readLaterItems) ? readLaterItems.length : 0,
    };
  }, [serviceStats, items, favorites, readLaterItems]);

  // URL'den feed ID'sini al
  useEffect(() => {
    const feedId = searchParams.get("feedId");
    if (feedId) {
      setSelectedFeedId(feedId);
    } else {
      // Filtre yoksa hiçbir feed seçilmemeli
      setSelectedFeedId(null);
    }
  }, [searchParams]);

  // Seçili feed'i bul
  const selectedFeed = useMemo(() => {
    if (!feeds || !selectedFeedId) return null;
    return feeds.find((feed) => feed.id === selectedFeedId);
  }, [feeds, selectedFeedId]);

  // setActiveFilter fonksiyonunu tanımla (resetPagination tanımlandıktan sonra)
  const setActiveFilter = useCallback(
    (feedId) => {
      // feedId null ise tüm beslemeleri göster
      setSelectedFeedId(feedId);

      // Eğer feedId null ise, activeFilter'i "all" olarak ayarla
      if (!feedId) {
        setActiveFilterState("all");
      } else {
        // Feed tipine göre filtreleme için feed'i bul
        const selectedFeed = feeds?.find((feed) => feed.id === feedId);
        if (selectedFeed) {
          setActiveFilterState(selectedFeed.type);
        }
      }

      // Sayfalama durumunu sıfırla
      resetPagination?.();
    },
    [feeds, resetPagination, setSelectedFeedId, setActiveFilterState]
  );

  // Belirli bir feed'i yenileme fonksiyonu
  const refreshFeed = useCallback(
    async (feedId, skipCache = false) => {
      if (!userId || !feedId) {
        console.warn("refreshFeed: userId veya feedId bulunamadı");
        return;
      }

      try {
        console.log(`Feed yenileniyor: ${feedId}, skipCache: ${skipCache}`);

        // Eğer servisin refreshFeed fonksiyonu varsa onu kullan
        if (serviceRefreshFeed) {
          return await serviceRefreshFeed(feedId, userId, skipCache);
        }

        // Yoksa feedService.syncFeedItems'ı direkt çağır
        if (feedService) {
          // Feed tipini bulalım
          const feed = feeds?.find((f) => f.id === feedId);
          if (!feed) {
            console.warn(`Feed bulunamadı: ${feedId}`);
            return;
          }

          console.log(`Feed senkronize ediliyor: ${feed.title} (${feed.type})`);
          return await feedService.syncFeedItems(feedId, userId, feed.type, {
            skipCache,
          });
        }

        // Hiçbir yöntem yoksa, komple yenile
        console.log("Özel feed yenileme bulunmadı, tüm feedler yenileniyor");
        return await refreshAll();
      } catch (error) {
        console.error(`Feed yenileme hatası (ID: ${feedId}):`, error);
        throw error;
      }
    },
    [userId, feeds, serviceRefreshFeed, feedService, refreshAll]
  );

  return {
    // Durum
    feeds,
    items: paginatedItems,
    selectedFeed,
    viewMode,
    filters,
    stats,
    isLoading,
    isLoadingMore,
    isInitialLoading,
    isTransitioning,
    isError,
    error,
    pagination,

    // Filtre işlemleri
    applyFilters,
    resetFilters,

    // Feed işlemleri
    syncFeeds,
    addFeed,
    removeFeed,
    markAllRead,
    shareItem,

    // Temel işlemler
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    loadMoreItems,
    cleanupOldItems: serviceCleanupOldItems,
    isCleaningUp,
    refreshAll,
    refreshFeed,

    // Görünüm işlemleri
    setViewMode,
    setActiveFilter,
    setSearchQuery,
  };
}
