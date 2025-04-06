"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useFeedService } from "./useFeedService";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

/**
 * Feed ekranı için özelleştirilmiş hook
 * @returns {Object} Feed ekranı verileri ve fonksiyonları
 */
export function useFeedScreen() {
  // URL parametreleri
  const searchParams = useSearchParams();

  // Çeviri hook'u
  const { t } = useLanguage();

  // Feed servisi
  const {
    feeds,
    items,
    isLoading,
    isError,
    error,
    refreshAll,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    cleanupOldItems: serviceCleanupOldItems,
    isCleaningUp,
  } = useFeedService();

  // Durum yönetimi
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    sortBy: "newest",
    showRead: true,
    showUnread: true,
    feedTypes: {
      rss: true,
      youtube: true,
    },
  });

  // URL'den feed ID'sini al
  useEffect(() => {
    const feedId = searchParams.get("feedId");
    if (feedId) {
      setSelectedFeedId(feedId);
    } else if (feeds && feeds.length > 0 && !selectedFeedId) {
      setSelectedFeedId(feeds[0].id);
    }
  }, [searchParams, feeds, selectedFeedId]);

  // Seçili feed'i bul
  const selectedFeed = useMemo(() => {
    if (!feeds || !selectedFeedId) return null;
    return feeds.find((feed) => feed.id === selectedFeedId) || feeds[0];
  }, [feeds, selectedFeedId]);

  // Filtrelenmiş öğeleri hesapla
  const filteredItems = useMemo(() => {
    if (!items) return [];

    let filtered = [...items];

    // Feed ID'ye göre filtrele
    if (selectedFeedId) {
      filtered = filtered.filter((item) => item.feed_id === selectedFeedId);
    }

    // Okuma durumuna göre filtrele
    if (!filters.showRead) {
      filtered = filtered.filter((item) => !item.is_read);
    }

    if (!filters.showUnread) {
      filtered = filtered.filter((item) => item.is_read);
    }

    // Feed türüne göre filtrele
    if (!filters.feedTypes.rss || !filters.feedTypes.youtube) {
      const feedTypeMap = new Map(feeds?.map((feed) => [feed.id, feed.type]));

      filtered = filtered.filter((item) => {
        const feedType = feedTypeMap.get(item.feed_id);
        if (feedType === "rss" && !filters.feedTypes.rss) return false;
        if (feedType === "youtube" && !filters.feedTypes.youtube) return false;
        return true;
      });
    }

    // Sıralama
    switch (filters.sortBy) {
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.published_at) - new Date(a.published_at)
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.published_at) - new Date(b.published_at)
        );
        break;
      case "unread":
        filtered.sort((a, b) => {
          if (a.is_read === b.is_read) {
            return new Date(b.published_at) - new Date(a.published_at);
          }
          return a.is_read ? 1 : -1; // Okunmamışlar önce
        });
        break;
      case "favorites":
        filtered.sort((a, b) => {
          if (a.is_favorite === b.is_favorite) {
            return new Date(b.published_at) - new Date(a.published_at);
          }
          return a.is_favorite ? -1 : 1; // Favoriler önce
        });
        break;
    }

    return filtered;
  }, [items, feeds, selectedFeedId, filters]);

  // Feed seçme
  const handleFeedSelect = useCallback((feedId) => {
    setSelectedFeedId(feedId);

    // URL'yi güncelle
    const url = new URL(window.location);
    url.searchParams.set("feedId", feedId);
    window.history.pushState({}, "", url);
  }, []);

  // Filtreleri uygula
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Görünüm modunu değiştir
  const changeViewMode = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Refresh fonksiyonu geliştirmesi
  const refresh = useCallback(() => {
    toast.info(
      t("feeds.refreshing") === "feeds.refreshing"
        ? "İçerikler yenileniyor..."
        : t("feeds.refreshing"),
      {
        duration: 2000,
        id: "feed-refresh-toast", // Aynı toast'un üst üste gelmesini engeller
      }
    );

    return refreshAll()
      .then(() => {
        toast.success(
          t("feeds.refreshSuccess") === "feeds.refreshSuccess"
            ? "İçerikler başarıyla yenilendi"
            : t("feeds.refreshSuccess"),
          {
            duration: 2000,
            id: "feed-refresh-toast",
          }
        );
      })
      .catch((error) => {
        toast.error(
          t("feeds.refreshError") === "feeds.refreshError"
            ? "İçerikler yenilenirken bir hata oluştu"
            : t("feeds.refreshError"),
          {
            duration: 3000,
          }
        );
        console.error("Feed yenileme hatası:", error);
      });
  }, [refreshAll, t]);

  // Eski içerikleri temizleme (service fonksiyonuna proxy)
  const cleanupOldItems = useCallback(
    (options = {}) => {
      return serviceCleanupOldItems(options);
    },
    [serviceCleanupOldItems]
  );

  return {
    // Veriler
    feeds,
    items: filteredItems,
    selectedFeed,
    selectedFeedId,
    viewMode,
    filters,
    isLoading,
    isError,
    error,

    // Feed seçimi ve filtreleme
    handleFeedSelect,
    applyFilters,
    changeViewMode,

    // Eylemler
    refresh,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    cleanupOldItems,
    isCleaningUp,
  };
}
