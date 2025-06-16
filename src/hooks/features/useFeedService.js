"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/services/feedService";
import { youtubeService } from "@/lib/youtube/service";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";
import { FeedRepository } from "@/repositories/feedRepository";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";

/**
 * Central hook for interacting with the feed service.
 * Provides a single entry point for all feed operations.
 */
export function useFeedService() {
  const queryClient = useQueryClient();
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
  const { t } = useTranslation();
  const { toast } = useToast();

  // Cache settings
  const STALE_TIME = 1000 * 60 * 10; // 10 minutes
  const CACHE_TIME = 1000 * 60 * 60; // 1 hour
  const RETRY_DELAY = 1000 * 5; // 5 seconds
  const MAX_RETRIES = 3;
  const REFRESH_INTERVAL = 1000 * 60 * 5; // 5 minutes

  // State to track last refresh time
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch feed list - priority data
  const feedsQuery = useQuery({
    queryKey: ["feeds", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    initialData: [],
  });

  const {
    data: feeds = [],
    isLoading: isLoadingFeeds,
    isError: isErrorFeeds,
    error: feedsError,
  } = feedsQuery;

  const refetchFeeds = useCallback(async () => {
    if (!userId) return [];
    try {
      const result = await feedsQuery.refetch();
      return result;
    } catch (error) {
      console.error("Error refetching feeds:", error);
      return [];
    }
  }, [userId, feedsQuery]);

  // Fetch feed items - optimized query
  const itemsQuery = useQuery({
    queryKey: ["feed_items", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("feed_items")
        .select("*")
        .eq("user_id", userId)
        .order("published_at", { ascending: false })
        .limit(100); // Performance consideration limit

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    initialData: [],
  });

  const {
    data: items = [],
    isLoading: isLoadingItems,
    isError: isErrorItems,
    error: itemsError,
  } = itemsQuery;

  const refetchItems = useCallback(async () => {
    if (!userId) return [];
    try {
      const result = await itemsQuery.refetch();
      return result;
    } catch (error) {
      console.error("Error refetching items:", error);
      return [];
    }
  }, [userId, itemsQuery]);

  // Fetch favorites
  const favoritesQuery = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    initialData: [],
  });

  const {
    data: favorites = [],
    isLoading: isLoadingFavorites,
    error: favoritesError,
  } = favoritesQuery;

  const refetchFavorites = useCallback(async () => {
    if (!userId) return [];
    try {
      const result = await favoritesQuery.refetch();
      return result;
    } catch (error) {
      console.error("Error refetching favorites:", error);
      return [];
    }
  }, [userId, favoritesQuery]);

  // Fetch read later list
  const readLaterQuery = useQuery({
    queryKey: ["read_later", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("read_later")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    initialData: [],
  });

  const {
    data: readLaterItems = [],
    isLoading: isLoadingReadLater,
    error: readLaterError,
  } = readLaterQuery;

  const refetchReadLater = useCallback(async () => {
    if (!userId) return [];
    try {
      const result = await readLaterQuery.refetch();
      return result;
    } catch (error) {
      console.error("Error refetching read later:", error);
      return [];
    }
  }, [userId, readLaterQuery]);

  // Automatic refresh for timer
  useEffect(() => {
    if (!userId) return;

    const autoRefreshTimer = setInterval(() => {
      const timeSinceLastRefresh = new Date() - (lastRefreshTime || 0);
      if (lastRefreshTime && timeSinceLastRefresh > REFRESH_INTERVAL) {
        silentRefresh();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(autoRefreshTimer);
  }, [lastRefreshTime, userId]);

  // Silent refresh - refresh without notifying the user
  const silentRefresh = useCallback(async () => {
    if (!userId) return;

    try {
      const promises = [
        queryClient
          .refetchQueries({
            queryKey: ["feeds", userId],
            exact: true,
          })
          .catch((error) => {
            console.warn("Silent refresh error (feeds):", error);
            return null;
          }),
        queryClient
          .refetchQueries({
            queryKey: ["feed_items", userId],
            exact: false,
          })
          .catch((error) => {
            console.warn("Silent refresh error (items):", error);
            return null;
          }),
        queryClient
          .refetchQueries({
            queryKey: ["favorites", userId],
            exact: true,
          })
          .catch((error) => {
            console.warn("Silent refresh error (favorites):", error);
            return null;
          }),
        queryClient
          .refetchQueries({
            queryKey: ["read_later", userId],
            exact: true,
          })
          .catch((error) => {
            console.warn("Silent refresh error (read later):", error);
            return null;
          }),
      ];

      const results = await Promise.all(promises);
      const successfulResults = results.filter((result) => result !== null);

      if (successfulResults.length > 0) {
        setLastRefreshTime(new Date());
      }
    } catch (error) {
      console.warn("Silent refresh error:", error);
    }
  }, [userId, queryClient]);

  // Refresh all data - triggered by user
  const refreshAll = useCallback(async () => {
    if (!userId) return;

    try {
      const promises = [
        refetchFeeds().catch((error) => {
          console.error("Error refreshing feeds:", error);
          return null;
        }),
        refetchItems().catch((error) => {
          console.error("Error refreshing items:", error);
          return null;
        }),
        refetchFavorites().catch((error) => {
          console.error("Error refreshing favorites:", error);
          return null;
        }),
        refetchReadLater().catch((error) => {
          console.error("Error refreshing read later:", error);
          return null;
        }),
      ];

      const results = await Promise.all(promises);
      const successfulResults = results.filter((result) => result !== null);

      setLastRefreshTime(new Date());

      if (successfulResults.length === 0) {
        toast.error(t("errors.refreshFailed"));
      } else if (successfulResults.length < promises.length) {
        toast.warning(t("errors.partialRefreshFailed"));
      }

      return successfulResults;
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error(t("errors.refreshFailed"));
      return [];
    }
  }, [
    userId,
    refetchFeeds,
    refetchItems,
    refetchFavorites,
    refetchReadLater,
    t,
  ]);

  // Refresh a specific feed
  const refreshFeed = useCallback(
    async (feedId, userId, skipCache = false) => {
      if (!feedId || !userId) {
        console.error("refreshFeed: feedId and userId are required");
        return;
      }

      try {
        console.log(
          `Refreshing single feed: ${feedId}, skipCache: ${skipCache}`
        );

        // Fetch feed information from FeedService
        const feed = feeds?.find((f) => f.id === feedId);
        if (!feed) {
          console.warn(`Feed not found: ${feedId}`);
          throw new Error("Feed not found");
        }

        // Sync feed items (pass skipCache parameter)
        const result = await feedService.syncFeedItems(
          feedId,
          userId,
          feed.type,
          { skipCache }
        );

        console.log("Feed refresh result:", result);

        // Update cache
        queryClient.invalidateQueries({
          queryKey: ["feed_items", userId, feedId],
        });

        // Fetch items again
        await refetchItems();

        return result;
      } catch (error) {
        console.error(`Feed refresh error (ID: ${feedId}):`, error);
        toast.error(t("feeds.refreshError"));
        throw error;
      }
    },
    [feeds, userId, queryClient, refetchItems, t]
  );

  // Clean YouTube cache
  const cleanYoutubeCache = useCallback(async () => {
    try {
      await youtubeService.cleanCache();
      toast.success(t("youtube.cacheCleanSuccess"));
      return true;
    } catch (error) {
      console.error("YouTube cache cleaning error:", error);
      toast.error(t("youtube.cacheCleanError"));
      return false;
    }
  }, [t]);

  // Cache update helper function - more efficient
  const updateItemInCache = useCallback(
    (itemId, updates) => {
      // Update all feed items in cache
      queryClient.setQueriesData({ queryKey: ["feed_items"] }, (oldData) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
      });

      // Update favorites cache
      if ("is_favorite" in updates) {
        if (updates.is_favorite) {
          // Add to favorites
          queryClient.setQueriesData({ queryKey: ["favorites"] }, (oldData) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;

            // items is not an array or empty, do nothing
            if (!Array.isArray(items)) return oldData;

            const item = items.find((i) => i.id === itemId);
            if (!item) return oldData;

            const existingItem = oldData.find((i) => i.id === itemId);
            if (existingItem) return oldData;

            return [...oldData, { ...item, ...updates }];
          });
        } else {
          // Remove from favorites
          queryClient.setQueriesData({ queryKey: ["favorites"] }, (oldData) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            return oldData.filter((item) => item.id !== itemId);
          });
        }
      }

      // Update read later cache
      if ("is_read_later" in updates) {
        if (updates.is_read_later) {
          // Add to read later
          queryClient.setQueriesData(
            { queryKey: ["read_later"] },
            (oldData) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;

              // items is not an array or empty, do nothing
              if (!Array.isArray(items)) return oldData;

              const item = items.find((i) => i.id === itemId);
              if (!item) return oldData;

              const existingItem = oldData.find((i) => i.id === itemId);
              if (existingItem) return oldData;

              return [...oldData, { ...item, ...updates }];
            }
          );
        } else {
          // Remove from read later
          queryClient.setQueriesData(
            { queryKey: ["read_later"] },
            (oldData) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;
              return oldData.filter((item) => item.id !== itemId);
            }
          );
        }
      }
    },
    [queryClient, items]
  );

  // Toggle read status - Optimistic updates
  const toggleReadMutation = useMutation({
    mutationFn: ({ itemId, isRead, itemType = "rss" }) =>
      feedService.toggleItemReadStatus(userId, itemId, itemType, isRead),
    onMutate: async ({ itemId, isRead }) => {
      // Backup previous queries
      const previousData = queryClient.getQueryData([
        "feed_items",
        userId,
        feeds?.length,
      ]);

      // Optimistic update - Cache'i hemen güncelle
      updateItemInCache(itemId, { is_read: isRead });

      return { previousData };
    },
    onError: (error, { itemId, isRead }, context) => {
      // Hata durumunda önceki verileri geri yükle
      if (context?.previousData) {
        queryClient.setQueryData(
          ["feed_items", userId, feeds?.length],
          context.previousData
        );
      }
      console.error("Read status update error:", error);
      toast.error(t("errors.updateFailed"));
    },
    onSettled: () => {
      // İşlem tamamlandığında verileri bir kere daha yenile (opsiyonel)
      // queryClient.invalidateQueries(["feed_items"]);
    },
  });

  // Toggle favorite status - Optimistic updates
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ itemId, isFavorite, itemType = "rss" }) =>
      feedService.toggleItemFavoriteStatus(
        userId,
        itemId,
        itemType,
        isFavorite
      ),
    onMutate: async ({ itemId, isFavorite }) => {
      // Backup previous queries
      const previousItems = queryClient.getQueryData([
        "feed_items",
        userId,
        feeds?.length,
      ]);
      const previousFavorites = queryClient.getQueryData(["favorites", userId]);

      // Optimistic update - Cache'i hemen güncelle
      updateItemInCache(itemId, { is_favorite: isFavorite });

      return { previousItems, previousFavorites };
    },
    onError: (error, { itemId, isFavorite }, context) => {
      // Hata durumunda önceki verileri geri yükle
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["feed_items", userId, feeds?.length],
          context.previousItems
        );
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          ["favorites", userId],
          context.previousFavorites
        );
      }
      console.error("Favorite status update error:", error);
      toast.error(t("errors.updateFailed"));
    },
    onSettled: () => {
      // İşlem tamamlandığında (isteğe bağlı olarak) gerçek verileri alabilirsiniz
      // queryClient.invalidateQueries(["feed_items"]);
      // queryClient.invalidateQueries(["favorites"]);
    },
  });

  // Toggle read later status - Optimistic updates
  const toggleReadLaterMutation = useMutation({
    mutationFn: ({ itemId, isReadLater, itemType = "rss" }) =>
      feedService.toggleItemReadLaterStatus(
        userId,
        itemId,
        itemType,
        isReadLater
      ),
    onMutate: async ({ itemId, isReadLater }) => {
      // Backup previous queries
      const previousItems = queryClient.getQueryData([
        "feed_items",
        userId,
        feeds?.length,
      ]);
      const previousReadLater = queryClient.getQueryData([
        "read_later",
        userId,
      ]);

      // Optimistic update - Cache'i hemen güncelle
      updateItemInCache(itemId, { is_read_later: isReadLater });

      return { previousItems, previousReadLater };
    },
    onError: (error, { itemId, isReadLater }, context) => {
      // Hata durumunda önceki verileri geri yükle
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["feed_items", userId, feeds?.length],
          context.previousItems
        );
      }
      if (context?.previousReadLater) {
        queryClient.setQueryData(
          ["read_later", userId],
          context.previousReadLater
        );
      }
      console.error("Read later status update error:", error);
      toast.error(t("errors.updateFailed"));
    },
    onSettled: () => {
      // İşlem tamamlandığında (isteğe bağlı olarak) gerçek verileri alabilirsiniz
      // queryClient.invalidateQueries(["feed_items"]);
      // queryClient.invalidateQueries(["read_later"]);
    },
  });

  // Clean old items
  const cleanupMutation = useMutation({
    mutationFn: ({
      olderThanDays = 30,
      keepFavorites = true,
      keepReadLater = true,
    }) =>
      feedService.cleanUpOldItems(
        userId,
        olderThanDays,
        keepFavorites,
        keepReadLater
      ),
    onSuccess: (result) => {
      // Clean up old items and refresh data once
      queryClient.invalidateQueries(["feed_items", userId]);

      // Return results
      return result;
    },
  });

  // Helper functions
  const toggleRead = useCallback(
    (itemId, isRead, itemType = "rss") => {
      if (!userId) return;
      toggleReadMutation.mutate({ itemId, isRead, itemType });
    },
    [userId, toggleReadMutation]
  );

  const toggleFavorite = useCallback(
    (itemId, isFavorite, itemType = "rss") => {
      if (!userId) return;
      toggleFavoriteMutation.mutate({ itemId, isFavorite, itemType });
    },
    [userId, toggleFavoriteMutation]
  );

  const toggleReadLater = useCallback(
    (itemId, isReadLater, itemType = "rss") => {
      if (!userId) return;
      toggleReadLaterMutation.mutate({ itemId, isReadLater, itemType });
    },
    [userId, toggleReadLaterMutation]
  );

  // Feed add
  const addFeedMutation = useMutation({
    mutationFn: async (feedData) => {
      const { data, error } = await supabase
        .from("feeds")
        .insert([{ ...feedData, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", userId]);
    },
  });

  // Feed delete
  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId) => {
      const { error } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", userId]);
      queryClient.invalidateQueries(["feed_items", userId]);
    },
  });

  // Feed add
  const addFeed = useCallback(
    (url, type) => addFeedMutation.mutateAsync({ url, type }),
    [addFeedMutation]
  );

  // Feed delete
  const deleteFeed = useCallback(
    (feedId) => deleteFeedMutation.mutateAsync(feedId),
    [deleteFeedMutation]
  );

  // Clean old items
  const cleanupOldItems = useCallback(
    (options = {}) => {
      const {
        olderThanDays = 30,
        keepFavorites = true,
        keepReadLater = true,
      } = options;
      return cleanupMutation.mutateAsync({
        olderThanDays,
        keepFavorites,
        keepReadLater,
      });
    },
    [cleanupMutation]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    // Security check and error logging: items type
    if (items && !Array.isArray(items)) {
      console.warn(
        "useFeedService: items is not an array:",
        typeof items,
        items
      );
    }

    return {
      totalItems: Array.isArray(items) ? items.length : 0,
      unreadItems: Array.isArray(items)
        ? items.filter((item) => !item.is_read)?.length || 0
        : 0,
      favoriteItems: Array.isArray(favorites) ? favorites.length : 0,
      readLaterItems: Array.isArray(readLaterItems) ? readLaterItems.length : 0,
    };
  }, [items, favorites, readLaterItems]);

  // YouTube feed synchronization
  const syncYoutubeFeed = async (feedId) => {
    if (!userId) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    if (!feedId) {
      toast.error(t("errors.invalidFeedId"));
      return;
    }

    // Show loading notification
    const toastId = toast.loading(t("feeds.syncing"));
    console.log(`📡 Syncing YouTube feed: ${feedId}`);

    try {
      // First get feed information
      const { data: feed, error: feedError } = await supabase
        .from("feeds")
        .select("id, title, url, type")
        .eq("id", feedId)
        .eq("user_id", userId)
        .single();

      // Feed not found?
      if (feedError || !feed) {
        console.error("Could not get feed info:", feedError);
        toast.error(feedError?.message || t("errors.feedNotFound"), {
          id: toastId,
        });
        return;
      }

      // Error if not a YouTube feed
      if (feed.type !== "youtube") {
        toast.error(t("errors.notYoutubeFeed"), { id: toastId });
        return;
      }

      // Show intermediate notification
      toast.loading(t("feeds.syncingChannel", { title: feed.title }), {
        id: toastId,
      });

      const response = await fetch("/api/youtube/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedId,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Sync API error:", errorData);
        toast.error(`Sync error: ${errorData.error || "Unknown error"}`, {
          id: toastId,
        });
        return;
      }

      const data = await response.json();
      console.log("Sync result:", data);

      // Update notification
      if (data.added > 0) {
        toast.success(`${data.added} new videos added`, { id: toastId });
      } else if (data.error) {
        toast.error(`Error: ${data.error}`, { id: toastId });
      } else {
        toast.success("Sync completed, no new videos", {
          id: toastId,
        });
      }

      // Refresh queries
      await Promise.all([
        queryClient.invalidateQueries(["feeds"]),
        queryClient.invalidateQueries(["feed_items"]),
      ]);
    } catch (error) {
      console.error("Sync error:", error);

      // Error type-specific messages
      let errorMessage = "Sync encountered an error";

      if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage = "Connection error: Unable to reach server";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Timeout: Operation took too long";
      } else if (error.message?.includes("permission")) {
        errorMessage =
          "Permission error: You don't have permission to perform this operation";
      }

      toast.error(errorMessage, { id: toastId });
    }
  };

  return {
    // Data
    feeds,
    items,
    favorites,
    readLaterItems,

    // Loading states
    isLoading:
      isLoadingFeeds ||
      isLoadingItems ||
      isLoadingFavorites ||
      isLoadingReadLater,
    isLoadingFeeds,
    isLoadingItems,
    isLoadingFavorites,
    isLoadingReadLater,

    // Error states
    isError: isErrorFeeds || isErrorItems || favoritesError || readLaterError,
    error: feedsError || itemsError || favoritesError || readLaterError,

    // Refresh functions
    refreshAll,
    refreshFeed,
    silentRefresh,
    refetchFeeds,
    refetchItems,
    refetchFavorites,
    refetchReadLater,
    lastRefreshTime,

    // Interaction functions
    toggleRead,
    toggleFavorite,
    toggleReadLater,

    // Mutation states
    isTogglingRead: toggleReadMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isTogglingReadLater: toggleReadLaterMutation.isPending,

    // Cleanup functions
    cleanupOldItems,
    isCleaningUp: cleanupMutation.isLoading,

    // Feed add and delete functions
    addFeed,
    deleteFeed,

    // Statistics
    stats,

    // Feed service - now using feedService
    feedService: feedService,

    // Clean YouTube cache
    cleanYoutubeCache,

    // YouTube feed synchronization
    syncYoutubeFeed,
  };
}
