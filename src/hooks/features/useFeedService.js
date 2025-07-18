"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
    .is("deleted_at", null)
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

// Enhanced delta update with content fingerprinting and duplicate detection
async function fetchFeedDataWithDelta(feed) {
  try {
    const { id: feedId, url, type, last_updated } = feed;

    console.log(`[Delta Update] Processing feed ${feedId} (${type}): ${url}`);

    // Get existing items for duplicate detection
    const existingItems = await getExistingFeedItems(feedId, type);

    // Create sets for duplicate detection based on feed type
    const existingGuids = new Set(
      existingItems
        .map((item) => (type === "youtube" ? item.video_id : item.guid))
        .filter(Boolean) // Remove any null/undefined values
    );
    const existingTitles = new Set(
      existingItems.map((item) => item.title?.toLowerCase()).filter(Boolean)
    );

    console.log(
      `[Delta Update] Feed type: ${type}, Existing items: ${existingItems.length}, Existing IDs: ${existingGuids.size}`
    );

    // Calculate time threshold for delta update
    const deltaThreshold = calculateDeltaThreshold(last_updated);

    console.log(`[Delta Update] Threshold: ${deltaThreshold.toISOString()}`);
    console.log(`[Delta Update] Existing items: ${existingItems.length}`);

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

      // Add validation for the response data
      if (!data || typeof data !== "object") {
        console.error("[Delta Update] Invalid response data:", data);
        throw new Error("Invalid response data from RSS API");
      }

      feedMetadata = data.feed;

      // Enhanced filtering with multiple criteria
      // Ensure data.items is an array before filtering
      const items = Array.isArray(data.items) ? data.items : [];
      newItems = items.filter((item) => {
        return isNewItem(item, existingGuids, existingTitles, deltaThreshold);
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

      // Add validation for the response data
      if (!data || typeof data !== "object") {
        console.error("[Delta Update] Invalid YouTube response data:", data);
        throw new Error("Invalid response data from YouTube RSS API");
      }

      feedMetadata = data.feed;

      // Enhanced filtering for YouTube items
      // Ensure data.items is an array before filtering
      const items = Array.isArray(data.items) ? data.items : [];
      newItems = items.filter((item) => {
        const videoId = extractVideoId(item.link);
        return (
          videoId &&
          isNewYouTubeItem(
            item,
            videoId,
            existingGuids,
            existingTitles,
            deltaThreshold
          )
        );
      });
    }

    console.log(
      `[Delta Update] Found ${newItems.length} new items after filtering`
    );

    if (newItems.length === 0) {
      // Update last_updated even if no new items
      await updateFeedLastUpdated(feedId);
      return { feedId, updatedItems: 0, skippedDuplicates: 0 };
    }

    // Insert new items with enhanced duplicate detection
    const insertResult = await insertFeedItemsWithDuplicateDetection(
      feedId,
      newItems,
      type
    );

    // Update feed last_updated timestamp and metadata
    await updateFeedMetadata(feedId, feedMetadata);

    return {
      feedId,
      updatedItems: insertResult.inserted,
      skippedDuplicates: insertResult.skipped,
      totalNewItems: newItems.length,
    };
  } catch (error) {
    console.error(`[Delta Update] Error processing feed ${feed.id}:`, error);
    throw error;
  }
}

// Get existing items for duplicate detection
async function getExistingFeedItems(feedId, feedType) {
  try {
    const table = feedType === "youtube" ? "youtube_items" : "rss_items";

    // Select appropriate columns based on feed type
    const selectColumns =
      feedType === "youtube"
        ? "id, title, video_id, published_at, created_at"
        : "id, title, guid, published_at, created_at";

    const { data, error } = await supabase
      .from(table)
      .select(selectColumns)
      .eq("feed_id", feedId)
      .order("published_at", { ascending: false })
      .limit(100); // Limit to recent items for performance

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching existing items:", error);
    return [];
  }
}

// Calculate smart delta threshold
function calculateDeltaThreshold(lastUpdated) {
  if (!lastUpdated) {
    // If never updated, get items from last 7 days
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  const lastUpdateDate = new Date(lastUpdated);
  const now = new Date();
  const timeSinceLastUpdate = now - lastUpdateDate;

  // If last update was recent (< 1 hour), use last update time
  if (timeSinceLastUpdate < 60 * 60 * 1000) {
    return lastUpdateDate;
  }

  // If last update was long ago (> 24 hours), get items from last 24 hours
  if (timeSinceLastUpdate > 24 * 60 * 60 * 1000) {
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  // Otherwise, use last update time
  return lastUpdateDate;
}

// Enhanced item filtering with multiple criteria
function isNewItem(item, existingGuids, existingTitles, deltaThreshold) {
  // Check publish date
  const itemDate = new Date(item.pubDate || item.publishedAt || Date.now());
  const isRecent = itemDate > deltaThreshold;

  // Check GUID/ID for exact duplicates
  const guid = item.guid || item.link || item.id;
  const hasUniqueGuid = guid ? !existingGuids.has(guid) : true;

  // Check title for near-duplicates
  const title = item.title?.toLowerCase();
  const hasUniqueTitle = title ? !existingTitles.has(title) : true;

  // Content fingerprinting for better duplicate detection
  const contentFingerprint = createContentFingerprint(item);
  const hasUniqueContent = !existingTitles.has(contentFingerprint);

  return isRecent && hasUniqueGuid && hasUniqueTitle && hasUniqueContent;
}

// Enhanced YouTube item filtering
function isNewYouTubeItem(
  item,
  videoId,
  existingGuids,
  existingTitles,
  deltaThreshold
) {
  // Check if video ID already exists
  if (existingGuids.has(videoId)) {
    return false;
  }

  // Use general item filtering
  return isNewItem(item, existingGuids, existingTitles, deltaThreshold);
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

// Enhanced item insertion with batch processing and duplicate detection
async function insertFeedItemsWithDuplicateDetection(feedId, items, feedType) {
  try {
    let insertedCount = 0;
    let skippedCount = 0;

    // Process items in batches for better performance
    const BATCH_SIZE = 10;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      if (feedType === "rss" || feedType === "atom") {
        // Process RSS items batch
        const result = await processBatchRssItems(feedId, batch);
        insertedCount += result.inserted;
        skippedCount += result.skipped;
      } else if (feedType === "youtube") {
        // Process YouTube items batch
        const result = await processBatchYouTubeItems(feedId, batch);
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
async function processBatchRssItems(feedId, items) {
  let insertedCount = 0;
  let skippedCount = 0;

  // Prepare batch data
  const batchData = [];
  const guids = items.map(
    (item) =>
      item.guid || item.link || `${feedId}-${Date.now()}-${Math.random()}`
  );

  // Check for existing items in batch
  const { data: existingItems } = await supabase
    .from("rss_items")
    .select("guid")
    .eq("feed_id", feedId)
    .in("guid", guids);

  const existingGuids = new Set(existingItems?.map((item) => item.guid) || []);

  // Prepare items for insertion
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
      link: item.link || null,
      published_at:
        item.pubDate || item.publishedAt || new Date().toISOString(),
      guid: guid,
      thumbnail: item.thumbnail || item.image || null,
      author: item.author || null,
      created_at: new Date().toISOString(),
    });
  }

  // Batch insert
  if (batchData.length > 0) {
    const { data, error } = await supabase
      .from("rss_items")
      .insert(batchData)
      .select("id");

    if (error) {
      console.error("Batch insert error:", error);
      // Fallback to individual inserts
      for (const itemData of batchData) {
        try {
          const { error: individualError } = await supabase
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
async function processBatchYouTubeItems(feedId, items) {
  let insertedCount = 0;
  let skippedCount = 0;

  // Prepare batch data
  const batchData = [];
  const videoIds = items
    .map((item) => extractVideoId(item.link))
    .filter(Boolean);

  // Check for existing items in batch
  const { data: existingItems } = await supabase
    .from("youtube_items")
    .select("video_id")
    .eq("feed_id", feedId)
    .in("video_id", videoIds);

  const existingVideoIds = new Set(
    existingItems?.map((item) => item.video_id) || []
  );

  // Prepare items for insertion
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
      title: item.title || "Untitled Video",
      description: item.description ? item.description.substring(0, 500) : null,
      thumbnail: item.thumbnail || item.image || null,
      published_at:
        item.pubDate || item.publishedAt || new Date().toISOString(),
      channel_title: item.author || null,
      url: item.link || `https://youtube.com/watch?v=${videoId}`,
      created_at: new Date().toISOString(),
    });
  }

  // Batch insert
  if (batchData.length > 0) {
    const { data, error } = await supabase
      .from("youtube_items")
      .insert(batchData)
      .select("id");

    if (error) {
      console.error("Batch insert error:", error);
      // Fallback to individual inserts
      for (const itemData of batchData) {
        try {
          const { error: individualError } = await supabase
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
async function updateFeedMetadata(feedId, feedMetadata) {
  try {
    const updateData = {
      last_updated: new Date().toISOString(),
    };

    // Update feed metadata if available
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

    const { error } = await supabase
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

// Legacy insertFeedItems function - now uses enhanced version
async function insertFeedItems(feedId, items, feedType) {
  const result = await insertFeedItemsWithDuplicateDetection(
    feedId,
    items,
    feedType
  );
  return result.inserted;
}

// Legacy updateFeedLastUpdated function - now uses enhanced version
async function updateFeedLastUpdated(feedId) {
  await updateFeedMetadata(feedId, null);
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

// Auto-sync feeds using the API endpoint
async function autoSyncFeeds(userId) {
  try {
    console.log("[Auto Sync] Starting automatic feed synchronization");

    const response = await fetch("/api/feeds/auto-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Auto-sync failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("[Auto Sync] Result:", result);

    return result;
  } catch (error) {
    console.error("[Auto Sync] Error:", error);
    throw error;
  }
}

export function useFeedService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Auto-sync trigger state
  const [hasAutoSynced, setHasAutoSynced] = useState(false);

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
          .is("deleted_at", null)
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

      // Process results with enhanced reporting
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

      // Invalidate queries to refresh UI with new data
      if (totalUpdated > 0) {
        await queryClient.invalidateQueries(["items", user.id]);
        await queryClient.invalidateQueries(["favorites", user.id]);
        await queryClient.invalidateQueries(["read_later", user.id]);

        // Show success toast
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

  // Auto-sync feeds when user logs in and feeds are loaded
  useEffect(() => {
    if (
      user &&
      feedsQuery.data &&
      feedsQuery.data.length > 0 &&
      !hasAutoSynced
    ) {
      setHasAutoSynced(true);

      // Run auto-sync in background
      autoSyncFeeds(user.id)
        .then((result) => {
          if (result.synced > 0) {
            console.log(
              `[Auto Sync] Successfully synced ${result.synced} feeds`
            );
            // Refetch items after sync to show new content
            queryClient.invalidateQueries(["feed-items", user.id]);

            // Show a subtle notification [[memory:2852054]]
            toast({
              title: t("feeds.autoSyncComplete"),
              description: t("feeds.autoSyncDescription", {
                count: result.synced,
              }),
              duration: 3000,
            });
          }
        })
        .catch((error) => {
          console.error("[Auto Sync] Error during auto-sync:", error);
        });
    }
  }, [user, feedsQuery.data, hasAutoSynced, queryClient, toast, t]);

  // Reset auto-sync flag when user changes
  useEffect(() => {
    setHasAutoSynced(false);
  }, [user?.id]);

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
