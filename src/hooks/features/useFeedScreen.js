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

  // URL'den feed ID'sini al
  const urlFeedId = searchParams.get("feed");

  // State'ler - sadece UI state'leri
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Filters hook
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

  // Feed service - tüm data operations buradan geliyor
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

  // Cache state değişikliklerini
  useEffect(() => {
    if (!userId) return;

    saveToCache(
      "feed-screen-state",
      {
        selectedFeedId,
        viewMode,
      },
      1000 * 60 * 60 * 24 // 24 saat
    );
  }, [selectedFeedId, viewMode, userId]);

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

  // Bulk actions - useFeedService'teki fonksiyonları kullan
  const handleBulkMarkAsRead = useCallback(async () => {
    if (!selectedItems.length) return;
    
    try {
      for (const itemId of selectedItems) {
        await addInteraction(itemId, "is_read", "rss");
      }
      setSelectedItems([]);
      setIsBulkMode(false);
      toast({
        title: t("common.success"),
        description: t("items.markedAsRead"),
      });
    } catch (error) {
      console.error("Error marking items as read:", error);
      toast({
        title: t("common.error"),
        description: t("errors.markAsReadFailed"),
        variant: "destructive",
      });
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
      toast({
        title: t("common.success"),
        description: t("items.markedAsUnread"),
      });
    } catch (error) {
      console.error("Error marking items as unread:", error);
      toast({
        title: t("common.error"),
        description: t("errors.markAsUnreadFailed"),
        variant: "destructive",
      });
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
      toast({
        title: t("common.success"),
        description: t("items.addedToFavorites"),
      });
    } catch (error) {
      console.error("Error adding items to favorites:", error);
      toast({
        title: t("common.error"),
        description: t("errors.addToFavoritesFailed"),
        variant: "destructive",
      });
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
      toast({
        title: t("common.success"),
        description: t("items.addedToReadLater"),
      });
    } catch (error) {
      console.error("Error adding items to read later:", error);
      toast({
        title: t("common.error"),
        description: t("errors.addToReadLaterFailed"),
        variant: "destructive",
      });
    }
  }, [selectedItems, addInteraction, toast, t]);

  // Wrapper functions for useFeedService operations
  const refreshFeed = useCallback(async (feedId) => {
    try {
      await syncFeed(feedId);
      toast({
        title: t("common.success"),
        description: t("feeds.syncSuccess"),
      });
    } catch (error) {
      console.error("Error syncing feed:", error);
      toast({
        title: t("common.error"),
        description: t("errors.syncFailed"),
        variant: "destructive",
      });
    }
  }, [syncFeed, toast, t]);

  const toggleFavorite = useCallback(async (itemId, itemType = "rss") => {
    try {
      await addInteraction(itemId, "is_favorite", itemType);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: t("common.error"),
        description: t("errors.toggleFavoriteFailed"),
        variant: "destructive",
      });
    }
  }, [addInteraction, toast, t]);

  const toggleReadLater = useCallback(async (itemId, itemType = "rss") => {
    try {
      await addInteraction(itemId, "is_read_later", itemType);
    } catch (error) {
      console.error("Error toggling read later:", error);
      toast({
        title: t("common.error"),
        description: t("errors.toggleReadLaterFailed"),
        variant: "destructive",
      });
    }
  }, [addInteraction, toast, t]);

  const markItemRead = useCallback(async (itemId, itemType = "rss") => {
    try {
      await addInteraction(itemId, "is_read", itemType);
    } catch (error) {
      console.error("Error marking item as read:", error);
      toast({
        title: t("common.error"),
        description: t("errors.markAsReadFailed"),
        variant: "destructive",
      });
    }
  }, [addInteraction, toast, t]);

  return {
    // State
    selectedFeedId,
    viewMode,
    searchQuery,
    isBulkMode,
    selectedItems,

    // Filters
    filters,
    filterObject,

    // Data - useFeedService'ten geliyor
    feeds,
    items: feedItems,
    favorites,
    readLaterItems,

    // Loading states
    isLoading: isLoadingFeeds || isLoadingUser,
    isError: !!feedsError,

    // Actions
    setSelectedFeedId,
    setViewMode,
    setSearchQuery,
    refreshAll: refreshAllFeeds,
    refreshFeed,
    toggleFavorite,
    toggleReadLater,
    markItemRead,

    // Filter actions
    applyFilters,
    updateFilter,
    resetFilters,
    setFeedNameFilter,
    setFeedTypeFilter,
    setReadStatusFilter,
    setSortByFilter,

    // Bulk actions
    toggleBulkMode,
    toggleItemSelection,
    handleBulkMarkAsRead,
    handleBulkMarkAsUnread,
    handleBulkAddToFavorites,
    handleBulkAddToReadLater,
  };
}
