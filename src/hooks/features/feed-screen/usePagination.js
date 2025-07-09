"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { toast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";
import { getFromCache, saveToCache } from "@/utils/cacheUtils";

// Cache management constants
const CACHE_KEYS = {
  ITEMS: "feed-pagination-items",
  PAGE_STATE: "feed-pagination-state",
};

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * Custom hook for managing pagination in feed screens
 * Handles loading, caching, and pagination state
 *
 * @param {Object} options - Pagination options
 * @param {Object} options.feedService - Feed service instance
 * @param {string} options.userId - Current user ID
 * @param {string} options.selectedFeedId - Selected feed ID
 * @param {Object} options.activeFilter - Active filter object
 * @param {Object} options.filters - Filter settings
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.initialPageSize - Items per page (default: 20)
 * @param {number} options.totalItems - Total number of items (default: 0)
 * @returns {Object} Pagination state and controls
 */
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
  const { t } = useTranslation();
  const isFirstLoad = useRef(true);
  const prevConfigRef = useRef({ selectedFeedId, activeFilter });

  // Pagination state
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(totalItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Create a cache key based on current filters and feed
  const cacheKey = useMemo(() => {
    const key = `${CACHE_KEYS.ITEMS}-${userId || "guest"}-${
      selectedFeedId || "all"
    }-${activeFilter?.type || "all"}-${activeFilter?.value || "all"}-${
      filters?.sortBy || "newest"
    }`;
    return key;
  }, [userId, selectedFeedId, activeFilter, filters]);

  // Create a pagination state cache key
  const pageStateCacheKey = useMemo(() => {
    return `${CACHE_KEYS.PAGE_STATE}-${userId || "guest"}-${
      selectedFeedId || "all"
    }`;
  }, [userId, selectedFeedId]);

  /**
   * Load items for the current page
   * @param {number} pageToLoad - Page number to load
   * @param {boolean} append - Whether to append items to existing ones
   * @returns {Promise<void>}
   */
  const loadItems = useCallback(
    async (pageToLoad = page, append = false) => {
      if (!feedService || !userId) return;

      try {
        setIsLoading(true);
        setError(null);

        const offset = (pageToLoad - 1) * pageSize;
        const limit = pageSize;

        // Get items from service
        const result = await feedService.getItems({
          userId,
          feedId: selectedFeedId,
          filter: activeFilter,
          sortBy: filters?.sortBy,
          offset,
          limit,
        });

        const newItems = result?.items || [];
        const totalCount = result?.total || 0;

        // Update state based on append mode
        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }

        setTotal(totalCount);
        setHasMore(
          newItems.length > 0 && offset + newItems.length < totalCount
        );

        // Cache the items for this configuration
        try {
          // Only cache on first page load or when not appending
          if (pageToLoad === 1 || !append) {
            saveToCache(
              cacheKey,
              {
                items: append ? [...items, ...newItems] : newItems,
                total: totalCount,
                timestamp: Date.now(),
              },
              CACHE_TTL
            );
          }

          // Cache pagination state
          saveToCache(
            pageStateCacheKey,
            {
              page: pageToLoad,
              pageSize,
              timestamp: Date.now(),
            },
            CACHE_TTL
          );
        } catch (cacheError) {
          console.error("Error caching pagination data:", cacheError);
        }

        return newItems;
      } catch (err) {
        console.error("Error loading feed items:", err);
        setError(err);
        toast({
          title: t("errors.loadFailed"),
          description: t("errors.tryAgainLater"),
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [
      feedService,
      userId,
      page,
      pageSize,
      selectedFeedId,
      activeFilter,
      filters,
      items,
      cacheKey,
      pageStateCacheKey,
      t,
    ]
  );

  /**
   * Load the next page of items
   * @returns {Promise<void>}
   */
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadItems(nextPage, true);
  }, [isLoading, hasMore, page, loadItems]);

  /**
   * Refresh items with current settings
   * @returns {Promise<void>}
   */
  const refresh = useCallback(async () => {
    setPage(1);
    await loadItems(1, false);
  }, [loadItems]);

  /**
   * Change page size and reload items
   * @param {number} newSize - New page size
   */
  const changePageSize = useCallback(
    (newSize) => {
      setPageSize(newSize);
      setPage(1);
      loadItems(1, false);
    },
    [loadItems]
  );

  // Load from cache on initial render
  useEffect(() => {
    if (!userId || !feedService) return;

    try {
      // Try to load items from cache
      const cachedData = getFromCache(cacheKey);
      if (cachedData?.items?.length > 0) {
        setItems(cachedData.items);
        setTotal(cachedData.total || 0);
        setHasMore(
          cachedData.items.length > 0 &&
            cachedData.items.length < (cachedData.total || 0)
        );
      }

      // Try to load pagination state from cache
      const cachedPageState = getFromCache(pageStateCacheKey);
      if (cachedPageState) {
        setPage(cachedPageState.page || 1);
        setPageSize(cachedPageState.pageSize || initialPageSize);
      }
    } catch (error) {
      console.error("Error loading cached pagination data:", error);
    }
  }, [cacheKey, pageStateCacheKey, userId, feedService, initialPageSize]);

  // Handle feed or filter changes
  useEffect(() => {
    const prevConfig = prevConfigRef.current;

    // Check if feed or filter has changed
    if (
      prevConfig.selectedFeedId !== selectedFeedId ||
      prevConfig.activeFilter?.type !== activeFilter?.type ||
      prevConfig.activeFilter?.value !== activeFilter?.value ||
      prevConfig.filters?.sortBy !== filters?.sortBy
    ) {
      // Reset to page 1 when feed or filter changes
      setPage(1);

      // Update the reference for next comparison
      prevConfigRef.current = {
        selectedFeedId,
        activeFilter,
        filters,
      };

      // Only load items if this isn't the first render
      // (the first render will be handled by the cache effect)
      if (!isFirstLoad.current) {
        loadItems(1, false);
      }
    }

    isFirstLoad.current = false;
  }, [selectedFeedId, activeFilter, filters, loadItems]);

  // Load items on initial render or when dependencies change
  useEffect(() => {
    if (userId && feedService) {
      loadItems();
    }
  }, [userId, feedService, page, pageSize, loadItems]);

  return {
    items,
    total,
    page,
    pageSize,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    changePageSize,
    setPage,
  };
}
