"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";

// Constants
const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 30; // 30 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useFeedService() {
  const { user } = useAuth();
  const userId = user?.id;
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch feeds
  const feedsQuery = useQuery({
    queryKey: ["feeds", userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // First get feeds
        const { data: feeds, error: feedsError } = await supabase
          .from("feeds")
          .select(
            `
            id,
            title,
            url,
            description,
            icon,
            type,
            category_id,
            last_fetched,
            created_at,
            user_id
          `
          )
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (feedsError) throw feedsError;

        // Then get categories
        const categoryIds = feeds
          .map((feed) => feed.category_id)
          .filter((id) => id !== null);

        let categories = [];
        if (categoryIds.length > 0) {
          const { data: categoriesData, error: categoriesError } =
            await supabase.from("categories").select("*").in("id", categoryIds);

          if (categoriesError) throw categoriesError;
          categories = categoriesData || [];
        }

        // Combine feeds with categories
        const feedsWithCategories = feeds.map((feed) => ({
          ...feed,
          category:
            categories.find((cat) => cat.id === feed.category_id) || null,
        }));

        return feedsWithCategories;
      } catch (error) {
        console.error("[useFeedService] Error fetching feeds:", error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });

  // Fetch RSS items with user interactions
  const itemsQuery = useQuery({
    queryKey: ["items", userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        // First get all RSS items for user's feeds
        const feedIds = feedsQuery.data?.map((feed) => feed.id) || [];
        if (feedIds.length === 0) return [];

        const { data: items, error: itemsError } = await supabase
          .from("rss_items")
          .select("*")
          .in("feed_id", feedIds)
          .order("published_at", { ascending: false });

        if (itemsError) throw itemsError;

        // Then get user interactions
        const { data: interactions, error: interactionsError } = await supabase
          .from("user_interaction")
          .select("*")
          .eq("user_id", userId)
          .in(
            "item_id",
            items.map((item) => item.id)
          );

        if (interactionsError) throw interactionsError;

        // Combine items with interactions
        return items.map((item) => ({
          ...item,
          is_read: interactions.some((i) => i.item_id === item.id && i.is_read),
          is_favorite: interactions.some(
            (i) => i.item_id === item.id && i.is_favorite
          ),
          is_read_later: interactions.some(
            (i) => i.item_id === item.id && i.is_read_later
          ),
        }));
      } catch (error) {
        console.error("[useFeedService] Error fetching items:", error);
        throw error;
      }
    },
    enabled: !!userId && !!feedsQuery.data,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });

  // Fetch favorites
  const favoritesQuery = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const { data, error } = await supabase
          .from("user_interaction")
          .select(
            `
            *,
            rss_items (
              id,
              title,
              description,
              url,
              published_at,
              feed_id,
              feed_title
            )
          `
          )
          .eq("user_id", userId)
          .eq("is_favorite", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("[useFeedService] Error fetching favorites:", error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });

  // Fetch read later items
  const readLaterQuery = useQuery({
    queryKey: ["read_later", userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const { data, error } = await supabase
          .from("user_interaction")
          .select(
            `
            *,
            rss_items (
              id,
              title,
              description,
              url,
              published_at,
              feed_id,
              feed_title
            )
          `
          )
          .eq("user_id", userId)
          .eq("is_read_later", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error(
          "[useFeedService] Error fetching read later items:",
          error
        );
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const feeds = feedsQuery.data || [];
    const items = itemsQuery.data || [];

    return {
      totalFeeds: feeds.length,
      totalItems: items.length,
      unreadItems: items.filter((item) => !item.is_read).length,
      favoriteItems: items.filter((item) => item.is_favorite).length,
      readLaterItems: items.filter((item) => item.is_read_later).length,
    };
  }, [feedsQuery.data, itemsQuery.data]);

  // Add feed mutation
  const addFeedMutation = useMutation({
    mutationFn: async (feedData) => {
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("feeds")
        .insert({
          ...feedData,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", userId]);
      toast({
        title: t("feeds.addSuccess"),
        description: t("feeds.addSuccessDescription"),
      });
    },
    onError: (error) => {
      console.error("[useFeedService] Error adding feed:", error);
      toast({
        title: t("feeds.addError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit feed mutation
  const editFeedMutation = useMutation({
    mutationFn: async ({ id, ...feedData }) => {
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("feeds")
        .update(feedData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", userId]);
      toast({
        title: t("feeds.editSuccess"),
        description: t("feeds.editSuccessDescription"),
      });
    },
    onError: (error) => {
      console.error("[useFeedService] Error editing feed:", error);
      toast({
        title: t("feeds.editError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete feed mutation
  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId) => {
      if (!userId) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("feeds")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", feedId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", userId]);
      toast({
        title: t("feeds.deleteSuccess"),
        description: t("feeds.deleteSuccessDescription"),
      });
    },
    onError: (error) => {
      console.error("[useFeedService] Error deleting feed:", error);
      toast({
        title: t("feeds.deleteError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle item interaction mutation
  const toggleItemInteractionMutation = useMutation({
    mutationFn: async ({ itemId, type, value }) => {
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_interaction")
        .upsert({
          user_id: userId,
          item_id: itemId,
          item_type: "rss",
          [type]: value,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["items", userId]);
      queryClient.invalidateQueries(["favorites", userId]);
      queryClient.invalidateQueries(["read_later", userId]);
    },
    onError: (error) => {
      console.error("[useFeedService] Error toggling item interaction:", error);
      toast({
        title: t("items.interactionError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Refresh all feeds
  const refreshAllFeeds = useCallback(async () => {
    if (!userId) return;
    try {
      // Implement feed refresh logic here
      await queryClient.invalidateQueries(["feeds", userId]);
      await queryClient.invalidateQueries(["items", userId]);
      toast({
        title: t("feeds.refreshSuccess"),
        description: t("feeds.refreshSuccessDescription"),
      });
    } catch (error) {
      console.error("[useFeedService] Error refreshing feeds:", error);
      toast({
        title: t("feeds.refreshError"),
        description: error.message,
        variant: "destructive",
      });
    }
  }, [userId, queryClient, toast, t]);

  // Sync single feed
  const syncFeed = useCallback(
    async (feedId) => {
      if (!userId) return;
      try {
        // Implement single feed sync logic here
        await queryClient.invalidateQueries(["feeds", userId]);
        await queryClient.invalidateQueries(["items", userId]);
        toast({
          title: t("feeds.syncSuccess"),
          description: t("feeds.syncSuccessDescription"),
        });
      } catch (error) {
        console.error("[useFeedService] Error syncing feed:", error);
        toast({
          title: t("feeds.syncError"),
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [userId, queryClient, toast, t]
  );

  return {
    // Data
    feeds: feedsQuery.data || [],
    items: itemsQuery.data || [],
    favorites: favoritesQuery.data || [],
    readLaterItems: readLaterQuery.data || [],
    stats,

    // Loading states
    isLoadingFeeds: feedsQuery.isLoading,
    isLoadingItems: itemsQuery.isLoading,
    isLoadingFavorites: favoritesQuery.isLoading,
    isLoadingReadLater: readLaterQuery.isLoading,
    isLoading:
      feedsQuery.isLoading ||
      itemsQuery.isLoading ||
      favoritesQuery.isLoading ||
      readLaterQuery.isLoading,

    // Errors
    feedsError: feedsQuery.error,
    itemsError: itemsQuery.error,
    favoritesError: favoritesQuery.error,
    readLaterError: readLaterQuery.error,
    addFeedError: addFeedMutation.error,
    editFeedError: editFeedMutation.error,
    deleteFeedError: deleteFeedMutation.error,

    // Mutations
    addFeed: addFeedMutation.mutate,
    editFeed: editFeedMutation.mutate,
    deleteFeed: deleteFeedMutation.mutate,
    toggleItemInteraction: toggleItemInteractionMutation.mutate,

    // Actions
    refreshAllFeeds,
    syncFeed,
  };
}
