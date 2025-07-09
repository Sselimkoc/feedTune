"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/core/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { useFeedService } from "@/hooks/features/useFeedService";
import { usePagination } from "@/hooks/features/feed-screen/usePagination";
import { supabase } from "@/lib/supabase";
import { getFromCache, saveToCache } from "@/utils/cacheUtils";

export function useFeedScreen({ initialFeedId } = {}) {
  const { t } = useTranslation();
  const { user, isLoading: isLoadingUser } = useAuth();
  const userId = user?.id;
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // URL'den feed ID'sini al
  const urlFeedId = searchParams.get("feed");

  // State'ler
  const [selectedFeedId, setSelectedFeedId] = useState(() => {
    if (typeof window === "undefined")
      return initialFeedId || urlFeedId || null;
    return (
      getFromCache("feed-screen-state")?.selectedFeedId ||
      initialFeedId ||
      urlFeedId ||
      null
    );
  });

  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "grid";
    return getFromCache("feed-screen-state")?.viewMode || "grid";
  });

  const [activeFilter, setActiveFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return getFromCache("feed-screen-state")?.activeFilter || "all";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Feed service
  const {
    feeds,
    items: feedItems,
    favorites,
    readLaterItems,
    isLoadingFeeds,
    isLoadingItems,
    isErrorFeeds,
    isErrorItems,
    refreshAllFeeds,
    refreshFeed,
    markItemRead,
    toggleFavorite,
    toggleReadLater,
    refetchFavorites,
    refetchReadLater,
  } = useFeedService();

  // Pagination
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 20,
    totalItems: feedItems.length,
  });

  // Cache state değişikliklerini
  useEffect(() => {
    if (!userId) return;

    saveToCache(
      "feed-screen-state",
      {
        selectedFeedId,
        viewMode,
        activeFilter,
      },
      1000 * 60 * 60 * 24 // 24 saat
    );
  }, [selectedFeedId, viewMode, activeFilter, userId]);

  // Feed seçimi değiştiğinde URL'i güncelle
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (selectedFeedId) {
      url.searchParams.set("feed", selectedFeedId);
    } else {
      url.searchParams.delete("feed");
    }
    window.history.replaceState({}, "", url.toString());
  }, [selectedFeedId]);

  // Bulk mode handlers
  const toggleBulkMode = useCallback(() => {
    setIsBulkMode((prev) => !prev);
    setSelectedItems([]);
  }, []);

  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  // Bulk actions
  const handleBulkMarkAsRead = useCallback(async () => {
    if (!selectedItems.length) return;
    await markItemRead(selectedItems, true);
    setSelectedItems([]);
    setIsBulkMode(false);
  }, [selectedItems, markItemRead]);

  const handleBulkMarkAsUnread = useCallback(async () => {
    if (!selectedItems.length) return;
    await markItemRead(selectedItems, false);
    setSelectedItems([]);
    setIsBulkMode(false);
  }, [selectedItems, markItemRead]);

  const handleBulkAddToFavorites = useCallback(async () => {
    if (!selectedItems.length) return;
    for (const itemId of selectedItems) {
      await toggleFavorite(itemId, true);
    }
    setSelectedItems([]);
    setIsBulkMode(false);
  }, [selectedItems, toggleFavorite]);

  const handleBulkAddToReadLater = useCallback(async () => {
    if (!selectedItems.length) return;
    for (const itemId of selectedItems) {
      await toggleReadLater(itemId, true);
    }
    setSelectedItems([]);
    setIsBulkMode(false);
  }, [selectedItems, toggleReadLater]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !pagination.hasNextPage) return;

    setIsLoadingMore(true);
    try {
      await pagination.nextPage();
    } catch (error) {
      console.error("Error loading more content:", error);
      toast({
        title: t("common.error"),
        description: t("errors.loadMoreFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, pagination, toast, t]);

  return {
    // State
    selectedFeedId,
    viewMode,
    activeFilter,
    searchQuery,
    isBulkMode,
    selectedItems,
    isLoadingMore,

    // Data
    feeds,
    items: feedItems,
    favorites,
    readLaterItems,

    // Loading states
    isLoading: isLoadingFeeds || isLoadingItems || isLoadingUser,
    isError: isErrorFeeds || isErrorItems,

    // Pagination
    page: pagination.page,
    pageSize: pagination.pageSize,
    hasNextPage: pagination.hasNextPage,
    hasPreviousPage: pagination.hasPreviousPage,

    // Actions
    setSelectedFeedId,
    setViewMode,
    setActiveFilter,
    setSearchQuery,
    refreshAll: refreshAllFeeds,
    refreshFeed,
    toggleFavorite,
    toggleReadLater,
    markItemRead,
    loadMoreItems: handleLoadMore,

    // Bulk actions
    toggleBulkMode,
    toggleItemSelection,
    handleBulkMarkAsRead,
    handleBulkMarkAsUnread,
    handleBulkAddToFavorites,
    handleBulkAddToReadLater,
  };
}
