"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useFeedService } from "./useFeedService";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { feedService } from "@/services/feedService";

/**
 * Feed ekranı için özelleştirilmiş hook
 * @returns {Object} Feed ekranı verileri ve fonksiyonları
 */
export function useFeedScreen() {
  // URL parametreleri
  const searchParams = useSearchParams();

  // Çeviri hook'u
  const { t } = useLanguage();

  // Auth store
  const { user } = useAuthStore();
  const userId = user?.id;

  // Feed servisi
  const {
    feeds,
    items,
    favorites,
    readLaterItems,
    isLoading,
    isError,
    error,
    refreshAll,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    cleanupOldItems: serviceCleanupOldItems,
    isCleaningUp,
    addFeed,
    deleteFeed,
    stats: serviceStats,
  } = useFeedService() || {};

  // Pagination state
  const [paginatedItems, setPaginatedItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12, // Default page size: 12 items
    total: 0,
    hasMore: true,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedItemId, setFocusedItemId] = useState(null);

  // Durum yönetimi
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [activeFilter, setActiveFilter] = useState("all");
  const [filters, setFilters] = useState({
    sortBy: "newest",
    showRead: true,
    showUnread: true,
    feedTypes: {
      rss: true,
      youtube: true,
    },
  });

  // İstatistikleri al veya hesapla
  const stats = useMemo(() => {
    // Servis tarafından sağlanan istatistikleri kullan
    if (serviceStats) {
      return serviceStats;
    }

    // Servis istatistikleri yoksa kendimiz hesaplayalım
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
    // Öncelikle sayfalanmış öğeleri kullanalım
    let filtered = [...paginatedItems];

    if (!Array.isArray(filtered) || filtered.length === 0) return [];

    // Arama sorgusu var mı?
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
    }

    // Her öğe için gerekli özellikleri standartlaştır
    filtered = filtered.map((item) => {
      // Tarih alanlarını standartlaştır
      const publishedDate =
        item.published_at || item.publishedAt || item.pubDate || item.isoDate;

      // Feed başlık ve tip bilgisini standartlaştır
      const feedTitle =
        item.feed_title ||
        item.feedTitle ||
        (item.feed ? item.feed.title : undefined) ||
        "";

      const feedType =
        item.feed_type ||
        item.type ||
        (item.feed ? item.feed.type : undefined) ||
        "rss";

      return {
        ...item,
        // Standart alanlar ekle
        published_at: publishedDate,
        feedTitle: feedTitle,
        feed_title: feedTitle,
        type: feedType,
        feed_type: feedType,
      };
    });

    // Sıralama
    switch (filters.sortBy) {
      case "newest":
        filtered.sort((a, b) => {
          const dateA = a.published_at ? new Date(a.published_at) : new Date(0);
          const dateB = b.published_at ? new Date(b.published_at) : new Date(0);
          return dateB - dateA;
        });
        break;
      case "oldest":
        filtered.sort((a, b) => {
          const dateA = a.published_at ? new Date(a.published_at) : new Date(0);
          const dateB = b.published_at ? new Date(b.published_at) : new Date(0);
          return dateA - dateB;
        });
        break;
      case "unread":
        filtered.sort((a, b) => {
          if ((a.is_read || a.isRead) === (b.is_read || b.isRead)) {
            const dateA = a.published_at
              ? new Date(a.published_at)
              : new Date(0);
            const dateB = b.published_at
              ? new Date(b.published_at)
              : new Date(0);
            return dateB - dateA;
          }
          return a.is_read || a.isRead ? 1 : -1; // Okunmamışlar önce
        });
        break;
      case "favorites":
        filtered.sort((a, b) => {
          if (
            (a.is_favorite || a.isFavorite) === (b.is_favorite || b.isFavorite)
          ) {
            const dateA = a.published_at
              ? new Date(a.published_at)
              : new Date(0);
            const dateB = b.published_at
              ? new Date(b.published_at)
              : new Date(0);
            return dateB - dateA;
          }
          return a.is_favorite || a.isFavorite ? -1 : 1; // Favoriler önce
        });
        break;
      default:
        // Varsayılan olarak en yeniler önce
        filtered.sort((a, b) => {
          const dateA = a.published_at ? new Date(a.published_at) : new Date(0);
          const dateB = b.published_at ? new Date(b.published_at) : new Date(0);
          return dateB - dateA;
        });
    }

    return filtered;
  }, [paginatedItems, filters, searchQuery]);

  // İlk verileri çekme işlemi
  const loadInitialItems = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoadingMore(true);

      // feedService tanımlı mı kontrol et
      if (!feedService) {
        console.error("FeedService tanımlı değil!");
        return { data: [], total: 0, hasMore: false };
      }

      // Pagination size kontrolü
      const pageSize = pagination.pageSize || 12; // Default 12

      // Filtre objesi oluştur
      const filterObj = {
        selectedFeedId,
        readStatus:
          activeFilter === "unread"
            ? "unread"
            : activeFilter === "read"
            ? "read"
            : undefined,
        feedType:
          activeFilter === "rss"
            ? "rss"
            : activeFilter === "youtube"
            ? "youtube"
            : undefined,
        showRead: filters.showRead,
        showUnread: filters.showUnread,
        feedTypes: filters.feedTypes,
      };

      // Son filtre ve seçimleri cache için saklayalım
      const requestKey = JSON.stringify({
        userId,
        selectedFeedId,
        activeFilter,
        filters: filterObj,
      });

      // Cache hit kontrolü (aynı istek tekrar yapılmasın)
      if (
        window._feedRequestCache &&
        window._feedRequestCache.key === requestKey &&
        window._feedRequestCache.data &&
        window._feedRequestCache.data.length > 0
      ) {
        // Cache'den verileri al
        setPaginatedItems(window._feedRequestCache.data || []);
        setPagination(
          window._feedRequestCache.pagination || {
            page: 1,
            pageSize: pagination.pageSize,
            total: window._feedRequestCache.data.length || 0,
            hasMore: window._feedRequestCache.hasMore || false,
          }
        );

        return {
          data: window._feedRequestCache.data,
          total: window._feedRequestCache.data.length,
          hasMore: window._feedRequestCache.hasMore,
        };
      }

      // İlk sayfayı yükle (12 öğe ile)
      const result = await feedService.getPaginatedFeedItems(
        userId,
        1, // İlk sayfa
        pageSize, // Sabit 12 değil, değişken pageSize
        filterObj
      );

      console.log(`İlk ${pageSize} öğe yüklendi`);

      // Verileri güncelle
      setPaginatedItems(result.data || []);
      setPagination({
        page: 1,
        pageSize: pagination.pageSize,
        total: result.total || 0,
        hasMore: result.hasMore || false,
      });

      // Sonuçları cache'e kaydet
      window._feedRequestCache = {
        key: requestKey,
        data: result.data || [],
        pagination: {
          page: 1,
          pageSize: pagination.pageSize,
          total: result.total || 0,
          hasMore: result.hasMore || false,
        },
        hasMore: result.hasMore || false,
        timestamp: Date.now(),
      };

      return result;
    } catch (error) {
      console.error("Feed verilerini yükleme hatası:", error);
      toast.error(t("feeds.loadError"));
      // Hata durumunda boş array dön
      setPaginatedItems([]);
      setPagination({
        page: 1,
        pageSize: pagination.pageSize,
        total: 0,
        hasMore: false,
      });
      return { data: [], total: 0, hasMore: false };
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, selectedFeedId, activeFilter, filters, pagination.pageSize, t]);

  // useEffect bağımlılıklarını düzeltmek için loadInitialItems'ı bağımlılık olarak ekle
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const debounceLoadItems = () => {
      // Eğer timeout varsa temizle
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Cache temizliği - 10 dakikadan eski cache'i sil
      if (
        window._feedRequestCache &&
        Date.now() - window._feedRequestCache.timestamp > 10 * 60 * 1000
      ) {
        window._feedRequestCache = null;
      }

      // Biraz gecikme ekleyerek async yükleme sorunlarını engelle
      timeoutId = setTimeout(() => {
        if (isMounted && userId) {
          loadInitialItems();
        }
      }, 150); // Birazcık daha uzun bir süre bekleyelim
    };

    if (userId) {
      debounceLoadItems();
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [userId, selectedFeedId, activeFilter, loadInitialItems]);

  // filters değişikliği için ayrı bir useEffect kullanalım (daha nadir değişiyor)
  useEffect(() => {
    let isMounted = true;

    if (userId && isMounted) {
      // Cache'i temizle çünkü filtreler değişti
      window._feedRequestCache = null;

      // Yeni filtrelerle yükleme yap
      loadInitialItems();
    }

    return () => {
      isMounted = false;
    };
  }, [userId, filters, loadInitialItems]);

  // Feed seçme
  const handleFeedSelect = useCallback(
    (feedId) => {
      // Eğer aynı feed ID'si zaten seçiliyse erken dön
      if (feedId === selectedFeedId) {
        return;
      }

      setSelectedFeedId(feedId);

      // URL'yi güncelle
      const url = new URL(window.location);
      if (feedId) {
        url.searchParams.set("feedId", feedId);
      } else {
        url.searchParams.delete("feedId");
      }
      window.history.pushState({}, "", url);
    },
    [selectedFeedId]
  );

  // Filtreleri uygula
  const applyFilters = useCallback(
    (newFilters) => {
      // Önceki filtrelerle aynı mı kontrol et, aynıysa erken dön
      if (JSON.stringify(newFilters) === JSON.stringify(filters)) {
        return;
      }

      // Cache'i sıfırla çünkü filtreler değişiyor
      window._feedRequestCache = null;

      setFilters(newFilters);

      // Filtre uygulandığında sayfa durumunu sıfırla
      setPagination({
        page: 1,
        pageSize: pagination.pageSize,
        total: 0,
        hasMore: true,
      });

      // loadInitialItems useEffect tarafından çağrılacak
    },
    [filters, pagination.pageSize]
  );

  // resetFilters fonksiyonunu güncelleyelim
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      sortBy: "newest",
      showRead: true,
      showUnread: true,
      feedTypes: {
        rss: true,
        youtube: true,
      },
    };

    // Eğer mevcut filtreler zaten varsayılan ise işlem yapma
    if (JSON.stringify(filters) === JSON.stringify(defaultFilters)) {
      return defaultFilters;
    }

    // Cache'i sıfırla
    window._feedRequestCache = null;

    setFilters(defaultFilters);

    // Filtreyi sıfırladığımızda sayfa durumunu sıfırla
    setPagination({
      page: 1,
      pageSize: pagination.pageSize,
      total: 0,
      hasMore: true,
    });

    // loadInitialItems useEffect tarafından çağrılacak

    return defaultFilters;
  }, [filters, pagination.pageSize]);

  // Görünüm modunu değiştir
  const changeViewMode = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Seçili feed ID'sini döndür
  const getSelectedFeedId = useCallback(() => {
    return selectedFeedId;
  }, [selectedFeedId]);

  // Feed yenileme fonksiyonu geliştirmesi
  const refresh = useCallback(() => {
    toast.info(t("feeds.refreshing"), {
      duration: 2000,
      id: "feed-refresh-toast", // Aynı toast'un üst üste gelmesini engeller
    });

    // Önce feed'leri yenile
    const refreshPromise = refreshAll ? refreshAll() : Promise.resolve();

    return refreshPromise
      .then(() => {
        // Sonra sayfalama verilerini sıfırla ve ilk sayfayı yükle
        setPagination({
          page: 1,
          pageSize: pagination.pageSize,
          total: 0,
          hasMore: true,
        });
        return loadInitialItems();
      })
      .then(() => {
        toast.success(t("feeds.refreshSuccess"), {
          duration: 2000,
          id: "feed-refresh-toast",
        });
      })
      .catch((error) => {
        toast.error(t("feeds.refreshError"), {
          duration: 3000,
        });
        console.error("Feed yenileme hatası:", error);
      });
  }, [refreshAll, loadInitialItems, pagination.pageSize, t]);

  // Eski içerikleri temizleme (service fonksiyonuna proxy)
  const cleanupOldItems = useCallback(
    (options = {}) => {
      return serviceCleanupOldItems(options);
    },
    [serviceCleanupOldItems]
  );

  // Feed senkronizasyonu
  const handleSyncFeeds = useCallback(async () => {
    if (!user) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    try {
      // Sunucu senkronizasyonunu çağır
      const response = await fetch("/api/feed-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Feed senkronizasyon hatası");
      }

      const data = await response.json().catch(() => ({}));

      toast.success(data.message || "Feed'ler başarıyla güncellendi");

      // Senkronizasyon sonrası verileri yenile
      if (refreshAll) {
        await refreshAll();
      }

      // Sayfayı güncelle
      loadInitialItems();

      return data;
    } catch (error) {
      console.error("Feed senkronizasyon hatası:", error);
      toast.error(error.message || t("feeds.syncError"));
      throw error;
    }
  }, [user, refreshAll, loadInitialItems, t]);

  // Tüm öğeleri okundu olarak işaretle
  const handleMarkAllRead = useCallback(
    async (feedId = null) => {
      if (!userId) {
        toast.error(t("errors.loginRequired"));
        return;
      }

      try {
        // Filtrelenmiş öğeleri alıp işaretle
        const itemsToMark = feedId
          ? filteredItems.filter(
              (item) => item.feed_id === feedId && !item.is_read
            )
          : filteredItems.filter((item) => !item.is_read);

        // Okunmamış öğe yoksa bildir ve çık
        if (itemsToMark.length === 0) {
          toast.info(t("feeds.noUnreadItems"));
          return;
        }

        // Her bir öğeyi okundu olarak işaretle
        const promises = itemsToMark.map((item) => toggleRead(item.id, true));

        await Promise.all(promises);

        return itemsToMark.length;
      } catch (error) {
        console.error("Toplu okundu işaretleme hatası:", error);
        toast.error(t("feeds.markAllReadError"));
        throw error;
      }
    },
    [userId, filteredItems, toggleRead, t]
  );

  // Feed kaldırma
  const handleRemoveFeed = useCallback(
    async (feedId) => {
      if (!userId) {
        toast.error(t("errors.loginRequired"));
        return;
      }

      if (!feedId) return;

      try {
        await deleteFeed(feedId);

        toast.success(t("feeds.deleteFeedSuccess"));

        // Seçili feed kaldırılıyorsa, seçimi temizle
        if (selectedFeedId === feedId) {
          setSelectedFeedId(null);
          setActiveFilter("all");
        }

        return true;
      } catch (error) {
        console.error("Feed silme hatası:", error);
        toast.error(t("feeds.deleteFeedError"));
        throw error;
      }
    },
    [userId, selectedFeedId, deleteFeed, setSelectedFeedId, setActiveFilter, t]
  );

  // Feed ekleme
  const handleAddFeed = useCallback(
    async (url, type) => {
      if (!userId) {
        toast.error(t("errors.loginRequired"));
        return;
      }

      try {
        await addFeed(url, type);

        toast.success(t("feeds.addFeedSuccess"));

        return true;
      } catch (error) {
        console.error("Feed ekleme hatası:", error);
        toast.error(error.message || t("feeds.addFeedError"));
        throw error;
      }
    },
    [userId, addFeed, t]
  );

  // Öğe paylaşma
  const handleShareItem = useCallback(
    (item) => {
      if (!item) return;

      try {
        if (navigator.share) {
          navigator.share({
            title: item.title,
            text: item.description || item.title,
            url: item.url || item.link,
          });
        } else {
          // Web Share API desteklenmiyorsa URL'yi kopyala
          navigator.clipboard.writeText(item.url || item.link);
          toast.success(t("feeds.urlCopied"));
        }
      } catch (error) {
        console.error("Paylaşım hatası:", error);
        toast.error(t("feeds.shareError"));
      }
    },
    [t]
  );

  // Daha fazla öğe yükleme fonksiyonu
  const handleLoadMoreItems = useCallback(async () => {
    if (!userId || !pagination.hasMore || isLoadingMore) return false;

    try {
      // Yükleme durumunu başlat - hemen set et
      setIsLoadingMore(true);
      console.log("Daha fazla içerik yüklemeye başlanıyor...");

      // feedService tanımlı mı kontrol et
      if (!feedService) {
        console.error("FeedService tanımlı değil!");
        setIsLoadingMore(false);
        return false;
      }

      // Sonraki sayfayı yükleyeceğiz
      const nextPage = pagination.page + 1;
      // Pagination size kontrolü
      const pageSize = pagination.pageSize || 12; // Default 12

      console.log(`Sayfa ${nextPage} yükleniyor, öğe sayısı: ${pageSize}...`);

      // Filtre objesi oluştur (loadInitialItems ile aynı)
      const filterObj = {
        selectedFeedId,
        readStatus:
          activeFilter === "unread"
            ? "unread"
            : activeFilter === "read"
            ? "read"
            : undefined,
        feedType:
          activeFilter === "rss"
            ? "rss"
            : activeFilter === "youtube"
            ? "youtube"
            : undefined,
        showRead: filters.showRead,
        showUnread: filters.showUnread,
        feedTypes: filters.feedTypes,
      };

      // Sonraki sayfa verilerini getir
      const result = await feedService.getPaginatedFeedItems(
        userId,
        nextPage,
        pageSize, // Sabit 12 değil, değişken pageSize
        filterObj
      );

      // Sonuçları hemen işle
      if (result && result.data && result.data.length > 0) {
        console.log(`${result.data.length} yeni öğe yüklendi`);

        // Mevcut cache'i güncelle
        if (window._feedRequestCache) {
          // Yeni öğeleri cache'deki listeye ekle
          window._feedRequestCache.data = [
            ...window._feedRequestCache.data,
            ...result.data,
          ];

          // Pagination bilgisini güncelle
          window._feedRequestCache.pagination = {
            page: nextPage,
            pageSize: pagination.pageSize,
            total: result.total || pagination.total,
            hasMore: result.hasMore || false,
          };

          window._feedRequestCache.hasMore = result.hasMore || false;
          window._feedRequestCache.timestamp = Date.now();
        }

        // Yeni öğeleri mevcut listeye ekle
        setPaginatedItems((prevItems) => [...prevItems, ...result.data]);

        // Sayfalama bilgisini güncelle
        setPagination({
          page: nextPage,
          pageSize: pagination.pageSize,
          total: result.total || pagination.total,
          hasMore: result.hasMore || false,
        });

        // Yükleme durumunu kapat - işlem bittiğinde hemen
        setIsLoadingMore(false);

        return true;
      } else {
        console.log("Daha fazla öğe bulunamadı");

        // Daha fazla öğe yok
        setPagination((prev) => ({
          ...prev,
          hasMore: false,
        }));

        // Cache'de hasMore değerini false olarak güncelle
        if (window._feedRequestCache) {
          window._feedRequestCache.hasMore = false;
        }

        // Yükleme durumunu kapat - hemen
        setIsLoadingMore(false);

        return false;
      }
    } catch (error) {
      console.error("Daha fazla öğe yükleme hatası:", error);

      // Hata durumunda toast göster
      toast.error(
        t("feeds.loadMoreError") ||
          "Daha fazla içerik yüklenirken bir hata oluştu"
      );

      // Hata durumunda sayfalama durumunu güncelle
      setPagination((prev) => ({
        ...prev,
        hasMore: false,
      }));

      // Yükleme durumunu kapat - hata olsa da hemen
      setIsLoadingMore(false);

      return false;
    }
  }, [
    userId,
    pagination,
    isLoadingMore,
    selectedFeedId,
    activeFilter,
    filters,
    t,
  ]);

  return {
    // Veriler
    feeds,
    items: filteredItems,
    selectedFeed,
    selectedFeedId,
    viewMode,
    filters,
    activeFilter,
    isLoading,
    isError,
    error,
    stats,
    searchQuery,
    hasMoreItems: pagination.hasMore,
    isLoadingMore,
    focusedItemId,

    // Feed seçimi ve filtreleme
    handleFeedSelect,
    setSelectedFeed: setSelectedFeedId,
    getSelectedFeedId,
    applyFilters,
    resetFilters,
    setActiveFilter,
    setViewMode: changeViewMode,
    setSearchQuery,
    setFocusedItemId,

    // Eylemler
    refresh,
    handleRefresh: refresh,
    handleSyncFeeds,
    toggleRead,
    handleToggleRead: toggleRead,
    toggleFavorite,
    handleToggleFavorite: toggleFavorite,
    toggleReadLater,
    handleToggleReadLater: toggleReadLater,
    handleMarkAllRead,
    handleRemoveFeed,
    handleAddFeed,
    handleShareItem,
    handleLoadMoreItems,
    cleanupOldItems,
    isCleaningUp,
  };
}
