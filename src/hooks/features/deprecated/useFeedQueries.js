"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/services/feedService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Cache settings
const SHORT_STALE_TIME = 1000 * 60 * 2; // 2 minutes
const LONG_CACHE_TIME = 1000 * 60 * 60; // 60 minutes

/**
 * React Query ile feed verilerini yöneten hook.
  * Servis katmanı ile iletişim kurar.
 */
export function useFeedQueries() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const userId = user?.id;

  // Feeds query
  const feedsQuery = useQuery({
    queryKey: ["feeds", userId],
    queryFn: () => feedService.getFeeds(userId),
    enabled: !!userId,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Feed items query
  const feedItemsQuery = useQuery({
    queryKey: ["feedItems", feedsQuery.data?.map((feed) => feed.id)],
    queryFn: () =>
      feedService.getFeedItems(feedsQuery.data?.map((feed) => feed.id)),
    enabled: !!feedsQuery.data?.length,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    select: (data) => {
      if (!data || !feedsQuery.data) return [];
      const { items: limitedItems } = feedService.limitItemsPerFeed(
        feedsQuery.data,
        data,
        10
      );
      return limitedItems;
    },
  });

  // Favorites query
  const favoritesQuery = useQuery({
    queryKey: ["favorites", userId],
    queryFn: () => feedService.getFavorites(userId),
    enabled: !!userId,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME,
  });

  // Read Later query
  const readLaterQuery = useQuery({
    queryKey: ["readLater", userId],
    queryFn: () => feedService.getReadLaterItems(userId),
    enabled: !!userId,
    staleTime: SHORT_STALE_TIME,
    gcTime: LONG_CACHE_TIME,
  });

  // Helper function to manually update the cache
  const updateQueryCache = (itemId, updates) => {
    // Get all relevant queries
    const feedItemsData = queryClient.getQueryData(["feedItems"]);
    const favoritesData = queryClient.getQueryData(["favorites"]);
    const readLaterData = queryClient.getQueryData(["readLater"]);

    // Find the updated item
    const updatedItem = feedItemsData?.find((item) => item.id === itemId);

    // Update feedItems cache
    if (feedItemsData) {
      queryClient.setQueryData(["feedItems"], (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
      });
    }

    // Update favorites cache (if is_favorite changed)
    if ("is_favorite" in updates && favoritesData) {
      queryClient.setQueryData(["favorites"], (old) => {
        if (!old) return old;

        if (updates.is_favorite) {
          // Item added to favorites and not already in the list
          const itemExists = old.some((item) => item.id === itemId);
          if (!itemExists && updatedItem) {
            return [...old, { ...updatedItem, ...updates }];
          } else {
            // If already in the list, update only the status
            return old.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            );
          }
        } else {
          // Item removed from favorites, remove from the list
          return old.filter((item) => item.id !== itemId);
        }
      });
    }

    // Update readLater cache (if is_read_later changed)
    if ("is_read_later" in updates && readLaterData) {
      queryClient.setQueryData(["readLater"], (old) => {
        if (!old) return old;

        if (updates.is_read_later) {
          // Item added to readLater and not already in the list
          const itemExists = old.some((item) => item.id === itemId);
          if (!itemExists && updatedItem) {
            return [...old, { ...updatedItem, ...updates }];
          } else {
            // If already in the list, update only the status
            return old.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            );
          }
        } else {
          // Item removed from readLater, remove from the list
          return old.filter((item) => item.id !== itemId);
        }
      });
    }

    // Check and log cache status after update
    console.log("Cache update completed:", {
      itemId,
      updates,
      feedItemsCacheSize: queryClient.getQueryData(["feedItems"])?.length || 0,
      favoritesCacheSize: queryClient.getQueryData(["favorites"])?.length || 0,
      readLaterCacheSize: queryClient.getQueryData(["readLater"])?.length || 0,
    });
  };

  // Toggle Read Mutation
  const toggleReadMutation = useMutation({
    mutationFn: async ({ itemId, isRead, skipInvalidation = false }) => {
      if (!userId) {
        toast.error(t("errors.needToBeLoggedIn"));
        throw new Error("User not logged in");
      }
      return feedService.toggleItemReadStatus(userId, itemId, isRead);
    },
    onMutate: async ({ itemId, isRead, skipInvalidation = false }) => {
      await queryClient.cancelQueries({ queryKey: ["feedItems"] });
      const previousItems = queryClient.getQueryData(["feedItems"]);
      updateQueryCache(itemId, { is_read: isRead });

      // Return previous data (for rollback in case of error)
      return { previousItems, skipInvalidation };
    },
    onSuccess: (data, { skipInvalidation }) => {
      // If skipInvalidation is true, refetch the data
      if (!skipInvalidation) {
        queryClient.invalidateQueries({ queryKey: ["feedItems"] });
      }
      // Show toast notification
      toast.success(
        data.is_read
          ? t("feeds.itemMarkedAsRead")
          : t("feeds.itemMarkedAsUnread"),
        { duration: 2000 }
      );
    },
    onError: (error, { itemId, isRead }, context) => {
      // Rollback to previous state if error occurs
      if (context?.previousItems) {
        queryClient.setQueryData(["feedItems"], context.previousItems);
      }
      console.error("Toggle read error:", error);
      toast.error(t("errors.errorUpdatingItemStatus"));
    },
  });

  // Toggle Favorite Mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ itemId, isFavorite, skipInvalidation = false }) => {
      if (!userId) {
        toast.error(t("errors.needToBeLoggedIn"));
        throw new Error("User not logged in");
      }
      return feedService.toggleItemFavoriteStatus(userId, itemId, isFavorite);
    },
    onMutate: async ({ itemId, isFavorite, skipInvalidation = false }) => {
      // Save previous queries
      await queryClient.cancelQueries({ queryKey: ["feedItems"] });
      await queryClient.cancelQueries({ queryKey: ["favorites"] });

      // Save current data
      const previousItems = queryClient.getQueryData(["feedItems"]);
      const previousFavorites = queryClient.getQueryData(["favorites"]);

      // Optimistic update
      updateQueryCache(itemId, { is_favorite: isFavorite });

      // Return previous data (for rollback in case of error)
      return { previousItems, previousFavorites, skipInvalidation };
    },
    onSuccess: (data, { skipInvalidation }) => {
      // If skipInvalidation is true, refetch the data
      if (!skipInvalidation) {
        queryClient.invalidateQueries({ queryKey: ["feedItems"] });
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
      }
      // Show toast notification
      toast.success(
        data.is_favorite
          ? t("feeds.itemAddedToFavorites")
          : t("feeds.itemRemovedFromFavorites"),
        { duration: 2000 }
      );
    },
    onError: (error, { itemId, isFavorite }, context) => {
      // Rollback to previous state if error occurs
      if (context?.previousItems) {
        queryClient.setQueryData(["feedItems"], context.previousItems);
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(["favorites"], context.previousFavorites);
      }
      console.error("Toggle favorite error:", error);
      toast.error(t("errors.errorUpdatingFavoriteStatus"));
    },
  });

  // Toggle Read Later Mutation
  const toggleReadLaterMutation = useMutation({
    mutationFn: async ({ itemId, isReadLater, skipInvalidation = false }) => {
      if (!userId) {
        toast.error(t("errors.needToBeLoggedIn"));
        throw new Error("User not logged in");
      }
      return feedService.toggleItemReadLaterStatus(userId, itemId, isReadLater);
    },
    onMutate: async ({ itemId, isReadLater, skipInvalidation = false }) => {
      // Save previous queries
      await queryClient.cancelQueries({ queryKey: ["feedItems"] });
      await queryClient.cancelQueries({ queryKey: ["readLater"] });

      // Save current data
      const previousItems = queryClient.getQueryData(["feedItems"]);
      const previousReadLater = queryClient.getQueryData(["readLater"]);

      // Optimistic update
      updateQueryCache(itemId, { is_read_later: isReadLater });

      // Return previous data (for rollback in case of error)
      return { previousItems, previousReadLater, skipInvalidation };
    },
    onSuccess: (data, { skipInvalidation }) => {
      // If skipInvalidation is true, refetch the data
      if (!skipInvalidation) {
        queryClient.invalidateQueries({ queryKey: ["feedItems"] });
        queryClient.invalidateQueries({ queryKey: ["readLater"] });
      }
      // Show toast notification
      toast.success(
        data.is_read_later
          ? t("feeds.itemAddedToReadLater")
          : t("feeds.itemRemovedFromReadLater"),
        { duration: 2000 }
      );
    },
    onError: (error, { itemId, isReadLater }, context) => {
      // Rollback to previous state if error occurs
      if (context?.previousItems) {
        queryClient.setQueryData(["feedItems"], context.previousItems);
      }
      if (context?.previousReadLater) {
        queryClient.setQueryData(["readLater"], context.previousReadLater);
      }
      console.error("Toggle read later error:", error);
      toast.error(t("errors.errorUpdatingReadLaterStatus"));
    },
  });

  // Refresh all data function
  const refreshAllData = async () => {
    console.log("All data is being refreshed...");
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feeds"] }),
        queryClient.invalidateQueries({ queryKey: ["feedItems"] }),
        queryClient.invalidateQueries({ queryKey: ["favorites"] }),
        queryClient.invalidateQueries({ queryKey: ["readLater"] }),
      ]);
      toast.success(t("feeds.refreshed"));
      return "Data refreshed";
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error(t("errors.refreshFailed"));
      throw error;
    }
  };

  return {
    // Queries
    feeds: feedsQuery.data || [],
    items: feedItemsQuery.data || [],
    favorites: favoritesQuery.data || [],
    readLater: readLaterQuery.data || [],

    // Loading states
    isLoadingFeeds: feedsQuery.isLoading,
    isLoadingItems: feedItemsQuery.isLoading,
    isLoadingFavorites: favoritesQuery.isLoading,
    isLoadingReadLater: readLaterQuery.isLoading,

    // General loading state
    isLoading: feedsQuery.isLoading || feedItemsQuery.isLoading,

    // Error states
    isError: feedsQuery.isError || feedItemsQuery.isError,
    error: feedsQuery.error || feedItemsQuery.error,

    // Mutations
    toggleRead: (itemId, isRead, skipInvalidation = false) =>
      toggleReadMutation.mutate({ itemId, isRead, skipInvalidation }),
    toggleFavorite: (itemId, isFavorite, skipInvalidation = false) =>
      toggleFavoriteMutation.mutate({ itemId, isFavorite, skipInvalidation }),
    toggleReadLater: (itemId, isReadLater, skipInvalidation = false) =>
      toggleReadLaterMutation.mutate({ itemId, isReadLater, skipInvalidation }),

    // Mutation states
    isTogglingRead: toggleReadMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isTogglingReadLater: toggleReadLaterMutation.isPending,

    // Refresh function
    refreshData: refreshAllData,
  };
}
