"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getFromCache, saveToCache } from "@/utils/cacheUtils";

const FILTERS_STORAGE_KEY = "feedtune-feed-filters";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

const DEFAULT_FILTERS = {
  feedType: "all",
  readStatus: "all",
  sortBy: "newest",
  feedName: "",
};

/**
 * Custom hook for managing feed filters
 * Handles filter state, persistence, and URL synchronization
 *
 * @returns {Object} Filter state and operations
 * @returns {Object} filters - Current filter values
 * @returns {Function} applyFilters - Update multiple filters at once
 * @returns {Function} updateFilter - Update a single filter
 * @returns {Function} resetFilters - Reset all filters to defaults
 * @returns {Function} setFeedNameFilter - Set feed name filter
 * @returns {Function} setFeedTypeFilter - Set feed type filter
 * @returns {Function} setReadStatusFilter - Set read status filter
 * @returns {Function} setSortByFilter - Set sort by filter
 */
export function useFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitializedRef = useRef(false);
  const { t } = useTranslation();

  // Get initial filter values from cache
  const [filters, setFilters] = useState(() => {
    try {
      return getFromCache(FILTERS_STORAGE_KEY, CACHE_TTL) || DEFAULT_FILTERS;
    } catch (error) {
      console.error("Error loading filter settings:", error);
      return DEFAULT_FILTERS;
    }
  });

  const previousFiltersRef = useRef(filters);

  // Create filter object for API calls and caching
  const filterObject = useMemo(() => {
    return {
      feedType: filters.feedType,
      readStatus: filters.readStatus,
      sortBy: filters.sortBy,
      feedName: filters.feedName,
    };
  }, [filters]);

  // Load filters from URL parameters
  useEffect(() => {
    const urlFilters = {};
    let hasUrlFilters = false;

    // Read all filters from URL
    if (searchParams.has("feedType")) {
      urlFilters.feedType = searchParams.get("feedType");
      hasUrlFilters = true;
    }

    if (searchParams.has("readStatus")) {
      urlFilters.readStatus = searchParams.get("readStatus");
      hasUrlFilters = true;
    }

    if (searchParams.has("sortBy")) {
      urlFilters.sortBy = searchParams.get("sortBy");
      hasUrlFilters = true;
    }

    if (searchParams.has("feedName")) {
      urlFilters.feedName = searchParams.get("feedName");
      hasUrlFilters = true;
    }

    // If URL has filters and this is initial load, update state
    if (hasUrlFilters && !isInitializedRef.current) {
      console.log("Loaded filters from URL:", urlFilters);
      setFilters((prev) => ({ ...prev, ...urlFilters }));

      // Also save to cache
      try {
        saveToCache(
          FILTERS_STORAGE_KEY,
          { ...filters, ...urlFilters },
          CACHE_TTL
        );
      } catch (error) {
        console.error("Error saving filters to cache:", error);
      }
    }

    isInitializedRef.current = true;
  }, [searchParams, filters]);

  // Save filters to cache and update URL when they change
  useEffect(() => {
    // Skip during initial load
    if (!isInitializedRef.current) return;

    try {
      // Check if filters have actually changed
      const prevFilters = previousFiltersRef.current;
      const hasChanged =
        prevFilters.feedType !== filters.feedType ||
        prevFilters.readStatus !== filters.readStatus ||
        prevFilters.sortBy !== filters.sortBy ||
        prevFilters.feedName !== filters.feedName;

      if (hasChanged) {
        // Save to cache
        saveToCache(FILTERS_STORAGE_KEY, filters, CACHE_TTL);
        previousFiltersRef.current = { ...filters };

        // Update URL parameters
        updateUrlWithFilters(filters);
      }
    } catch (error) {
      console.error("Error saving filter settings:", error);
    }
  }, [filters]);

  /**
   * Update URL with current filter values
   * @param {Object} filterValues - Current filter values
   */
  const updateUrlWithFilters = useCallback(
    (filterValues) => {
      try {
        const params = new URLSearchParams();

        // Only add non-empty and non-default values to URL
        Object.entries(filterValues).forEach(([key, value]) => {
          if (
            value !== null &&
            value !== DEFAULT_FILTERS[key] &&
            !(key === "feedType" && value === "all") &&
            !(key === "readStatus" && value === "all")
          ) {
            params.set(key, value);
          }
        });

        const query = params.toString();
        // Use shallow routing to update URL without page refresh
        router.push(query ? `?${query}` : "/feeds", { scroll: false });
      } catch (error) {
        console.error("URL update error:", error);
      }
    },
    [router]
  );

  /**
   * Apply multiple filter updates at once
   * @param {Object} newFilters - New filter values to apply
   */
  const applyFilters = useCallback((newFilters) => {
    setFilters((prev) => {
      // Create a complete copy of previous filters
      const updated = { ...prev };

      // Only update filters that have changed
      Object.entries(newFilters).forEach(([key, value]) => {
        if (prev[key] !== value) {
          updated[key] = value;
        }
      });

      // Prevent unnecessary state updates
      if (JSON.stringify(updated) === JSON.stringify(prev)) {
        return prev;
      }

      return updated;
    });
  }, []);

  /**
   * Update a single filter value
   * @param {string} key - Filter key to update
   * @param {any} value - New filter value
   */
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      // Skip update if value hasn't changed
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  /**
   * Reset all filters to default values
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);

    // Clear URL parameters
    router.push("/feeds", { scroll: false });

    // Clear from cache
    try {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing filter cache:", error);
    }
  }, [router]);

  /**
   * Set feed name filter
   * @param {string} name - Feed name to filter by
   */
  const setFeedNameFilter = useCallback(
    (name) => {
      updateFilter("feedName", name);
    },
    [updateFilter]
  );

  /**
   * Set feed type filter (all, rss, youtube)
   * @param {string} type - Feed type to filter by
   */
  const setFeedTypeFilter = useCallback(
    (type) => {
      updateFilter("feedType", type);
    },
    [updateFilter]
  );

  /**
   * Set read status filter (all, read, unread)
   * @param {string} status - Read status to filter by
   */
  const setReadStatusFilter = useCallback(
    (status) => {
      updateFilter("readStatus", status);
    },
    [updateFilter]
  );

  /**
   * Set sort by filter (newest, oldest, etc.)
   * @param {string} sortBy - Sort method to use
   */
  const setSortByFilter = useCallback(
    (sortBy) => {
      updateFilter("sortBy", sortBy);
    },
    [updateFilter]
  );

  return {
    filters,
    filterObject,
    applyFilters,
    updateFilter,
    resetFilters,
    setFeedNameFilter,
    setFeedTypeFilter,
    setReadStatusFilter,
    setSortByFilter,
  };
}
