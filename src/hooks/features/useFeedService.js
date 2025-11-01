"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useSupabase } from "../useSupabase";

// Constants
const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 30; // 30 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to fetch all feed IDs for the current user
async function fetchUserFeedIds(userId, supabaseClient) {
  console.log(`[fetchUserFeedIds] Fetching feeds for user ${userId}`);

  try {
    // Use API route instead of direct database query
    const response = await fetch("/api/feeds");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const feedIds = (data.feeds || []).map((feed) => feed.id);
    console.log(`[fetchUserFeedIds] Found ${feedIds.length} feeds:`, feedIds);
    return feedIds;
  } catch (error) {
    console.error("[fetchUserFeedIds] Error fetching feeds:", error);
    throw error;
  }
}

// Helper to fetch all items with interactions, filtered by user's feeds
async function fetchAllItemsWithInteractions(userId, supabaseClient) {
  const feedIds = await fetchUserFeedIds(userId, supabaseClient);
  if (feedIds.length === 0) return [];

  console.log(
    `[fetchAllItemsWithInteractions] User ${userId} has ${feedIds.length} feeds`
  );

  try {
    // Use API route for items
    const response = await fetch("/api/feeds");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const items = data.recentItems || [];

    console.log(
      `[fetchAllItemsWithInteractions] Found ${items.length} items from API`
    );

    return items;
  } catch (error) {
    console.error(
      "[fetchAllItemsWithInteractions] Error fetching items:",
      error
    );
    return [];
  }
}

// Get existing items for duplicate detection
async function getExistingFeedItems(feedId, feedType, supabaseClient) {
  try {
    const table = feedType === "youtube" ? "youtube_items" : "rss_items";
    const selectColumns =
      feedType === "youtube"
        ? "id, title, video_id, published_at, created_at"
        : "id, title, guid, published_at, created_at";

    const { data, error } = await supabaseClient
      .from(table)
      .select(selectColumns)
      .eq("feed_id", feedId)
      .order("published_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching existing items:", error);
    return [];
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Calculate smart delta threshold
function calculateDeltaThreshold(lastUpdated) {
  if (!lastUpdated) {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  const lastUpdateDate = new Date(lastUpdated);
  const now = new Date();
  const timeSinceLastUpdate = now - lastUpdateDate;

  if (timeSinceLastUpdate < 60 * 60 * 1000) {
    return lastUpdateDate;
  }

  if (timeSinceLastUpdate > 24 * 60 * 60 * 1000) {
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  return lastUpdateDate;
}

// Enhanced item filtering with multiple criteria
function isNewItem(item, existingGuids, existingTitles, deltaThreshold) {
  const itemDate = new Date(item.pubDate || item.publishedAt || Date.now());
  const isRecent = itemDate > deltaThreshold;

  const guid = item.guid || item.link || item.id;
  const hasUniqueGuid = guid ? !existingGuids.has(guid) : true;

  const title = item.title?.toLowerCase();
  const hasUniqueTitle = title ? !existingTitles.has(title) : true;

  const contentFingerprint = createContentFingerprint(item);
  const hasUniqueContent = !existingTitles.has(contentFingerprint);

  return isRecent && hasUniqueGuid && hasUniqueTitle && hasUniqueContent;
}

// Create content fingerprint for better duplicate detection
function createContentFingerprint(item) {
  const title = item.title
    ?.toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
  const description = item.description?.toLowerCase().substring(0, 100);
  return `${title}-${description}`.substring(0, 100);
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

    let normalizedUrl = url.trim();

    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    const urlObj = new URL(normalizedUrl);
    return urlObj.toString();
  } catch (error) {
    throw new Error("Invalid URL format");
  }
}

// ============================================================================
// FEED SYNC FUNCTIONS
// ============================================================================

// Enhanced delta update with content fingerprinting and duplicate detection
async function fetchFeedDataWithDelta(feed, supabaseClient) {
  try {
    const { id: feedId, url, type, last_updated } = feed;

    console.log(`[Delta Update] Processing feed ${feedId} (${type}): ${url}`);

    const existingItems = await getExistingFeedItems(
      feedId,
      type,
      supabaseClient
    );
    const existingGuids = new Set(
      existingItems
        .map((item) => (type === "youtube" ? item.video_id : item.guid))
        .filter(Boolean)
    );
    const existingTitles = new Set(
      existingItems.map((item) => item.title?.toLowerCase()).filter(Boolean)
    );

    console.log(
      `[Delta Update] Feed type: ${type}, Existing items: ${existingItems.length}, Existing IDs: ${existingGuids.size}`
    );

    const deltaThreshold = calculateDeltaThreshold(last_updated);
    console.log(`[Delta Update] Threshold: ${deltaThreshold.toISOString()}`);

    let newItems = [];
    let feedMetadata = null;

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

      if (!data || typeof data !== "object") {
        console.error("[Delta Update] Invalid response data:", data);
        throw new Error("Invalid response data from RSS API");
      }

      feedMetadata = data.feed;
      const items = Array.isArray(data.items) ? data.items : [];
      newItems = items.filter((item) => {
        return isNewItem(item, existingGuids, existingTitles, deltaThreshold);
      });
    } else if (type === "youtube") {
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
      const items = Array.isArray(data.items) ? data.items : [];

      newItems = items.filter((item) => {
        const videoId = extractVideoId(item.link);
        if (!videoId || existingGuids.has(videoId)) {
          return false;
        }
        return isNewItem(item, existingGuids, existingTitles, deltaThreshold);
      });
    }

    console.log(`[Delta Update] Found ${newItems.length} new items`);

    if (newItems.length === 0) {
      return { updatedItems: 0, skippedDuplicates: 0 };
    }

    const result = await insertFeedItemsWithDuplicateDetection(
      feedId,
      newItems,
      type,
      supabaseClient
    );
    await updateFeedMetadata(feedId, feedMetadata, supabaseClient);

    return {
      updatedItems: result.inserted,
      skippedDuplicates: result.skipped,
    };
  } catch (error) {
    console.error("Error in fetchFeedDataWithDelta:", error);
    throw error;
  }
}

// Enhanced item insertion with batch processing and duplicate detection
async function insertFeedItemsWithDuplicateDetection(
  feedId,
  items,
  feedType,
  supabaseClient
) {
  try {
    let insertedCount = 0;
    let skippedCount = 0;

    const BATCH_SIZE = 10;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      if (feedType === "rss" || feedType === "atom") {
        const result = await processBatchRssItems(
          feedId,
          batch,
          supabaseClient
        );
        insertedCount += result.inserted;
        skippedCount += result.skipped;
      } else if (feedType === "youtube") {
        const result = await processBatchYouTubeItems(
          feedId,
          batch,
          supabaseClient
        );
        insertedCount += result.inserted;
        skippedCount += result.skipped;
      }
    }

    console.log(
      `[Delta Update] Inserted: ${insertedCount}, Skipped: ${skippedCount}`
    );
    return { inserted: insertedCount, skipped: skippedCount };
  } catch (error) {
    console.error("Error inserting feed items:", error);
    throw error;
  }
}

// Process RSS items in batch
async function processBatchRssItems(feedId, items, supabaseClient) {
  let insertedCount = 0;
  let skippedCount = 0;

  const batchData = [];
  const guids = items.map(
    (item) =>
      item.guid || item.link || `${feedId}-${Date.now()}-${Math.random()}`
  );

  const { data: existingItems } = await supabaseClient
    .from("rss_items")
    .select("guid")
    .eq("feed_id", feedId)
    .in("guid", guids);

  const existingGuids = new Set(existingItems?.map((item) => item.guid) || []);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const guid = guids[i];

    if (existingGuids.has(guid)) {
      skippedCount++;
      continue;
    }

    batchData.push({
      feed_id: feedId,
      title: item.title || "Untitled",
      description: item.description || item.summary || null,
      content: item.content || null,
      url: item.link || null,
      published_at:
        item.pubDate || item.publishedAt || new Date().toISOString(),
      guid: guid,
      thumbnail: item.thumbnail || item.image || null,
      author: item.author || null,
      created_at: new Date().toISOString(),
    });
  }

  if (batchData.length > 0) {
    const { data, error } = await supabaseClient
      .from("rss_items")
      .insert(batchData)
      .select("id");

    if (error) {
      console.error("Batch insert error:", error);
      for (const itemData of batchData) {
        try {
          const { error: individualError } = await supabaseClient
            .from("rss_items")
            .insert(itemData);

          if (!individualError) {
            insertedCount++;
          } else if (individualError.code === "23505") {
            skippedCount++;
          }
        } catch (individualErr) {
          console.error("Individual insert error:", individualErr);
        }
      }
    } else {
      insertedCount += data?.length || 0;
    }
  }

  return { inserted: insertedCount, skipped: skippedCount };
}

// Process YouTube items in batch
async function processBatchYouTubeItems(feedId, items, supabaseClient) {
  let insertedCount = 0;
  let skippedCount = 0;

  const batchData = [];
  const videoIds = items
    .map((item) => extractVideoId(item.link))
    .filter(Boolean);

  const { data: existingItems } = await supabaseClient
    .from("youtube_items")
    .select("video_id")
    .eq("feed_id", feedId)
    .in("video_id", videoIds);

  const existingVideoIds = new Set(
    existingItems?.map((item) => item.video_id) || []
  );

  for (const item of items) {
    const videoId = extractVideoId(item.link);
    if (!videoId) {
      skippedCount++;
      continue;
    }

    if (existingVideoIds.has(videoId)) {
      skippedCount++;
      continue;
    }

    batchData.push({
      feed_id: feedId,
      video_id: videoId,
      title: item.title || "Untitled",
      description: item.description ? item.description.substring(0, 500) : null,
      thumbnail: item.thumbnail || item.image || null,
      published_at:
        item.pubDate || item.publishedAt || new Date().toISOString(),
      channel_title: item.author || item.channelTitle || null,
      url:
        item.link ||
        `https://youtube.com/watch?v=${item.videoId || item.video_id}`,
      duration: item.duration || null,
      view_count: item.viewCount || null,
      created_at: new Date().toISOString(),
    });
  }

  if (batchData.length > 0) {
    const { data, error } = await supabaseClient
      .from("youtube_items")
      .insert(batchData)
      .select("id");

    if (error) {
      console.error("Batch insert error:", error);
      for (const itemData of batchData) {
        try {
          const { error: individualError } = await supabaseClient
            .from("youtube_items")
            .insert(itemData);

          if (!individualError) {
            insertedCount++;
          } else if (individualError.code === "23505") {
            skippedCount++;
          }
        } catch (individualErr) {
          console.error("Individual insert error:", individualErr);
        }
      }
    } else {
      insertedCount += data?.length || 0;
    }
  }

  return { inserted: insertedCount, skipped: skippedCount };
}

// Update feed metadata and last_updated timestamp
async function updateFeedMetadata(feedId, feedMetadata, supabaseClient) {
  try {
    const updateData = {
      last_updated: new Date().toISOString(),
    };

    if (feedMetadata) {
      if (feedMetadata.title) {
        updateData.title = feedMetadata.title;
      }
      if (feedMetadata.description) {
        updateData.description = feedMetadata.description;
      }
      if (feedMetadata.icon || feedMetadata.image) {
        updateData.icon = feedMetadata.icon || feedMetadata.image;
      }
    }

    const { error } = await supabaseClient
      .from("feeds")
      .update(updateData)
      .eq("id", feedId);

    if (error) {
      console.error("Error updating feed metadata:", error);
    }
  } catch (error) {
    console.error("Error in updateFeedMetadata:", error);
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

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useFeedService() {
  const { user, session } = useAuth();
  const { supabase, isAuthenticated } = useSupabase();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Auto-sync trigger state
  const [hasAutoSynced, setHasAutoSynced] = useState(false);

  // Debug session state
  useEffect(() => {
    console.log("[useFeedService] Session state:", {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      userId: user?.id,
      isAuthenticated,
    });
  }, [session, user, isAuthenticated]);

  // Set session on Supabase client when available
  useEffect(() => {
    if (session && supabase) {
      console.log("[useFeedService] Setting session on Supabase client");
      supabase.auth.setSession(session).then(({ data, error }) => {
        if (error) {
          console.error("[useFeedService] Error setting session:", error);
        } else {
          console.log("[useFeedService] Session set successfully on client");
        }
      });
    }
  }, [session, supabase]);

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Fetch feeds with their categories
  const feedsQuery = useQuery({
    queryKey: ["feeds", user?.id],
    queryFn: async () => {
      console.log("[feedsQuery] Starting query for user:", user?.id);
      if (!user || !isAuthenticated) {
        console.log(
          "[feedsQuery] No user or not authenticated, returning empty array"
        );
        return [];
      }

      try {
        console.log("[feedsQuery] Fetching feeds from API...");
        const response = await fetch("/api/feeds", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const feeds = data.feeds || [];

        console.log("[feedsQuery] Successfully fetched feeds:", feeds.length);
        return feeds;
      } catch (error) {
        console.error("[feedsQuery] Error in feeds query:", error);
        return [];
      }
    },
    enabled: !!user && isAuthenticated,
  });

  // Fetch all items with interactions
  const itemsQuery = useQuery({
    queryKey: ["items", user?.id],
    queryFn: async () => {
      console.log("[itemsQuery] Starting query for user:", user?.id);
      if (!user || !isAuthenticated) {
        console.log(
          "[itemsQuery] No user or not authenticated, returning empty array"
        );
        return [];
      }
      console.log("[itemsQuery] Fetching items from API...");

      try {
        const response = await fetch("/api/feeds", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const items = data.recentItems || [];

        console.log(
          "[itemsQuery] Query completed, returning",
          items.length,
          "items"
        );
        return items;
      } catch (error) {
        console.error("[itemsQuery] Error fetching items:", error);
        return [];
      }
    },
    enabled: !!user && isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Fetch favorites
  const favoritesQuery = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user || !isAuthenticated) return [];

      try {
        const response = await fetch("/api/favorites", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.items || [];
      } catch (error) {
        console.error("[favoritesQuery] Error fetching favorites:", error);
        return [];
      }
    },
    enabled: !!user && isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Fetch read later items
  const readLaterQuery = useQuery({
    queryKey: ["read_later", user?.id],
    queryFn: async () => {
      if (!user || !isAuthenticated) return [];

      try {
        const response = await fetch("/api/read-later", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.items || [];
      } catch (error) {
        console.error(
          "[readLaterQuery] Error fetching read later items:",
          error
        );
        return [];
      }
    },
    enabled: !!user && isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Add feed mutation
  const addFeedMutation = useMutation({
    mutationFn: async ({ url, ...extraData }) => {
      if (!user) throw new Error("User not authenticated");

      const normalizedUrl = normalizeUrl(url);

      // Detect feed type
      const feedType =
        extraData.type ||
        (normalizedUrl.includes("youtube.com") ||
        normalizedUrl.includes("youtu.be")
          ? "youtube"
          : "rss");

      // Parse feed metadata
      let feedInfo = {};
      try {
        const response = await fetch("/api/rss-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalizedUrl, skipCache: true }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch feed: ${response.statusText}`);
        }

        feedInfo = await response.json();
      } catch (error) {
        console.error("Feed parsing error:", error);
        throw new Error(`Failed to parse ${feedType} feed: ${error.message}`);
      }

      // Prepare feed data
      const feedData = {
        url: normalizedUrl,
        user_id: user.id,
        type: feedType,
        title: extraData.title || feedInfo.feed?.title || normalizedUrl,
        description: extraData.description || feedInfo.feed?.description || "",
        icon: extraData.icon || feedInfo.feed?.icon || null,
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
          const initialItems = feedInfo.items.slice(0, 10);
          await insertFeedItemsWithDuplicateDetection(
            newFeed.id,
            initialItems,
            feedType,
            supabase
          );
        } catch (syncError) {
          console.error("Error syncing initial feed content:", syncError);
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

  // ============================================================================
  // INTERACTION FUNCTIONS
  // ============================================================================

  // Add interaction
  const addInteraction = async (itemId, type, itemType) => {
    if (!user) return;
    try {
      const response = await fetch("/api/interactions/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          type,
          itemType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add interaction");
      }

      await queryClient.invalidateQueries(["items", user.id]);
      await queryClient.invalidateQueries(["favorites", user.id]);
      await queryClient.invalidateQueries(["read_later", user.id]);

      toast({
        title: t("common.success"),
        description: t("interactions.addSuccess"),
      });
    } catch (error) {
      console.error("Error adding interaction:", error);
      toast({
        title: t("common.error"),
        description: t("interactions.addError"),
        variant: "destructive",
      });
    }
  };

  // Remove interaction
  const removeInteraction = async (itemId, type, itemType) => {
    if (!user) return;
    try {
      const response = await fetch("/api/interactions/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          type,
          itemType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove interaction");
      }

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

  // ============================================================================
  // FEED MANAGEMENT FUNCTIONS
  // ============================================================================

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
      const response = await fetch(`/api/feeds/delete?feedId=${feedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete feed");
      }

      await queryClient.invalidateQueries(["feeds", user.id]);
      await queryClient.invalidateQueries(["items", user.id]);
      await queryClient.invalidateQueries(["favorites", user.id]);
      await queryClient.invalidateQueries(["read_later", user.id]);

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

      const activeFeeds = feeds.filter((feed) => !feed.deleted_at);

      if (activeFeeds.length === 0) {
        console.log("No active feeds to update");
        return;
      }

      const fetchPromises = activeFeeds.map((feed) =>
        fetchFeedDataWithDelta(feed, supabase)
      );

      const results = await Promise.allSettled(fetchPromises);

      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const { updatedItems, skippedDuplicates } = result.value;
          totalUpdated += updatedItems || 0;
          totalSkipped += skippedDuplicates || 0;
          console.log(
            `[Delta Update] Feed ${activeFeeds[index].id}: ${updatedItems} new items, ${skippedDuplicates} duplicates skipped`
          );
        } else {
          totalErrors++;
          console.error(
            `[Delta Update] Feed ${activeFeeds[index].id} failed:`,
            result.reason
          );
        }
      });

      console.log(
        `[Delta Update] Completed: ${totalUpdated} new items, ${totalSkipped} duplicates skipped, ${totalErrors} errors`
      );

      if (totalUpdated > 0) {
        await queryClient.invalidateQueries(["items", user.id]);
        await queryClient.invalidateQueries(["favorites", user.id]);
        await queryClient.invalidateQueries(["read_later", user.id]);

        toast({
          title: t("common.success"),
          description: t("feeds.updateSuccess", {
            updated: totalUpdated,
            skipped: totalSkipped,
          }),
        });
      }

      return {
        success: true,
        totalUpdated,
        totalSkipped,
        totalErrors,
        feedsProcessed: activeFeeds.length,
      };
    } catch (error) {
      console.error("Error fetching new feed data:", error);
      throw error;
    }
  }, [user, feedsQuery.data?.length, queryClient]);

  // Auto-fetch new feed data when user logs in and feeds are loaded
  useEffect(() => {
    if (
      user &&
      feedsQuery.data &&
      feedsQuery.data.length > 0 &&
      !hasAutoSynced
    ) {
      setHasAutoSynced(true);
      fetchNewFeedData().catch(console.error);
    }
  }, [user, feedsQuery.data?.length, hasAutoSynced, fetchNewFeedData]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Refresh all feeds
  const refreshAllFeeds = async () => {
    if (!user) return;
    try {
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

  // Calculate stats
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
  // RETURN VALUES
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
    fetchNewFeedData,

    // User
    user,
  };
}
