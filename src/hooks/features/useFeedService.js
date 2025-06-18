"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

// Constants
const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 30; // 30 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper to fetch all feed IDs for the current user
async function fetchUserFeedIds(userId) {
  const { data, error } = await supabase
    .from("feeds")
    .select("id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((feed) => feed.id);
}

/**
 * Fetches user interactions (e.g., favorites, read later) with joined item details.
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.table - Interaction table name (e.g., "rss_interactions")
 * @param {string} params.joinTable - Item table name (e.g., "rss_items")
 * @param {string} params.joinFields - Fields to select from the item table
 * @param {string} params.interactionField - Interaction field to filter (e.g., "is_favorite")
 * @param {Array} [params.feedIds] - (Optional) Only include items from these feed IDs
 * @param {Object} [params.extraFilters] - (Optional) Additional filters for the interaction table
 * @returns {Promise<Array>} Array of normalized interaction+item objects
 */
export async function fetchUserInteractionsWithItems({
  userId,
  table,
  joinTable,
  joinFields,
  interactionField,
  feedIds = null,
  extraFilters = {},
}) {
  // FeedId'leri opsiyonel olarak dışarıdan al veya otomatik çek
  let _feedIds = feedIds;
  if (!_feedIds) {
    const { data: feeds, error: feedsError } = await supabase
      .from("feeds")
      .select("id")
      .eq("user_id", userId);
    if (feedsError) throw feedsError;
    _feedIds = (feeds || []).map((feed) => feed.id);
  }
  if (!_feedIds || _feedIds.length === 0) return [];

  // Supabase query builder
  let query = supabase
    .from(table)
    .select(`*, ${joinTable} (${joinFields})`)
    .eq("user_id", userId)
    .eq(interactionField, true)
    .in("item_id", _feedIds)
    .order("created_at", { ascending: false });

  // Ek filtreler uygula
  Object.entries(extraFilters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data, error } = await query;
  if (error) throw error;

  // Normalize: interaction + item
  return (data || []).map((row) => ({
    ...row,
    item: row[joinTable],
  }));
}

// Helper to fetch all items with interactions, filtered by user's feeds
async function fetchAllItemsWithInteractions(userId) {
  const feedIds = await fetchUserFeedIds(userId);
  if (feedIds.length === 0) return [];
  const [rss, yt] = await Promise.all([
    supabase
      .from("rss_items")
      .select(
        "*, interactions:rss_interactions(is_read, is_favorite, is_read_later, user_id)"
      )
      .in("feed_id", feedIds)
      .order("published_at", { ascending: false }),
    supabase
      .from("youtube_items")
      .select(
        "*, interactions:youtube_interactions(is_read, is_favorite, is_read_later, user_id)"
      )
      .in("feed_id", feedIds)
      .order("published_at", { ascending: false }),
  ]);
  const process = (data, type) =>
    (data?.data || []).map((item) => {
      const interactions = Array.isArray(item.interactions)
        ? item.interactions
        : [];
      return {
        ...item,
        type,
        is_read: interactions.some((i) => i?.is_read && i?.user_id === userId),
        is_favorite: interactions.some(
          (i) => i?.is_favorite && i?.user_id === userId
        ),
        is_read_later: interactions.some(
          (i) => i?.is_read_later && i?.user_id === userId
        ),
      };
    });
  return [...process(rss, "rss"), ...process(yt, "youtube")].sort(
    (a, b) => new Date(b.published_at) - new Date(a.published_at)
  );
}

export function useFeedService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch feeds with their categories
  const feedsQuery = useQuery({
    queryKey: ["feeds", user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data: feeds, error: feedsError } = await supabase
          .from("feeds")
          .select(
            `
            *,
            category:categories(*)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (feedsError) {
          console.error("Error fetching feeds:", feedsError);
          throw feedsError;
        }

        // Ensure we return an array even if data is null
        return feeds || [];
      } catch (error) {
        console.error("Error in feeds query:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch all items (rss + youtube)
  const itemsQuery = useQuery({
    queryKey: ["items", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await fetchAllItemsWithInteractions(user.id);
      } catch (error) {
        console.error("Error in items query:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Favorites: filter itemsQuery.data for is_favorite
  const favoritesQuery = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user || !itemsQuery.data) return [];
      return (itemsQuery.data || []).filter((item) => item.is_favorite);
    },
    enabled: !!user && !itemsQuery.isLoading && !itemsQuery.isError,
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });
  console.log(favoritesQuery.data,"fav----")
  // Read later: filter itemsQuery.data for is_read_later
  const readLaterQuery = useQuery({
    queryKey: ["read_later", user?.id],
    queryFn: async () => {
      if (!user || !itemsQuery.data) return [];
      return (itemsQuery.data || []).filter((item) => item.is_read_later);
    },
    enabled: !!user && !itemsQuery.isLoading && !itemsQuery.isError,
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

  // Add interaction
  const addInteraction = async (itemId, type, itemType) => {
    if (!user) return;
    const table =
      itemType === "rss" ? "rss_interactions" : "youtube_interactions";
    try {
      const { error } = await supabase.from(table).insert({
        user_id: user.id,
        item_id: itemId,
        [type]: true,
      });
      if (error) throw error;
      await queryClient.invalidateQueries(["items", user.id]);
      await queryClient.invalidateQueries(["favorites", user.id]);
      await queryClient.invalidateQueries(["read_later", user.id]);
      toast({
        title: t("common.success"),
        description: t("interactions.addSuccess"),
      });
    } catch (error) {
      if (error.code === "23505") {
        // Kayıt zaten varsa, ilgili alanı update et
        const { error: updateError } = await supabase
          .from(table)
          .update({ [type]: true })
          .match({ user_id: user.id, item_id: itemId });
        if (updateError) {
          toast({
            title: t("common.error"),
            description: t("interactions.addError"),
            variant: "destructive",
          });
        } else {
          await queryClient.invalidateQueries(["items", user.id]);
          await queryClient.invalidateQueries(["favorites", user.id]);
          await queryClient.invalidateQueries(["read_later", user.id]);
          toast({
            title: t("common.info"),
            description: t("interactions.updatedExisting"),
            variant: "default",
          });
        }
      } else {
        console.error("Error adding interaction:", error);
        toast({
          title: t("common.error"),
          description: t("interactions.addError"),
          variant: "destructive",
        });
      }
    }
  };

  // Remove interaction: update instead of delete for safer state management
  const removeInteraction = async (itemId, type, itemType) => {
    if (!user) return;
    const table =
      itemType === "rss" ? "rss_interactions" : "youtube_interactions";
    try {
      const { error } = await supabase
        .from(table)
        .update({ [type]: false })
        .match({ user_id: user.id, item_id: itemId });
      if (error) throw error;
      await queryClient.invalidateQueries(["items", user.id]);
      await queryClient.invalidateQueries(["favorites", user.id]);
      await queryClient.invalidateQueries(["read_later", user.id]);
      toast({
        title: t("common.success"),
        description: t("interactions.removeSuccess"),
      });
    } catch (error) {
      console.error("Error removing interaction:", error);
      toast({
        title: t("common.error"),
        description: t("interactions.removeError"),
        variant: "destructive",
      });
    }
  };

  // Delete feed
  const deleteFeed = async (feedId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId)
        .eq("user_id", user.id);

      if (error) throw error;

      await queryClient.invalidateQueries(["feeds", user.id]);

      toast({
        title: t("common.success"),
        description: t("feeds.deleteSuccess"),
      });
    } catch (error) {
      console.error("Error deleting feed:", error);
      toast({
        title: t("common.error"),
        description: t("feeds.deleteError"),
        variant: "destructive",
      });
    }
  };

  // Add feed mutation
  const addFeedMutation = useMutation({
    mutationFn: async (feedData) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("feeds")
        .insert({
          ...feedData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", user.id]);
      toast({
        title: t("common.success"),
        description: t("feeds.addSuccess"),
      });
    },
    onError: (error) => {
      console.error("Error adding feed:", error);
      toast({
        title: t("common.error"),
        description: t("feeds.addError"),
        variant: "destructive",
      });
    },
  });

  // Edit feed mutation
  const editFeedMutation = useMutation({
    mutationFn: async ({ id, ...feedData }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("feeds")
        .update(feedData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feeds", user.id]);
      toast({
        title: t("common.success"),
        description: t("feeds.editSuccess"),
      });
    },
    onError: (error) => {
      console.error("Error editing feed:", error);
      toast({
        title: t("common.error"),
        description: t("feeds.editError"),
        variant: "destructive",
      });
    },
  });

  // Refresh all feeds
  const refreshAllFeeds = async () => {
    if (!user) return;
    try {
      // Implement feed refresh logic here
      await queryClient.invalidateQueries(["feeds", user.id]);
      await queryClient.invalidateQueries(["items", user.id]);
      toast({
        title: t("common.success"),
        description: t("feeds.refreshSuccess"),
      });
    } catch (error) {
      console.error("Error refreshing feeds:", error);
      toast({
        title: t("common.error"),
        description: t("feeds.refreshError"),
        variant: "destructive",
      });
    }
  };

  // Sync single feed
  const syncFeed = async (feedId) => {
    if (!user) return;
    try {
      // Implement single feed sync logic here
      await queryClient.invalidateQueries(["feeds", user.id]);
      await queryClient.invalidateQueries(["items", user.id]);
      toast({
        title: t("common.success"),
        description: t("feeds.syncSuccess"),
      });
    } catch (error) {
      console.error("Error syncing feed:", error);
      toast({
        title: t("common.error"),
        description: t("feeds.syncError"),
        variant: "destructive",
      });
    }
  };

  return {
    feeds: feedsQuery.data || [],
    items: itemsQuery.data || [],
    favorites: favoritesQuery.data || [],
    readLaterItems: readLaterQuery.data || [],
    stats,
    isLoading:
      feedsQuery.isLoading ||
      itemsQuery.isLoading ||
      favoritesQuery.isLoading ||
      readLaterQuery.isLoading,
    error: feedsQuery.error || itemsQuery.error,

    // Mutations
    addFeed: addFeedMutation.mutate,
    editFeed: editFeedMutation.mutate,
    deleteFeed,

    // Interactions
    addInteraction,
    removeInteraction,

    // Actions
    refreshAllFeeds,
    syncFeed,

    // Invalidate queries
    invalidateFeedsQuery: () =>
      queryClient.invalidateQueries(["feeds", user?.id]),

    // User
    user,
  };
}
