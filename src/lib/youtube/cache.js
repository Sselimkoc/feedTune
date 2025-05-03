/**
 * YouTube data caching module
 */
import { supabase } from "@/lib/supabase";

/**
 * Default cache duration in days
 */
const DEFAULT_CACHE_DURATION_DAYS = 7;

/**
 * Checks if the cache is valid based on the last update time
 * @param {string} updatedAt - Last update timestamp
 * @param {number} cacheDurationDays - Cache duration in days
 * @returns {boolean} - Whether the cache is still valid
 */
export function isCacheValid(
  updatedAt,
  cacheDurationDays = DEFAULT_CACHE_DURATION_DAYS
) {
  const cacheDate = new Date(updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now - cacheDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= cacheDurationDays;
}

/**
 * Cleans up old cache entries
 * @param {number} olderThanDays - Remove entries older than this many days
 * @returns {Promise<void>}
 */
export async function cleanCache(olderThanDays = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { error } = await supabase
      .from("youtube_cache")
      .delete()
      .lt("updated_at", cutoffDate.toISOString());

    if (error) {
      console.error("Error cleaning YouTube cache:", error);
    } else {
      console.log(
        `Cleaned YouTube cache entries older than ${olderThanDays} days`
      );
    }
  } catch (error) {
    console.error("Error in cleanCache:", error);
  }
}

/**
 * Get channel info from cache
 * @param {string} youtubeId - YouTube channel ID
 * @returns {Promise<object|null>} - Cached channel info or null if not found/expired
 */
export async function getChannelFromCache(youtubeId) {
  try {
    // Try to clean cache periodically (5% chance)
    if (Math.random() < 0.05) {
      await cleanCache();
    }

    const { data, error } = await supabase
      .from("youtube_cache")
      .select("*")
      .eq("youtube_id", youtubeId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if cache is still valid
    if (isCacheValid(data.updated_at)) {
      console.log("YouTube channel info retrieved from cache:", youtubeId);
      return data;
    }

    return null;
  } catch (error) {
    console.error("Error getting YouTube channel from cache:", error);
    return null;
  }
}

/**
 * Store or update channel info in cache
 * @param {string} youtubeId - YouTube channel ID
 * @param {object} channelInfo - Channel information
 * @returns {Promise<void>}
 */
export async function cacheChannelInfo(youtubeId, channelInfo) {
  try {
    const now = new Date().toISOString();

    // Check if the channel already exists in cache
    const { data: existingData } = await supabase
      .from("youtube_cache")
      .select("youtube_id")
      .eq("youtube_id", youtubeId)
      .single();

    if (existingData) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from("youtube_cache")
        .update({
          title: channelInfo.title,
          thumbnail: channelInfo.thumbnail,
          description: channelInfo.description,
          channel_title: channelInfo.channel_title,
          rss_url: channelInfo.rss_url,
          updated_at: now,
        })
        .eq("youtube_id", youtubeId);

      if (updateError) {
        console.error("Error updating YouTube cache:", updateError);
      } else {
        console.log("YouTube channel info updated in cache:", youtubeId);
      }
    } else {
      // Insert new entry
      const { error: insertError } = await supabase
        .from("youtube_cache")
        .insert({
          youtube_id: youtubeId,
          title: channelInfo.title,
          thumbnail: channelInfo.thumbnail,
          description: channelInfo.description,
          channel_title: channelInfo.channel_title,
          rss_url: channelInfo.rss_url,
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error("Error inserting YouTube cache:", insertError);
      } else {
        console.log("YouTube channel info added to cache:", youtubeId);
      }
    }
  } catch (error) {
    // Don't throw, just log the error to avoid breaking the application
    console.error("Error in cacheChannelInfo:", error);
  }
}

/**
 * Cache search results
 * @param {string} query - Search query
 * @param {Array} results - Search results
 * @returns {Promise<void>}
 */
export async function cacheSearchResults(query, results) {
  try {
    // For now, we're not caching search results in the database
    // Just in memory for the current session
    // This could be expanded to use the database if needed

    // Store in localStorage on client side if available
    if (typeof window !== "undefined" && window.localStorage) {
      const cacheKey = `youtube_search_${query.toLowerCase()}`;
      const cacheData = {
        results,
        timestamp: new Date().toISOString(),
      };

      window.localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log("YouTube search results cached in localStorage:", query);
    }
  } catch (error) {
    console.error("Error caching YouTube search results:", error);
  }
}

/**
 * Get cached search results
 * @param {string} query - Search query
 * @returns {Array|null} - Cached search results or null if not found/expired
 */
export function getCachedSearchResults(query) {
  try {
    // Only works on client side
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    const cacheKey = `youtube_search_${query.toLowerCase()}`;
    const cachedData = window.localStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const { results, timestamp } = JSON.parse(cachedData);

    // Check if cache is still valid (1 hour)
    const cacheTime = new Date(timestamp);
    const now = new Date();
    const diffMs = Math.abs(now - cacheTime);
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 1) {
      console.log("YouTube search results retrieved from cache:", query);
      return results;
    }

    // Clear expired cache
    window.localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error("Error getting cached YouTube search results:", error);
    return null;
  }
}
