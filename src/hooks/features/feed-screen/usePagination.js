"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

export function usePagination({
  feedService,
  userId,
  selectedFeedId,
  activeFilter,
  filters,
}) {
  const { t } = useLanguage();
  const [paginatedItems, setPaginatedItems] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastLoadedFilters, setLastLoadedFilters] = useState({
    feedId: null,
    activeFilter: null,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    hasMore: true,
  });

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

    console.log("Oluşturulan filtre objesi:", filterObj);
    return filterObj;
  }, [activeFilter, filters, selectedFeedId]);

  const loadInitialItems = useCallback(async () => {
    if (!userId || !feedService) return;

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

      const result = await feedService.getPaginatedFeedItems(
        userId,
        1,
        pagination.pageSize,
        filterObj
      );

      console.log("Yüklenen veri sonuçları:", {
        dataLength: result?.data?.length || 0,
        hasYoutubeItems: result?.data?.some(
          (item) => item.itemType === "youtube"
        ),
        itemTypes: result?.data
          ?.map((item) => item.itemType)
          .filter((value, index, self) => self.indexOf(value) === index),
      });

      if (result?.data) {
        let filteredData = result.data;

        if (filters?.feedType && filters.feedType !== "all") {
          filteredData = filteredData.filter(
            (item) => item.feed_type === filters.feedType
          );
        }

        if (filters?.readStatus === "read") {
          filteredData = filteredData.filter((item) => item.is_read);
        } else if (filters?.readStatus === "unread") {
          filteredData = filteredData.filter((item) => !item.is_read);
        }

        if (filters?.sortBy) {
          if (filters.sortBy === "newest") {
            filteredData = filteredData.sort(
              (a, b) => new Date(b.published_at) - new Date(a.published_at)
            );
          } else if (filters.sortBy === "oldest") {
            filteredData = filteredData.sort(
              (a, b) => new Date(a.published_at) - new Date(b.published_at)
            );
          } else if (filters.sortBy === "unread") {
            filteredData = filteredData.sort((a, b) => {
              if (!a.is_read && b.is_read) return -1;
              if (a.is_read && !b.is_read) return 1;
              return new Date(b.published_at) - new Date(a.published_at);
            });
          } else if (filters.sortBy === "favorites") {
            filteredData = filteredData.sort((a, b) => {
              if (a.is_favorite && !b.is_favorite) return -1;
              if (!a.is_favorite && b.is_favorite) return 1;
              return new Date(b.published_at) - new Date(a.published_at);
            });
          }
        }

        // Filter için YouTube öğelerinin durumunu kontrol et
        console.log("Filtrelenmiş veri sonuçları:", {
          dataLength: filteredData.length,
          hasYoutubeItems: filteredData.some(
            (item) => item.itemType === "youtube"
          ),
          itemTypes: filteredData
            .map((item) => item.itemType)
            .filter((value, index, self) => self.indexOf(value) === index),
        });

        setIsTransitioning(false);
        setPaginatedItems(filteredData);
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: filteredData.length || 0,
          hasMore: result.hasMore || false,
        }));

        setLastLoadedFilters({
          feedId: selectedFeedId,
          activeFilter: activeFilter,
          filters: { ...filters },
        });
      }
    } catch (error) {
      console.error("İçerik yükleme hatası:", error);
      toast.error(t("errors.loadFailed"));
      setIsTransitioning(false);
    } finally {
      setIsInitialLoading(false);
    }
  }, [
    userId,
    feedService,
    pagination.pageSize,
    t,
    createFilterObject,
    selectedFeedId,
    activeFilter,
    filters,
  ]);

  useEffect(() => {
    const filtersChanged =
      lastLoadedFilters.feedId !== selectedFeedId ||
      lastLoadedFilters.activeFilter !== activeFilter;

    console.log("Filter check:", {
      selectedFeedId,
      lastFeedId: lastLoadedFilters.feedId,
      activeFilter,
      lastActiveFilter: lastLoadedFilters.activeFilter,
      changed: filtersChanged,
    });

    if (filtersChanged) {
      console.log("Filtreler değişti, geçiş başlatılıyor...");
      setIsTransitioning(true);
      setPaginatedItems([]);
      setPagination((prev) => ({ ...prev, page: 1 }));

      const timer = setTimeout(() => {
        loadInitialItems();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    selectedFeedId,
    activeFilter,
    loadInitialItems,
    lastLoadedFilters.feedId,
    lastLoadedFilters.activeFilter,
  ]);

  useEffect(() => {
    console.log("Component mounted, initial load starting");
    loadInitialItems();
  }, [loadInitialItems]);

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
        setPaginatedItems((prev) => [...prev, ...result.data]);
        setPagination((prev) => ({
          ...prev,
          page: nextPage,
          total: result.total || prev.total,
          hasMore: result.hasMore || false,
        }));
        return true;
      }

      setPagination((prev) => ({ ...prev, hasMore: false }));
      return false;
    } catch (error) {
      console.error("Daha fazla içerik yükleme hatası:", error);
      toast.error(t("errors.loadMoreFailed"));
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    userId,
    pagination,
    feedService,
    t,
    createFilterObject,
    isLoadingMore,
    isTransitioning,
  ]);

  const resetPagination = useCallback(() => {
    console.log("Sayfalama sıfırlanıyor...");
    setIsTransitioning(true);
    setPagination({
      page: 1,
      pageSize: 12,
      total: 0,
      hasMore: true,
    });
    setPaginatedItems([]);

    const timer = setTimeout(() => {
      loadInitialItems();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadInitialItems]);

  return {
    paginatedItems,
    setPaginatedItems,
    pagination,
    setPagination,
    isLoadingMore,
    isInitialLoading,
    isTransitioning,
    loadMoreItems,
    resetPagination,
  };
}
