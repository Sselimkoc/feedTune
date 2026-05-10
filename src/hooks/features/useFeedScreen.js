"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/core/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { useFeedService } from "@/hooks/features/useFeedService";
import { useFilters } from "@/hooks/features/feed-screen/useFilters";
import { getFromCache, saveToCache } from "@/utils/cacheUtils";

export function useFeedScreen({ initialFeedId } = {}) {
  const { t } = useTranslation();
  const { user, isLoading: isLoadingUser } = useAuth();
  const userId = user?.id;
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const urlFeedId = searchParams.get("feed");

  const [selectedFeedId, setSelectedFeedId] = useState(() => {
    if (typeof window === "undefined") return initialFeedId || urlFeedId || null;
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const {
    filters,
    filterObject,
    applyFilters,
    updateFilter,
    resetFilters,
    setFeedNameFilter,
    setFeedTypeFilter,
    setReadStatusFilter,
    setSortByFilter,
  } = useFilters();

  const {
    feeds,
    items: feedItems,
    favorites,
    readLaterItems,
    isLoading: isLoadingFeeds,
    error: feedsError,
    addInteraction,
    removeInteraction,
    refreshAllFeeds,
    syncFeed,
  } = useFeedService();

  useEffect(() => {
    if (!userId) return;
    saveToCache("feed-screen-state", { selectedFeedId, viewMode }, 1000 * 60 * 60 * 24);
  }, [selectedFeedId, viewMode, userId]);

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

  const toggleBulkMode = useCallback(() => {
    setIsBulkMode((prev) => !prev);
    setSelectedItems([]);
  }, []);

  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }, []);

  const handleBulkMarkAsRead = useCallback(async () => {
    if (!selectedItems.length) return;
    try {
      for (const itemId of selectedItems) {
        await addInteraction(itemId, "is_read", "rss");
      }
      setSelectedItems([]);
      setIsBulkMode(false);
      toast({ title: t("common.success"), description: t("items.markedAsRead") });
    } catch {
      toast({ title: t("common.error"), description: t("errors.markAsReadFailed"), variant: "destructive" });
    }
  }, [selectedItems, addInteraction, toast, t]);

  const handleBulkMarkAsUnread = useCallback(async () => {
    if (!selectedItems.length) return;
    try {
      for (const itemId of selectedItems) {
        await removeInteraction(itemId, "is_read", "rss");
      }
      setSelectedItems([]);
      setIsBulkMode(false);
      toast({ title: t("common.success"), description: t("items.markedAsUnread") });
    } catch {
      toast({ title: t("common.error"), description: t("errors.markAsUnreadFailed"), variant: "destructive" });
    }
  }, [selectedItems, removeInteraction, toast, t]);

  const handleBulkAddToFavorites = useCallback(async () => {
    if (!selectedItems.length) return;
    try {
      for (const itemId of selectedItems) {
        await addInteraction(itemId, "is_favorite", "rss");
      }
      setSelectedItems([]);
      setIsBulkMode(false);
      toast({ title: t("common.success"), description: t("items.addedToFavorites") });
    } catch {
      toast({ title: t("common.error"), description: t("errors.addToFavoritesFailed"), variant: "destructive" });
    }
  }, [selectedItems, addInteraction, toast, t]);

  const handleBulkAddToReadLater = useCallback(async () => {
    if (!selectedItems.length) return;
    try {
      for (const itemId of selectedItems) {
        await addInteraction(itemId, "is_read_later", "rss");
      }
      setSelectedItems([]);
      setIsBulkMode(false);
      toast({ title: t("common.success"), description: t("items.addedToReadLater") });
    } catch {
      toast({ title: t("common.error"), description: t("errors.addToReadLaterFailed"), variant: "destructive" });
    }
  }, [selectedItems, addInteraction, toast, t]);

  const refreshFeed = useCallback(async (feedId) => {
    try {
      await syncFeed(feedId);
      toast({ title: t("common.success"), description: t("feeds.syncSuccess") });
    } catch {
      toast({ title: t("common.error"), description: t("errors.syncFailed"), variant: "destructive" });
    }
  }, [syncFeed, toast, t]);

  const toggleFavorite = useCallback(async (itemId, itemType = "rss") => {
    try {
      await addInteraction(itemId, "is_favorite", itemType);
    } catch {
      toast({ title: t("common.error"), description: t("errors.toggleFavoriteFailed"), variant: "destructive" });
    }
  }, [addInteraction, toast, t]);

  const toggleReadLater = useCallback(async (itemId, itemType = "rss") => {
    try {
      await addInteraction(itemId, "is_read_later", itemType);
    } catch {
      toast({ title: t("common.error"), description: t("errors.toggleReadLaterFailed"), variant: "destructive" });
    }
  }, [addInteraction, toast, t]);

  const markItemRead = useCallback(async (itemId, itemType = "rss") => {
    try {
      await addInteraction(itemId, "is_read", itemType);
    } catch {
      toast({ title: t("common.error"), description: t("errors.markAsReadFailed"), variant: "destructive" });
    }
  }, [addInteraction, toast, t]);

  return {
    selectedFeedId,
    viewMode,
    searchQuery,
    isBulkMode,
    selectedItems,
    filters,
    filterObject,
    feeds,
    items: feedItems,
    favorites,
    readLaterItems,
    isLoading: isLoadingFeeds || isLoadingUser,
    isError: !!feedsError,
    setSelectedFeedId,
    setViewMode,
    setSearchQuery,
    refreshAll: refreshAllFeeds,
    refreshFeed,
    toggleFavorite,
    toggleReadLater,
    markItemRead,
    applyFilters,
    updateFilter,
    resetFilters,
    setFeedNameFilter,
    setFeedTypeFilter,
    setReadStatusFilter,
    setSortByFilter,
    toggleBulkMode,
    toggleItemSelection,
    handleBulkMarkAsRead,
    handleBulkMarkAsUnread,
    handleBulkAddToFavorites,
    handleBulkAddToReadLater,
  };
}
