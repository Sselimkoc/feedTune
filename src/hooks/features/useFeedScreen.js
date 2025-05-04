"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useFeedService } from "./useFeedService";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/store/useAuthStore";
import { useFilters } from "./feed-screen/useFilters";
import { usePagination } from "./feed-screen/usePagination";
import { useFeedActions } from "./feed-screen/useFeedActions";

// Önbellek anahtarı ve sabit TTL süreleri
const CACHE_KEYS = {
  FEED_SCREEN_STATE: "feed-screen-state",
  FEED_SCREEN_ITEMS: "feed-screen-items",
};

const CACHE_TTL = {
  SHORT: 1000 * 60 * 1, // 1 dakika
  MEDIUM: 1000 * 60 * 5, // 5 dakika
};

// Yerel önbelleğe erişim yardımcı fonksiyonları
const getLocalCache = (key, defaultValue = null) => {
  try {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return defaultValue;

    const { expiry, data } = JSON.parse(cachedData);
    if (expiry < Date.now()) {
      localStorage.removeItem(key);
      return defaultValue;
    }

    return data;
  } catch (error) {
    console.warn(`Cache error for ${key}:`, error);
    return defaultValue;
  }
};

const setLocalCache = (key, data, ttl = CACHE_TTL.MEDIUM) => {
  try {
    const cacheData = {
      expiry: Date.now() + ttl,
      data,
    };

    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn(`Failed to set cache for ${key}:`, error);
  }
};

/**
 * Feed ekranı için özelleştirilmiş hook
 * @returns {Object} Feed ekranı verileri ve fonksiyonları
 */
export function useFeedScreen() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const userId = user?.id;
  const isInitialRenderRef = useRef(true);
  const feedServiceRef = useRef(null);

  // Yükleme durumları için referans değerleri
  const prevSelectedFeedIdRef = useRef(null);
  const prevActiveFilterRef = useRef(null);
  const initialLoadCompletedRef = useRef(false);

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

  // feedService referansını güncelle
  useEffect(() => {
    if (feedService && feedService !== feedServiceRef.current) {
      feedServiceRef.current = feedService;
    }
  }, [feedService]);

  // State yönetimi - Önbellekten başlangıç durumunu yükle
  const [selectedFeedId, setSelectedFeedId] = useState(() => {
    // URL'den feed ID'sini kontrol et
    const feedIdFromUrl = searchParams?.get("feedId");
    if (feedIdFromUrl) return feedIdFromUrl;

    // Önbellekten yükle
    const cachedState = getLocalCache(CACHE_KEYS.FEED_SCREEN_STATE);
    return cachedState?.selectedFeedId || null;
  });

  const [viewMode, setViewMode] = useState(() => {
    const cachedState = getLocalCache(CACHE_KEYS.FEED_SCREEN_STATE);
    return cachedState?.viewMode || "grid";
  });

  const [activeFilter, setActiveFilterState] = useState(() => {
    const cachedState = getLocalCache(CACHE_KEYS.FEED_SCREEN_STATE);
    return cachedState?.activeFilter || "all";
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    const cachedState = getLocalCache(CACHE_KEYS.FEED_SCREEN_STATE);
    return cachedState?.searchQuery || "";
  });

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
    feedService: feedServiceRef.current,
    userId: user?.id,
    selectedFeedId,
    activeFilter,
    filters,
  });

  const { syncFeeds, addFeed, removeFeed, markAllRead, shareItem } =
    useFeedActions(user, refreshAll, refreshAll, feedService);

  // State'i önbelleğe kaydet
  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    // Temel durumu önbelleğe kaydet
    setLocalCache(
      CACHE_KEYS.FEED_SCREEN_STATE,
      {
        selectedFeedId,
        viewMode,
        activeFilter,
        searchQuery,
      },
      CACHE_TTL.MEDIUM
    );
  }, [selectedFeedId, viewMode, activeFilter, searchQuery]);

  // Feed öğelerini önbelleğe kaydet
  useEffect(() => {
    if (paginatedItems?.length > 0 && !isLoadingMore && !isTransitioning) {
      setLocalCache(
        `${CACHE_KEYS.FEED_SCREEN_ITEMS}_${activeFilter}_${
          selectedFeedId || "all"
        }`,
        paginatedItems,
        CACHE_TTL.SHORT
      );
    }
  }, [
    paginatedItems,
    isLoadingMore,
    isTransitioning,
    activeFilter,
    selectedFeedId,
  ]);

  // İstatistikleri hesapla - Memoize ile performans iyileştirmesi
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

  // URL'den feed ID'sini al - Performans için iyileştirildi
  useEffect(() => {
    const feedId = searchParams?.get("feedId");

    if (feedId !== selectedFeedId) {
      console.log(`URL feed ID değişti: ${feedId}`);
      prevSelectedFeedIdRef.current = selectedFeedId;
      setSelectedFeedId(feedId || null);

      // URL'den feed ID değiştiğinde filtre tipini resetle
      if (feedId) {
        // Eğer bir feed seçiliyse, feed tipini bul
        const selectedFeed = feeds?.find((feed) => feed.id === feedId);
        if (selectedFeed) {
          setActiveFilterState(selectedFeed.type);
        }
      } else {
        // Feed seçili değilse "all" filtresi kullan
        setActiveFilterState("all");
      }
    }
  }, [searchParams, feeds]);

  // Seçili feed'i bul
  const selectedFeed = useMemo(() => {
    if (!feeds || !selectedFeedId) return null;
    return feeds.find((feed) => feed.id === selectedFeedId);
  }, [feeds, selectedFeedId]);

  // setActiveFilter fonksiyonunu tanımla - performans iyileştirmeli
  const setActiveFilter = useCallback(
    (feedId) => {
      // Aynı feedId seçiliyse hiçbir şey yapma
      if (feedId === selectedFeedId) {
        console.log("Aynı feed seçildi, işlem atlanıyor");
        return;
      }

      console.log(`Feed filtresi değişti: ${feedId}`);
      prevSelectedFeedIdRef.current = selectedFeedId;
      prevActiveFilterRef.current = activeFilter;

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

      // Önbellekten önceden yüklenmiş feed öğeleri varsa, kullan
      const cachedItems = getLocalCache(
        `${CACHE_KEYS.FEED_SCREEN_ITEMS}_${selectedFeed?.type || "all"}_${
          feedId || "all"
        }`
      );

      // Sayfalama durumunu sıfırla
      resetPagination?.();
    },
    [feeds, resetPagination, selectedFeedId, activeFilter]
  );

  // Belirli bir feed'i yenileme fonksiyonu - Performans iyileştirmeleri
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
        if (feedServiceRef.current) {
          // Feed tipini bulalım
          const feed = feeds?.find((f) => f.id === feedId);
          if (!feed) {
            console.warn(`Feed bulunamadı: ${feedId}`);
            return;
          }

          console.log(`Feed senkronize ediliyor: ${feed.title} (${feed.type})`);

          // Bu feed için önbelleği temizle
          localStorage.removeItem(
            `${CACHE_KEYS.FEED_SCREEN_ITEMS}_${feed.type}_${feedId}`
          );

          return await feedServiceRef.current.syncFeedItems(
            feedId,
            userId,
            feed.type,
            {
              skipCache,
            }
          );
        }

        // Hiçbir yöntem yoksa, komple yenile
        console.log("Özel feed yenileme bulunmadı, tüm feedler yenileniyor");

        // Önbelleği temizle
        Object.values(CACHE_KEYS).forEach((key) => {
          if (key.startsWith("feed-screen-items")) {
            localStorage.removeItem(key);
          }
        });

        return await refreshAll();
      } catch (error) {
        console.error(`Feed yenileme hatası (ID: ${feedId}):`, error);
        throw error;
      }
    },
    [userId, feeds, serviceRefreshFeed, refreshAll]
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
