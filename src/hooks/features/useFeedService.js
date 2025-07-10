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
    .eq("deleted_at", null)
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

// Fetch feed data with delta update (only new items)
async function fetchFeedDataWithDelta(feed) {
  try {
    const { id: feedId, url, type, last_updated } = feed;

    console.log(`Fetching data for feed ${feedId} (${type}): ${url}`);

    // Calculate time threshold for delta update (only fetch items newer than last update)
    const deltaThreshold = last_updated
      ? new Date(last_updated)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    let newItems = [];
    let feedMetadata = null;

    // Fetch based on feed type
    if (type === "rss" || type === "atom") {
      const response = await fetch("/api/rss-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, skipCache: true }),
      });

      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      feedMetadata = data.feed;

      // Filter items newer than delta threshold
      newItems = (data.items || []).filter((item) => {
        const itemDate = new Date(item.pubDate || item.publishedAt);
        return itemDate > deltaThreshold;
      });
    } else if (type === "youtube") {
      // For YouTube feeds, use the RSS format
      const rssUrl = url.includes("youtube.com/feeds/videos.xml")
        ? url
        : `https://www.youtube.com/feeds/videos.xml?channel_id=${extractChannelId(
            url
          )}`;

      const response = await fetch("/api/rss-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rssUrl, skipCache: true }),
      });

      if (!response.ok) {
        throw new Error(`YouTube RSS fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      feedMetadata = data.feed;

      // Filter items newer than delta threshold
      newItems = (data.items || []).filter((item) => {
        const itemDate = new Date(item.pubDate || item.publishedAt);
        return itemDate > deltaThreshold;
      });
    }

    console.log(`Found ${newItems.length} new items for feed ${feedId}`);

    if (newItems.length === 0) {
      // Update last_updated even if no new items
      await updateFeedLastUpdated(feedId);
      return { feedId, updatedItems: 0 };
    }

    // Insert new items into database
    const insertedCount = await insertFeedItems(feedId, newItems, type);

    // Update feed last_updated timestamp
    await updateFeedLastUpdated(feedId);

    return {
      feedId,
      updatedItems: insertedCount,
      totalNewItems: newItems.length,
    };
  } catch (error) {
    console.error(`Error fetching data for feed ${feed.id}:`, error);
    throw error;
  }
}

// Insert feed items into appropriate table
async function insertFeedItems(feedId, items, feedType) {
  try {
    let insertedCount = 0;

    if (feedType === "rss" || feedType === "atom") {
      // Insert RSS items
      for (const item of items) {
        try {
          const { error } = await supabase.from("rss_items").insert({
            feed_id: feedId,
            title: item.title || "Untitled",
            description: item.description || item.summary || null,
            content: item.content || null,
            link: item.link || null,
            published_at:
              item.pubDate || item.publishedAt || new Date().toISOString(),
            guid:
              item.guid ||
              item.link ||
              `${feedId}-${Date.now()}-${Math.random()}`,
            thumbnail: item.thumbnail || item.image || null,
            author: item.author || null,
            created_at: new Date().toISOString(),
          });

          if (!error) {
            insertedCount++;
          } else if (error.code !== "23505") {
            // Ignore duplicate key errors
            console.error("Error inserting RSS item:", error);
          }
        } catch (itemError) {
          console.error("Error processing RSS item:", itemError);
        }
      }
    } else if (feedType === "youtube") {
      // Insert YouTube items
      for (const item of items) {
        try {
          const videoId = extractVideoId(item.link);
          if (!videoId) continue;

          const { error } = await supabase.from("youtube_items").insert({
            feed_id: feedId,
            video_id: videoId,
            title: item.title || "Untitled Video",
            description: item.description
              ? item.description.substring(0, 500)
              : null,
            thumbnail: item.thumbnail || item.image || null,
            published_at:
              item.pubDate || item.publishedAt || new Date().toISOString(),
            channel_title: item.author || null,
            url: item.link || `https://youtube.com/watch?v=${videoId}`,
            created_at: new Date().toISOString(),
          });

          if (!error) {
            insertedCount++;
          } else if (error.code !== "23505") {
            // Ignore duplicate key errors
            console.error("Error inserting YouTube item:", error);
          }
        } catch (itemError) {
          console.error("Error processing YouTube item:", itemError);
        }
      }
    }

    return insertedCount;
  } catch (error) {
    console.error("Error inserting feed items:", error);
    throw error;
  }
}

// Update feed last_updated timestamp
async function updateFeedLastUpdated(feedId) {
  try {
    const { error } = await supabase
      .from("feeds")
      .update({ last_updated: new Date().toISOString() })
      .eq("id", feedId);

    if (error) {
      console.error("Error updating feed last_updated:", error);
    }
  } catch (error) {
    console.error("Error in updateFeedLastUpdated:", error);
  }
}

// Helper function to extract YouTube channel ID from URL
function extractChannelId(url) {
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Helper function to extract YouTube video ID from URL
function extractVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// URL normalization utility function
function normalizeUrl(url) {
  try {
    if (!url) return "";

    // Clean URL
    let normalizedUrl = url.trim();

    // Add protocol if missing
    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Convert to URL object to standardize
    const urlObj = new URL(normalizedUrl);

    // Remove trailing slash (optional)
    let finalUrl = urlObj.toString();
    if (finalUrl.endsWith("/") && !urlObj.pathname.endsWith("//")) {
      finalUrl = finalUrl.slice(0, -1);
    }

    return finalUrl;
  } catch (error) {
    console.warn("URL normalization error:", error);
    // Return original URL if error
    return url;
  }
}

// Parse feed metadata using API
async function parseFeedMetadata(url, type) {
  try {
    const response = await fetch("/api/rss-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, skipCache: true }),
    });

    if (!response.ok) {
      throw new Error(`Feed parsing failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      title: data.feed?.title || "",
      description: data.feed?.description || "",
      icon: data.feed?.icon || data.feed?.image || null,
      items: data.items || [],
    };
  } catch (error) {
    console.error("Feed parsing error:", error);
    throw error;
  }
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
          .eq("deleted_at", null)
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

  // Function to fetch new feed data using existing feeds data
  const fetchNewFeedData = useCallback(async () => {
    try {
      if (!user) {
        console.warn("fetchNewFeedData: user is required");
        return;
      }

      const feeds = feedsQuery.data;
      if (!feeds || feeds.length === 0) {
        console.log("No feeds available for update");
        return;
      }

      console.log(`Updating ${feeds.length} feeds for user ${user.id}`);

      // Filter only active feeds and prepare for delta update
      const activeFeeds = feeds.filter((feed) => !feed.deleted_at);

      if (activeFeeds.length === 0) {
        console.log("No active feeds to update");
        return;
      }

      // Fetch new data for each feed with delta update
      const fetchPromises = activeFeeds.map((feed) =>
        fetchFeedDataWithDelta(feed)
      );

      const results = await Promise.allSettled(fetchPromises);

      // Process results
      let totalUpdated = 0;
      let totalErrors = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          totalUpdated += result.value.updatedItems || 0;
          console.log(
            `Feed ${activeFeeds[index].id}: ${result.value.updatedItems} items updated`
          );
        } else {
          totalErrors++;
          console.error(`Feed ${activeFeeds[index].id} failed:`, result.reason);
        }
      });

      console.log(
        `Feed update completed: ${totalUpdated} items updated, ${totalErrors} errors`
      );

      // Invalidate queries to refresh UI with new data
      if (totalUpdated > 0) {
        await queryClient.invalidateQueries(["items", user.id]);
        await queryClient.invalidateQueries(["favorites", user.id]);
        await queryClient.invalidateQueries(["read_later", user.id]);
      }

      return {
        success: true,
        totalUpdated,
        totalErrors,
        feedsProcessed: activeFeeds.length,
      };
    } catch (error) {
      console.error("Error fetching new feed data:", error);
      throw error;
    }
  }, [user, feedsQuery.data, queryClient]);

  // Auto-fetch new feed data when user logs in and feeds are loaded
  useEffect(() => {
    if (
      user &&
      feedsQuery.data &&
      feedsQuery.data.length > 0 &&
      !feedsQuery.isLoading
    ) {
      fetchNewFeedData().catch((error) => {
        console.error("Error in auto-fetch:", error);
        toast({
          title: t("common.error"),
          description: t("feeds.fetchError"),
          variant: "destructive",
        });
      });
    }
  }, [user, feedsQuery.data, feedsQuery.isLoading, fetchNewFeedData, toast, t]);

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
  console.log(favoritesQuery.data, "fav----");
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
    if (!user) {
      toast({
        title: t("common.error"),
        description: t("auth.authenticationError"),
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId)
        .eq("user_id", user.id);
      if (error) {
        if (error.code === "23503") {
          toast({
            title: t("common.error"),
            description:
              t("feeds.deleteError") + ": " + t("feeds.hasDependencies"),
            variant: "destructive",
          });
        } else if (error.code === "28P01") {
          toast({
            title: t("common.error"),
            description: t("auth.authenticationError"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("common.error"),
            description:
              t("feeds.deleteError") +
              (error.message ? ": " + error.message : ""),
            variant: "destructive",
          });
        }
        throw error;
      }
      await queryClient.invalidateQueries(["feeds", user.id]);
      toast({
        title: t("common.success"),
        description: t("feeds.deleteSuccess"),
      });
    } catch (error) {
      console.error("Error deleting feed:", error);
      toast({
        title: t("common.error"),
        description:
          t("feeds.deleteError") + (error?.message ? ": " + error.message : ""),
        variant: "destructive",
      });
    }
  };

  // Enhanced Add feed mutation with full business logic
  const addFeedMutation = useMutation({
    mutationFn: async ({ url, type = "rss", extraData = {} }) => {
      if (!user) throw new Error("User not authenticated");

      // Validation
      if (!url) throw new Error("Feed URL is required");
      if (!type || !["rss", "atom", "youtube"].includes(type)) {
        throw new Error("Valid feed type is required (rss, atom, youtube)");
      }

      // URL normalization
      const normalizedUrl = normalizeUrl(url);

      // YouTube RSS feed check
      let feedType = type;
      if (normalizedUrl.includes("youtube.com/feeds/videos.xml")) {
        feedType = "youtube";
      }

      // Get feed metadata
      let feedInfo = {};
      try {
        feedInfo = await parseFeedMetadata(normalizedUrl, feedType);

        // Improve YouTube feed title
        if (feedType === "youtube" && !extraData.title && feedInfo.title) {
          feedInfo.title = feedInfo.title.replace("YouTube", "").trim();
        }
      } catch (error) {
        console.error("Feed parsing error:", error);
        throw new Error(`Failed to parse ${feedType} feed: ${error.message}`);
      }

      // Prepare feed data
      const feedData = {
        url: normalizedUrl,
        user_id: user.id,
        type: feedType,
        title: extraData.title || feedInfo.title || normalizedUrl,
        description: extraData.description || feedInfo.description || "",
        icon: extraData.icon || feedInfo.icon || null,
        category_id: extraData.category_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add feed to database
      const { data: newFeed, error } = await supabase
        .from("feeds")
        .insert(feedData)
        .select()
        .single();

      if (error) throw error;

      // If feed is new and has items, sync initial content
      if (newFeed && feedInfo.items && feedInfo.items.length > 0) {
        try {
          // Take only first 10 items for initial sync
          const initialItems = feedInfo.items.slice(0, 10);
          await insertFeedItems(newFeed.id, initialItems, feedType);
        } catch (syncError) {
          console.error("Error syncing initial feed content:", syncError);
          // Don't throw error - feed creation should still succeed
        }
      }

      return newFeed;
    },
    onSuccess: (newFeed) => {
      queryClient.invalidateQueries(["feeds", user.id]);
      queryClient.invalidateQueries(["items", user.id]);
      toast({
        title: t("common.success"),
        description: t("feeds.addSuccess"),
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

    // Mutation states
    isAddingFeed: addFeedMutation.isPending,
    isEditingFeed: editFeedMutation.isPending,

    // Interactions
    addInteraction,
    removeInteraction,

    // Actions
    refreshAllFeeds,
    syncFeed,
    fetchNewFeedData, // Add the new feed data fetching function

    // Utility functions for external use
    insertYoutubeItems: (feedId, items) =>
      insertFeedItems(feedId, items, "youtube"),
    insertRssItems: (feedId, items) => insertFeedItems(feedId, items, "rss"),

    // Invalidate queries
    invalidateFeedsQuery: () =>
      queryClient.invalidateQueries(["feeds", user?.id]),

    // User
    user,
  };
}
