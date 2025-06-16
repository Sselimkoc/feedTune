"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

// Yerel depolama ile önbellek yönetimi için sabitler
const CACHE_KEYS = {
  ITEMS: "feed-pagination-items",
  PAGE_STATE: "feed-pagination-state",
};

const CACHE_TTL = 1000 * 60 * 5; // 5 dakika

// Önbelleğe alma yardımcıları
const getLocalCache = (key, defaultValue = null) => {
  try {
    if (typeof window === "undefined") return defaultValue;

    const cachedData = localStorage.getItem(key);
    if (!cachedData) return defaultValue;

    const { expiry, data } = JSON.parse(cachedData);
    if (expiry < Date.now()) {
      localStorage.removeItem(key);
      return defaultValue;
    }

    return data;
  } catch (error) {
    console.warn(`Pagination cache error (${key}):`, error);
    return defaultValue;
  }
};

const setLocalCache = (key, data) => {
  try {
    if (typeof window === "undefined") return;

    const cacheData = {
      expiry: Date.now() + CACHE_TTL,
      data,
    };

    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn(`Failed to cache pagination data (${key}):`, error);
  }
};

export function usePagination({
  feedService,
  userId,
  selectedFeedId,
  activeFilter,
  filters,
  initialPage = 1,
  initialPageSize = 20,
  totalItems = 0,
}) {
  const { t } = useLanguage();
  const isFirstLoad = useRef(true);
  const prevConfigRef = useRef({ selectedFeedId, activeFilter });
  const loadingTimerRef = useRef(null);

  // Filtreleme durumuna özgü önbellek anahtarı oluştur
  const cacheKey = useMemo(() => {
    const filterStr = JSON.stringify({
      selectedFeedId: selectedFeedId || "all",
      activeFilter: activeFilter || "all",
      readStatus: filters?.readStatus || "all",
      feedType: filters?.feedType || "all",
      sortBy: filters?.sortBy || "newest",
    });

    return `${CACHE_KEYS.ITEMS}_${userId}_${btoa(filterStr)}`;
  }, [userId, selectedFeedId, activeFilter, filters]);

  // Sayfalama durumu
  const [paginatedItems, setPaginatedItems] = useState(() => {
    // İlk yüklemede önbellekten verileri almayı dene
    return getLocalCache(cacheKey, []);
  });

  // İlk yükleme durumu
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const [pagination, setPagination] = useState(() => {
    // Sayfalama durumunu önbellekten getir veya varsayılan değerleri kullan
    const cachedState = getLocalCache(CACHE_KEYS.PAGE_STATE);
    return (
      cachedState || {
        page: 1,
        pageSize: 12,
        total: 0,
        hasMore: true,
      }
    );
  });

  // Filtre değişikliğini algıla ve yeniden yükleme yap
  useEffect(() => {
    const configChanged =
      prevConfigRef.current.selectedFeedId !== selectedFeedId ||
      prevConfigRef.current.activeFilter !== activeFilter;

    if (configChanged) {
      console.log("Feed filtreleri değişti, içerik temizleniyor");

      // Şu anki yapılandırmayı kaydet
      prevConfigRef.current = { selectedFeedId, activeFilter };

      // Yükleme durumunu ayarla
      setIsTransitioning(true);

      // Önce önbellekten verileri kontrol et
      const cachedItems = getLocalCache(cacheKey, null);
      if (cachedItems && cachedItems.length > 0) {
        console.log("Önbellekten veriler yükleniyor", {
          itemCount: cachedItems.length,
        });

        setPaginatedItems(cachedItems);
        setIsInitialLoading(false);
        setIsTransitioning(false);

        return;
      }

      // Önbellekte veri yoksa temizle ve yeni yükleme başlat
      setPaginatedItems([]);
      setPagination((prev) => ({ ...prev, page: 1 }));

      // Yükleme için kısa bir gecikme ile kullanıcı deneyimini iyileştir
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }

      loadingTimerRef.current = setTimeout(() => {
        loadInitialItems();
      }, 100);
    }
  }, [selectedFeedId, activeFilter, cacheKey]);

  // Filtre objesi oluştur
  const createFilterObject = useCallback(() => {
    const filterObj = {};

    if (selectedFeedId) {
      filterObj.selectedFeedId = selectedFeedId;
    }

    if (filters?.feedType && filters?.feedType !== "all") {
      filterObj.feedType = filters.feedType;
    } else if (activeFilter === "rss" || activeFilter === "youtube") {
      filterObj.feedType = activeFilter;
    }

    if (filters?.feedName) {
      filterObj.feedName = filters.feedName;
    }

    if (filters?.readStatus) {
      filterObj.readStatus = filters.readStatus;
    }

    if (filters?.sortBy) {
      filterObj.sortBy = filters.sortBy;
    }

    return filterObj;
  }, [activeFilter, filters, selectedFeedId]);

  // İlk içerikleri yükle - performans için optimize edildi
  const loadInitialItems = useCallback(async () => {
    if (!userId || !feedService) {
      setIsInitialLoading(false);
      return;
    }

    try {
      setIsInitialLoading(true);

      const filterObj = createFilterObject();
      console.log("İlk yükleme için filtreler:", filterObj);

      if (typeof feedService.getPaginatedFeedItems !== "function") {
        console.error(
          "HATA: feedService.getPaginatedFeedItems metodu bulunamadı"
        );
        toast.error(t("errors.loadFailed"));
        setIsTransitioning(false);
        setIsInitialLoading(false);
        return;
      }

      // API'den verileri getir
      const result = await feedService.getPaginatedFeedItems(
        userId,
        1,
        pagination.pageSize,
        filterObj
      );

      if (result?.data) {
        // Client-side filtreleme
        let filteredData = filterItemsClientSide(result.data);

        // Durum güncellemelerini toplu olarak yap
        setPaginatedItems(filteredData);
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: filteredData.length || 0,
          hasMore: result.hasMore || false,
        }));

        // Önbelleğe al
        setLocalCache(cacheKey, filteredData);
        setLocalCache(CACHE_KEYS.PAGE_STATE, {
          page: 1,
          pageSize: pagination.pageSize,
          total: filteredData.length || 0,
          hasMore: result.hasMore || false,
        });
      }
    } catch (error) {
      console.error("İçerik yükleme hatası:", error);
      toast.error(t("errors.loadFailed"));
    } finally {
      setIsTransitioning(false);
      setIsInitialLoading(false);
    }
  }, [
    userId,
    feedService,
    pagination.pageSize,
    t,
    createFilterObject,
    cacheKey,
  ]);

  // İlk bileşen mount olduğunda içerikleri yükle
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;

      // Önbellekten veriler varsa, API çağrısını atla
      if (paginatedItems.length > 0) {
        console.log(
          "İlk yükleme önbellekten tamamlandı:",
          paginatedItems.length
        );
        setIsInitialLoading(false);
        return;
      }

      loadInitialItems();
    }
  }, [loadInitialItems, paginatedItems.length]);

  // Client-side filtreleme - İstemci tarafında filtreleme için optimize edilmiş fonksiyon
  const filterItemsClientSide = useCallback(
    (items) => {
      if (!Array.isArray(items)) return [];

      let filteredData = [...items];

      // Feed türü filtreleme
      if (filters?.feedType && filters.feedType !== "all") {
        filteredData = filteredData.filter(
          (item) => item.feed_type === filters.feedType
        );
      }

      // Okunma durumu filtreleme
      if (filters?.readStatus === "read") {
        filteredData = filteredData.filter((item) => item.is_read);
      } else if (filters?.readStatus === "unread") {
        filteredData = filteredData.filter((item) => !item.is_read);
      }

      // Sıralama
      if (filters?.sortBy) {
        if (filters.sortBy === "newest") {
          filteredData.sort(
            (a, b) => new Date(b.published_at) - new Date(a.published_at)
          );
        } else if (filters.sortBy === "oldest") {
          filteredData.sort(
            (a, b) => new Date(a.published_at) - new Date(b.published_at)
          );
        } else if (filters.sortBy === "unread") {
          filteredData.sort((a, b) => {
            if (!a.is_read && b.is_read) return -1;
            if (a.is_read && !b.is_read) return 1;
            return new Date(b.published_at) - new Date(a.published_at);
          });
        } else if (filters.sortBy === "favorites") {
          filteredData.sort((a, b) => {
            if (a.is_favorite && !b.is_favorite) return -1;
            if (!a.is_favorite && b.is_favorite) return 1;
            return new Date(b.published_at) - new Date(a.published_at);
          });
        }
      }

      return filteredData;
    },
    [filters]
  );

  // Daha fazla öğe yükle - performans iyileştirmeli
  const loadMoreItems = useCallback(async () => {
    if (
      !userId ||
      !feedService ||
      !pagination.hasMore ||
      isLoadingMore ||
      isTransitioning ||
      typeof feedService.getPaginatedFeedItems !== "function"
    ) {
      return false;
    }

    try {
      setIsLoadingMore(true);
      const nextPage = pagination.page + 1;
      const filterObj = createFilterObject();

      console.log(`Sayfa ${nextPage} yükleniyor:`, filterObj);

      const result = await feedService.getPaginatedFeedItems(
        userId,
        nextPage,
        pagination.pageSize,
        filterObj
      );

      if (result?.data?.length > 0) {
        // Client-side filtreleme ile veriyi işle
        const filteredNewItems = filterItemsClientSide(result.data);

        // Aynı öğeleri filtrele (duplicate önleme)
        const existingIds = new Set(paginatedItems.map((item) => item.id));
        const uniqueNewItems = filteredNewItems.filter(
          (item) => !existingIds.has(item.id)
        );

        if (uniqueNewItems.length === 0) {
          // API yeni öğe döndürmüşse ancak hepsi zaten mevcutsa
          setPagination((prev) => ({
            ...prev,
            hasMore: false,
          }));
          return true;
        }

        // Durum güncellemelerini yapıcaz
        const updatedItems = [...paginatedItems, ...uniqueNewItems];
        setPaginatedItems(updatedItems);
        setPagination((prev) => ({
          ...prev,
          page: nextPage,
          total: result.total || prev.total,
          hasMore: result.hasMore || false,
        }));

        // Yeni veriyi önbelleğe al
        setLocalCache(cacheKey, updatedItems);
        setLocalCache(CACHE_KEYS.PAGE_STATE, {
          page: nextPage,
          pageSize: pagination.pageSize,
          total: result.total || pagination.total,
          hasMore: result.hasMore || false,
        });

        return true;
      }

      // Veri gelmezse, daha fazla öğe olmadığını belirt
      setPagination((prev) => ({
        ...prev,
        hasMore: false,
      }));
      return false;
    } catch (error) {
      console.error(
        `Daha fazla içerik yükleme hatası (sayfa ${pagination.page + 1}):`,
        error
      );
      toast.error(t("errors.loadMoreFailed"));
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    userId,
    feedService,
    pagination,
    createFilterObject,
    isLoadingMore,
    isTransitioning,
    t,
    paginatedItems,
    filterItemsClientSide,
    cacheKey,
  ]);

  // Sayfalamayı sıfırla
  const resetPagination = useCallback(() => {
    console.log("Sayfalama durumu sıfırlanıyor");
    setPagination({
      page: 1,
      pageSize: 12,
      total: 0,
      hasMore: true,
    });
    setPaginatedItems([]);
    setIsInitialLoading(true);

    // Kısa bir gecikme ile yükleme başlat
    setTimeout(() => {
      loadInitialItems();
    }, 50);
  }, [loadInitialItems]);

  // Cache'den feed öğelerini alırken yükleme durumunu takip et
  useEffect(() => {
    // İlk yükleme durumunu sıfırla
    if (
      selectedFeedId !== prevConfigRef.current.selectedFeedId ||
      activeFilter !== prevConfigRef.current.activeFilter
    ) {
      setIsInitialLoading(true);
      setIsTransitioning(true);
    }

    // Öğeler yüklendikten sonra loading durumunu kapat
    if (paginatedItems && paginatedItems.length > 0) {
      setIsInitialLoading(false);

      // Kısa bir süre sonra geçiş durumunu kapat
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);

      return () => clearTimeout(timer);
    }

    // Geçiş durumunu 500ms sonra kapat
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [selectedFeedId, activeFilter, paginatedItems, isTransitioning]);

  const nextPage = useCallback(async () => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
      return true;
    }
    return false;
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1);
      return true;
    }
    return false;
  }, [hasPreviousPage]);

  const goToPage = useCallback(
    (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        setPage(pageNumber);
        return true;
      }
      return false;
    },
    [totalPages]
  );

  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    paginatedItems,
    pagination,
    isLoadingMore,
    isInitialLoading,
    isTransitioning,
    loadMoreItems,
    resetPagination,
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    changePageSize,
    reset,
  };
}
