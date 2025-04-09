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
    
    if (activeFilter === "rss" || activeFilter === "youtube") {
      filterObj.feedType = activeFilter;
    }
    
    if (filters?.feedName) {
      filterObj.feedName = filters.feedName;
    }
    
    if (filters?.readStatus !== null && filters?.readStatus !== undefined) {
      filterObj.readStatus = filters.readStatus;
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

      const result = await feedService.getPaginatedFeedItems(
        userId,
        1,
        pagination.pageSize,
        filterObj
      );

      if (result?.data) {
        setIsTransitioning(false);
        setPaginatedItems(result.data);
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: result.total || 0,
          hasMore: result.hasMore || false,
        }));

        setLastLoadedFilters({
          feedId: selectedFeedId,
          activeFilter: activeFilter,
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
      changed: filtersChanged 
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
  }, []);

  const loadMoreItems = useCallback(async () => {
    if (
      !userId ||
      !feedService ||
      !pagination.hasMore ||
      isLoadingMore ||
      isTransitioning
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
