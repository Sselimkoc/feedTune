"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/services/feedService";
import { youtubeService } from "@/lib/youtube/service";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";
import { FeedRepository } from "@/repositories/feedRepository";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";

/**
 * Central hook for interacting with the feed service.
 * Provides a single entry point for all feed operations.
 */
export function useFeedService() {
  const queryClient = useQueryClient();
  const { user, isLoading: isLoadingUser } = useAuth();
  const userId = user?.id;
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

      await Promise.all(promises);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error during silent refresh:", error);
    }
  }, [queryClient, userId]);

  // Add Feed functionality
  const addFeedMutation = useMutation({
    mutationFn: async ({ url, type }) => {
      if (!userId) throw new Error(t("errors.authRequired"));
      if (!url) throw new Error(t("errors.urlRequired"));
      if (!type) throw new Error(t("errors.typeRequired"));

      const existingFeed = await feedService.getFeedByUrl(userId, url);
      if (existingFeed) throw new Error(t("errors.feedAlreadyExists"));

      let feedData;
      if (type === "rss") {
        feedData = await feedService.addRssFeed(url, userId);
      } else if (type === "youtube") {
        feedData = await feedService.addYoutubeFeed(url, userId);
      } else {
        throw new Error(t("errors.invalidFeedType"));
      }
      return feedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", userId]);
      queryClient.invalidateQueries(["feed_items", userId]);
      toast({
        title: t("common.success"),
        description: t("feeds.addSuccess"),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error adding feed:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("feeds.addError"),
        variant: "destructive",
      });
    },
  });

  const addFeed = useCallback(
    async (url, type) => {
      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return;
      }
      await addFeedMutation.mutateAsync({ url, type });
    },
    [userId, addFeedMutation, toast, t]
  );

  // Edit Feed functionality
  const editFeedMutation = useMutation({
    mutationFn: async ({ feedId, updates }) => {
      if (!userId) throw new Error(t("errors.authRequired"));
      if (!feedId) throw new Error(t("errors.feedNotFound"));

      const { data, error } = await supabase
        .from("feeds")
        .update(updates)
        .eq("id", feedId)
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", userId]);
      toast({
        title: t("common.success"),
        description: t("feeds.editSuccess"),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error editing feed:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("feeds.editError"),
        variant: "destructive",
      });
    },
  });

  const editFeed = useCallback(
    async (feedId, updates) => {
      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return;
      }
      await editFeedMutation.mutateAsync({ feedId, updates });
    },
    [userId, editFeedMutation, toast, t]
  );

  // Delete Feed functionality
  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId) => {
      if (!userId) throw new Error(t("errors.authRequired"));
      if (!feedId) throw new Error(t("errors.feedNotFound"));

      const { error } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", userId]);
      queryClient.invalidateQueries(["feed_items", userId]);
      toast({
        title: t("common.success"),
        description: t("feeds.deleteSuccess"),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error deleting feed:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("feeds.deleteError"),
        variant: "destructive",
      });
    },
  });

  const deleteFeed = useCallback(
    async (feedId) => {
      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return;
      }
      await deleteFeedMutation.mutateAsync(feedId);
    },
    [userId, deleteFeedMutation, toast, t]
  );

  // Mark Item as Read/Unread functionality
  const markItemReadMutation = useMutation({
    mutationFn: async ({ itemId, isRead }) => {
      if (!userId) throw new Error(t("errors.authRequired"));
      if (!itemId) throw new Error(t("errors.itemNotFound"));

      const tableName = isRead ? "read_items" : "feed_items";
      const method = isRead ? "insert" : "delete";
      const column = isRead ? "read_at" : "id";
      const value = isRead ? new Date().toISOString() : itemId;

      let error;
      if (method === "insert") {
        ({ error } = await supabase.from(tableName).upsert({
          item_id: itemId,
          user_id: userId,
          read_at: value,
        }));
      } else {
        ({ error } = await supabase
          .from(tableName)
          .delete()
          .eq(column, value)
          .eq("user_id", userId));
      }

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["feed_items", userId]);
      queryClient.invalidateQueries(["read_later", userId]);
      queryClient.invalidateQueries(["favorites", userId]);

      toast({
        title: t("common.success"),
        description: variables.isRead
          ? t("feeds.markAsReadSuccess")
          : t("feeds.markAsUnreadSuccess"),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error marking item as read/unread:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("feeds.markItemReadError"),
        variant: "destructive",
      });
    },
  });

  const markItemRead = useCallback(
    async (itemId, isRead) => {
      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return;
      }
      await markItemReadMutation.mutateAsync({ itemId, isRead });
    },
    [userId, markItemReadMutation, toast, t]
  );

  // Toggle Favorite functionality
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ itemId, isFavorite }) => {
      if (!userId) throw new Error(t("errors.authRequired"));
      if (!itemId) throw new Error(t("errors.itemNotFound"));

      const tableName = "favorites";
      const method = isFavorite ? "insert" : "delete";
      const column = "item_id";
      const value = itemId;

      let error;
      if (method === "insert") {
        ({ error } = await supabase.from(tableName).upsert({
          item_id: itemId,
          user_id: userId,
        }));
      } else {
        ({ error } = await supabase
          .from(tableName)
          .delete()
          .eq(column, value)
          .eq("user_id", userId));
      }

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["favorites", userId]);
      queryClient.invalidateQueries(["feed_items", userId]);

      toast({
        title: t("common.success"),
        description: variables.isFavorite
          ? t("feeds.addToFavoritesSuccess")
          : t("feeds.removeFromFavoritesSuccess"),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error toggling favorite:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("feeds.toggleFavoriteError"),
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = useCallback(
    async (itemId, isFavorite) => {
      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return;
      }
      await toggleFavoriteMutation.mutateAsync({ itemId, isFavorite });
    },
    [userId, toggleFavoriteMutation, toast, t]
  );

  // Toggle Read Later functionality
  const toggleReadLaterMutation = useMutation({
    mutationFn: async ({ itemId, isReadLater }) => {
      if (!userId) throw new Error(t("errors.authRequired"));
      if (!itemId) throw new Error(t("errors.itemNotFound"));

      const tableName = "read_later";
      const method = isReadLater ? "insert" : "delete";
      const column = "item_id";
      const value = itemId;

      let error;
      if (method === "insert") {
        ({ error } = await supabase.from(tableName).upsert({
          item_id: itemId,
          user_id: userId,
        }));
      } else {
        ({ error } = await supabase
          .from(tableName)
          .delete()
          .eq(column, value)
          .eq("user_id", userId));
      }

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["read_later", userId]);
      queryClient.invalidateQueries(["feed_items", userId]);

      toast({
        title: t("common.success"),
        description: variables.isReadLater
          ? t("feeds.addToReadLaterSuccess")
          : t("feeds.removeFromReadLaterSuccess"),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error toggling read later:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("feeds.toggleReadLaterError"),
        variant: "destructive",
      });
    },
  });

  const toggleReadLater = useCallback(
    async (itemId, isReadLater) => {
      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return;
      }
      await toggleReadLaterMutation.mutateAsync({ itemId, isReadLater });
    },
    [userId, toggleReadLaterMutation, toast, t]
  );

  // Refresh All Feeds functionality
  const refreshAllFeedsMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error(t("errors.authRequired"));

      setIsLoading(true); // Start general loading
      const toastId = toast({
        title: t("feeds.refreshing"),
        description: t("feeds.refreshingDescription"),
        duration: 999999, // Long duration for loading toast
      });

      try {
        await feedService.refreshAllFeeds(userId);
        toast.dismiss(toastId);
        toast({
          title: t("common.success"),
          description: t("feeds.refreshSuccess"),
          variant: "default",
        });
        queryClient.invalidateQueries(["feeds", userId]);
        queryClient.invalidateQueries(["feed_items", userId]);
        queryClient.invalidateQueries(["favorites", userId]);
        queryClient.invalidateQueries(["read_later", userId]);
        setLastRefreshTime(new Date());
        return { success: true };
      } catch (error) {
        console.error("Error refreshing all feeds:", error);
        toast.dismiss(toastId);
        toast({
          title: t("common.error"),
          description: error.message || t("feeds.refreshError"),
          variant: "destructive",
        });
        return { success: false, error };
      } finally {
        setIsLoading(false); // End general loading
      }
    },
  });

  const refreshAllFeeds = useCallback(async () => {
    if (!userId) {
      toast({
        title: t("errors.authRequired"),
        description: t("errors.pleaseLoginToAddFeeds"),
        variant: "destructive",
      });
      return;
    }
    await refreshAllFeedsMutation.mutateAsync();
  }, [userId, refreshAllFeedsMutation, toast, t]);

  // Sync Feed functionality
  const syncFeedMutation = useMutation({
    mutationFn: async ({ feedId, type }) => {
      if (!userId) throw new Error(t("errors.authRequired"));
      if (!feedId) throw new Error(t("errors.feedNotFound"));
      if (!type) throw new Error(t("errors.typeRequired"));

      setIsLoading(true);
      const toastId = toast({
        title: t("feeds.syncing"),
        description: t("feeds.syncingDescription"),
        duration: 999999,
      });

      try {
        if (type === "rss") {
          await feedService.syncRssFeed(feedId, userId);
        } else if (type === "youtube") {
          await feedService.syncYoutubeFeed(feedId, userId);
        } else {
          throw new Error(t("errors.invalidFeedType"));
        }

        toast.dismiss(toastId);
        toast({
          title: t("common.success"),
          description: t("feeds.syncSuccess"),
          variant: "default",
        });

        queryClient.invalidateQueries(["feeds", userId]);
        queryClient.invalidateQueries(["feed_items", userId]);
        return { success: true };
      } catch (error) {
        console.error(`Error syncing ${type} feed:`, error);
        toast.dismiss(toastId);
        toast({
          title: t("common.error"),
          description: error.message || t("feeds.syncError"),
          variant: "destructive",
        });
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
  });

  const syncFeed = useCallback(
    async (feedId, type) => {
      if (!userId) {
        toast({
          title: t("errors.authRequired"),
          description: t("errors.pleaseLoginToAddFeeds"),
          variant: "destructive",
        });
        return;
      }
      await syncFeedMutation.mutateAsync({ feedId, type });
    },
    [userId, syncFeedMutation, toast, t]
  );

  return useMemo(
    () => ({
      // Data
      feeds,
      items,
      favorites,
      readLaterItems,

      // Loading states
      isLoadingFeeds,
      isLoadingItems,
      isLoadingFavorites,
      isLoadingReadLater,
      isLoadingMutations:
        isLoading ||
        addFeedMutation.isLoading ||
        editFeedMutation.isLoading ||
        deleteFeedMutation.isLoading ||
        markItemReadMutation.isLoading ||
        toggleFavoriteMutation.isLoading ||
        toggleReadLaterMutation.isLoading ||
        refreshAllFeedsMutation.isLoading ||
        syncFeedMutation.isLoading,
      isErrorFeeds,
      isErrorItems,

      // Errors
      feedsError,
      itemsError,
      favoritesError,
      readLaterError,
      addFeedError: addFeedMutation.error,
      editFeedError: editFeedMutation.error,
      deleteFeedError: deleteFeedMutation.error,
      markItemReadError: markItemReadMutation.error,
      toggleFavoriteError: toggleFavoriteMutation.error,
      toggleReadLaterError: toggleReadLaterMutation.error,
      refreshAllFeedsError: refreshAllFeedsMutation.error,
      syncFeedError: syncFeedMutation.error,

      // Actions
      refetchFeeds,
      refetchItems,
      refetchFavorites,
      refetchReadLater,
      addFeed,
      editFeed,
      deleteFeed,
      markItemRead,
      toggleFavorite,
      toggleReadLater,
      refreshAllFeeds,
      syncFeed,
    }),
    [
      feeds,
      items,
      favorites,
      readLaterItems,
      isLoadingFeeds,
      isLoadingItems,
      isLoadingFavorites,
      isLoadingReadLater,
      isLoading,
      addFeedMutation.isLoading,
      editFeedMutation.isLoading,
      deleteFeedMutation.isLoading,
      markItemReadMutation.isLoading,
      toggleFavoriteMutation.isLoading,
      toggleReadLaterMutation.isLoading,
      refreshAllFeedsMutation.isLoading,
      syncFeedMutation.isLoading,
      isErrorFeeds,
      isErrorItems,
      feedsError,
      itemsError,
      favoritesError,
      readLaterError,
      addFeedMutation.error,
      editFeedMutation.error,
      deleteFeedMutation.error,
      markItemReadMutation.error,
      toggleFavoriteMutation.error,
      toggleReadLaterMutation.error,
      refreshAllFeedsMutation.error,
      syncFeedMutation.error,
      refetchFeeds,
      refetchItems,
      refetchFavorites,
      refetchReadLater,
      addFeed,
      editFeed,
      deleteFeed,
      markItemRead,
      toggleFavorite,
      toggleReadLater,
      refreshAllFeeds,
      syncFeed,
    ]
  );
}
