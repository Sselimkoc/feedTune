"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/components/core/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { feedApi } from "@/lib/api/feedApi";
import {
  getFeedsQueryConfig,
  getItemsQueryConfig,
  getFavoritesQueryConfig,
  getReadLaterQueryConfig,
} from "./feed-screen/useQueryConfig";

function normalizeUrl(url) {
  try {
    if (!url) return "";
    let u = url.trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    return new URL(u).toString();
  } catch {
    throw new Error("Invalid URL format");
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useFeedService() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const LAST_SYNC_KEY = "feedtune-last-auto-sync";
  const SYNC_COOLDOWN = 30 * 60 * 1000; // 30 minutes

  // ============================================================================
  // QUERIES
  // ============================================================================

  const feedsQuery = useQuery({
    ...getFeedsQueryConfig(user?.id, isAuthenticated),
    queryFn: async () => {
      try {
        return await feedApi.fetchFeeds();
      } catch {
        return [];
      }
    },
  });

  const itemsQuery = useQuery({
    ...getItemsQueryConfig(user?.id, isAuthenticated),
    queryFn: async () => {
      try {
        return await feedApi.fetchItems();
      } catch {
        return [];
      }
    },
  });

  const favoritesQuery = useQuery({
    ...getFavoritesQueryConfig(user?.id, isAuthenticated),
    queryFn: async () => {
      try {
        return await feedApi.fetchFavorites();
      } catch {
        return [];
      }
    },
  });

  const readLaterQuery = useQuery({
    ...getReadLaterQueryConfig(user?.id, isAuthenticated),
    queryFn: async () => {
      try {
        return await feedApi.fetchReadLater();
      } catch {
        return [];
      }
    },
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const addFeedMutation = useMutation({
    mutationFn: async ({ url, type, ...extraData }) => {
      if (!user) throw new Error("User not authenticated");

      const normalizedUrl = normalizeUrl(url);
      const feedType =
        type ||
        (normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be")
          ? "youtube"
          : "rss");

      if (feedType === "youtube") {
        // Resolve channel ID via channel-search, then add via server route
        const searchRes = await fetch("/api/youtube/channel-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalizedUrl }),
        });
        if (!searchRes.ok) throw new Error("Failed to find YouTube channel");
        const searchData = await searchRes.json();
        if (!searchData.channel?.id) throw new Error("Channel not found");

        const addRes = await fetch("/api/youtube/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: searchData.channel.id,
            title: searchData.channel.title,
            description: searchData.channel.description,
            thumbnail: searchData.channel.thumbnail,
          }),
        });
        if (!addRes.ok) {
          const err = await addRes.json();
          throw new Error(err.error || "Failed to add YouTube channel");
        }
        return (await addRes.json()).feed;
      } else {
        const addRes = await fetch("/api/feeds/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalizedUrl, type: feedType, extraData }),
        });
        if (!addRes.ok) {
          const err = await addRes.json();
          throw new Error(err.error || "Failed to add RSS feed");
        }
        return (await addRes.json()).feed;
      }
    },
    onSuccess: async (feed) => {
      if (feed?.type === "rss" && feed?.id) {
        try {
          await fetch("/api/feeds/sync-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedId: feed.id }),
          });
        } catch (e) {
          console.error("[addFeed] sync-items error:", e);
        }
      }
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["feeds", user?.id], exact: true }),
        queryClient.refetchQueries({ queryKey: ["items", user?.id], exact: true }),
        queryClient.refetchQueries({ queryKey: ["feedsSummary", user?.id], exact: true }),
      ]);
      toast({ title: t("common.success"), description: t("feeds.addSuccess") });
    },
    onError: (error) => {
      let errorMessage = error.message || t("feeds.addError");
      if (error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
        errorMessage = t("feeds.addError.duplicate") || "This feed is already in your collection.";
      }
      toast({ title: t("common.error"), description: errorMessage, variant: "destructive" });
    },
  });

  const editFeedMutation = useMutation({
    mutationFn: async ({ id, ...feedData }) => {
      if (!user) throw new Error("User not authenticated");
      const res = await fetch("/api/feeds/edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...feedData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update feed");
      }
      return (await res.json()).feed;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["feeds", user?.id], exact: true });
      toast({ title: t("common.success"), description: t("feeds.editSuccess") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("feeds.editError"), variant: "destructive" });
    },
  });

  // ============================================================================
  // INTERACTIONS
  // ============================================================================

  // Apply an optimistic update to cached items/favorites/read_later for an interaction flag
  const applyOptimisticInteraction = (itemId, flag, value) => {
    queryClient.setQueryData(["items", user.id], (old) =>
      old?.map((item) => (item.id === itemId ? { ...item, [flag]: value } : item))
    );
    if (flag === "is_favorite") {
      queryClient.setQueryData(["favorites", user.id], (old) =>
        value ? old : old?.filter((item) => item.id !== itemId)
      );
    }
    if (flag === "is_read_later") {
      queryClient.setQueryData(["read_later", user.id], (old) =>
        value ? old : old?.filter((item) => item.id !== itemId)
      );
    }
  };

  const addInteraction = async (itemId, type, itemType) => {
    if (!user) return;
    applyOptimisticInteraction(itemId, type, true);
    try {
      const response = await fetch("/api/interactions/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type, itemType }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add interaction");
      }
      toast({ title: t("common.success"), description: t("interactions.addSuccess") });
    } catch {
      applyOptimisticInteraction(itemId, type, false);
      toast({ title: t("common.error"), description: t("interactions.addError"), variant: "destructive" });
    }
  };

  const removeInteraction = async (itemId, type, itemType) => {
    if (!user) return;
    applyOptimisticInteraction(itemId, type, false);
    try {
      const response = await fetch("/api/interactions/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type, itemType }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to remove interaction");
      }
      toast({ title: t("common.success"), description: t("interactions.removeSuccess") });
    } catch {
      applyOptimisticInteraction(itemId, type, true);
      toast({ title: t("common.error"), description: t("interactions.removeError"), variant: "destructive" });
    }
  };

  // ============================================================================
  // FEED MANAGEMENT
  // ============================================================================

  const deleteFeed = async (feedId) => {
    if (!user) {
      toast({ title: t("common.error"), description: t("auth.authenticationError"), variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/feeds/delete?feedId=${feedId}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete feed");
      }
      await queryClient.refetchQueries({ queryKey: ["feeds", user.id], exact: true });
      await queryClient.refetchQueries({ queryKey: ["items", user.id], exact: true });
      await queryClient.refetchQueries({ queryKey: ["favorites", user.id], exact: true });
      await queryClient.refetchQueries({ queryKey: ["read_later", user.id], exact: true });
      toast({ title: t("common.success"), description: t("feeds.deleteSuccess") });
    } catch {
      toast({ title: t("common.error"), description: t("feeds.deleteError"), variant: "destructive" });
    }
  };

  // Sync a single feed via server-side route (handles fetch + dedup + insert)
  const syncFeed = async (feedId) => {
    if (!user) return;
    const feed = feedsQuery.data?.find((f) => f.id === feedId);
    if (!feed) return;

    const endpoint = feed.type === "youtube" ? "/api/youtube/sync" : "/api/feeds/sync-items";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedId }),
    });
    if (!response.ok) throw new Error("Sync failed");
    return response.json();
  };

  // Sync all active feeds
  const fetchNewFeedData = useCallback(async () => {
    if (!user || !feedsQuery.data?.length) return;

    const activeFeeds = feedsQuery.data.filter((f) => !f.deleted_at);
    if (!activeFeeds.length) return;

    const results = await Promise.allSettled(activeFeeds.map((feed) => syncFeed(feed.id)));

    const totalInserted = results.reduce((sum, r) => {
      if (r.status === "fulfilled") return sum + (r.value?.inserted ?? 0);
      return sum;
    }, 0);

    if (totalInserted > 0) {
      await queryClient.refetchQueries({ queryKey: ["items", user.id], exact: true });
      await queryClient.refetchQueries({ queryKey: ["favorites", user.id], exact: true });
      await queryClient.refetchQueries({ queryKey: ["read_later", user.id], exact: true });
      toast({
        title: t("common.success"),
        description: t("feeds.updateSuccess", { updated: totalInserted, skipped: 0 }),
      });
    }

    return { success: true, totalUpdated: totalInserted, feedsProcessed: activeFeeds.length };
  }, [user, feedsQuery.data, queryClient, toast, t]);

  // Auto-sync on first load, with a 30-minute cooldown stored in localStorage
  // so remounting the component (e.g. tab switch) doesn't re-sync all feeds
  useEffect(() => {
    if (!user || !feedsQuery.data?.length) return;
    try {
      const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || "0", 10);
      if (Date.now() - lastSync < SYNC_COOLDOWN) return;
      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable — proceed with sync
    }
    fetchNewFeedData().catch(() => {});
  }, [user, feedsQuery.data?.length, fetchNewFeedData]);

  const refreshAllFeeds = async () => {
    if (!user) return;
    try {
      await queryClient.refetchQueries({ queryKey: ["feeds", user.id], exact: true });
      await queryClient.refetchQueries({ queryKey: ["items", user.id], exact: true });
      toast({ title: t("common.success"), description: t("feeds.refreshSuccess") });
    } catch {
      toast({ title: t("common.error"), description: t("feeds.refreshError"), variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    const feeds = feedsQuery.data || [];
    const items = itemsQuery.data || [];
    return {
      feeds: feeds.length,
      items: items.length,
      favorites: items.filter((item) => item.is_favorite).length,
      readLaterItems: items.filter((item) => item.is_read_later).length,
    };
  }, [feedsQuery.data?.length, itemsQuery.data?.length]);

  // ============================================================================
  // RETURN
  // ============================================================================

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
    feedsQuery,
    itemsQuery,
    addFeed: addFeedMutation.mutate,
    addFeedMutation,
    editFeed: editFeedMutation.mutate,
    deleteFeed,
    isAddingFeed: addFeedMutation.isPending,
    isEditingFeed: editFeedMutation.isPending,
    addInteraction,
    removeInteraction,
    refreshAllFeeds,
    syncFeed,
    fetchNewFeedData,
    user,
  };
}
