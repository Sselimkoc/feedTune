/**
 * YouTube data caching module
 */
import { supabase } from "@/lib/supabase";

/**
 * Default cache duration in days
 */
const DEFAULT_CACHE_DURATION_DAYS = 7;

/**
 * Default video cache duration in days (daha kısa bir süre)
 */
const DEFAULT_VIDEO_CACHE_DURATION_DAYS = 2;

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

    const { error: channelError } = await supabase
      .from("youtube_cache")
      .delete()
      .lt("updated_at", cutoffDate.toISOString());

    if (channelError) {
      console.error("Error cleaning YouTube channel cache:", channelError);
    } else {
      console.log(
        `Cleaned YouTube channel cache entries older than ${olderThanDays} days`
      );
    }
    
    // Video cache temizliği
    const { error: videoError } = await supabase
      .from("youtube_video_cache")
      .delete()
      .lt("updated_at", cutoffDate.toISOString());
      
    if (videoError) {
      console.error("Error cleaning YouTube video cache:", videoError);
    } else {
      console.log(
        `Cleaned YouTube video cache entries older than ${olderThanDays} days`
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
    if (!youtubeId) {
      console.error("Invalid YouTube ID provided for caching");
      return;
    }
    
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
          // Yeni istatistik alanları
          statistics: channelInfo.statistics || null,
          subscribers: channelInfo.statistics?.subscriberCount || null,
          video_count: channelInfo.statistics?.videoCount || null,
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
          // Yeni istatistik alanları
          statistics: channelInfo.statistics || null,
          subscribers: channelInfo.statistics?.subscriberCount || null,
          video_count: channelInfo.statistics?.videoCount || null,
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
 * Get video info from cache
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<object|null>} - Cached video info or null if not found/expired
 */
export async function getVideoFromCache(videoId) {
  try {
    const { data, error } = await supabase
      .from("youtube_video_cache")
      .select("*")
      .eq("video_id", videoId)
      .single();

    if (error || !data) {
      return null;
    }

    // Video önbelleği için daha kısa süre kullan
    if (isCacheValid(data.updated_at, DEFAULT_VIDEO_CACHE_DURATION_DAYS)) {
      console.log("YouTube video info retrieved from cache:", videoId);
      return data;
    }

    return null;
  } catch (error) {
    console.error("Error getting YouTube video from cache:", error);
    return null;
  }
}

/**
 * Store or update video info in cache
 * @param {string} videoId - YouTube video ID
 * @param {object} videoInfo - Video information
 * @returns {Promise<void>}
 */
export async function cacheVideoInfo(videoId, videoInfo) {
  try {
    if (!videoId) {
      console.error("Invalid video ID provided for caching");
      return;
    }
    
    const now = new Date().toISOString();

    // Check if the video already exists in cache
    const { data: existingData } = await supabase
      .from("youtube_video_cache")
      .select("video_id")
      .eq("video_id", videoId)
      .single();

    if (existingData) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from("youtube_video_cache")
        .update({
          title: videoInfo.title,
          description: videoInfo.description,
          thumbnail: videoInfo.thumbnail,
          channel_id: videoInfo.channelId,
          channel_title: videoInfo.channelTitle,
          published_at: videoInfo.publishedAt,
          updated_at: now,
          view_count: videoInfo.viewCount || null,
          like_count: videoInfo.likeCount || null,
          duration: videoInfo.duration || null,
        })
        .eq("video_id", videoId);

      if (updateError) {
        console.error("Error updating YouTube video cache:", updateError);
      } else {
        console.log("YouTube video info updated in cache:", videoId);
      }
    } else {
      // Insert new entry
      const { error: insertError } = await supabase
        .from("youtube_video_cache")
        .insert({
          video_id: videoId,
          title: videoInfo.title,
          description: videoInfo.description,
          thumbnail: videoInfo.thumbnail,
          channel_id: videoInfo.channelId,
          channel_title: videoInfo.channelTitle,
          published_at: videoInfo.publishedAt,
          created_at: now,
          updated_at: now,
          view_count: videoInfo.viewCount || null,
          like_count: videoInfo.likeCount || null,
          duration: videoInfo.duration || null,
        });

      if (insertError) {
        console.error("Error inserting YouTube video cache:", insertError);
      } else {
        console.log("YouTube video info added to cache:", videoId);
      }
    }
  } catch (error) {
    console.error("Error in cacheVideoInfo:", error);
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
    if (!query || !results || !Array.isArray(results)) {
      return;
    }
    
    // Veritabanı önbelleğine ekle
    const now = new Date().toISOString();
    const searchId = `search_${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const { error } = await supabase
      .from("youtube_search_cache")
      .upsert({
        search_id: searchId,
        query: query.toLowerCase(),
        results: results.slice(0, 10), // En fazla 10 sonuç
        created_at: now,
        updated_at: now,
      });
    
    if (error) {
      console.error("Error caching YouTube search results:", error);
    }

    // Store in localStorage on client side if available
    if (typeof window !== "undefined" && window.localStorage) {
      const cacheKey = `youtube_search_${query.toLowerCase()}`;
      const cacheData = {
        results,
        timestamp: now,
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
 * @returns {Promise<Array|null>} - Cached search results or null if not found/expired
 */
export async function getCachedSearchResults(query) {
  try {
    if (!query) return null;
    
    // İlk önce veritabanından ara
    const searchId = `search_${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const { data, error } = await supabase
      .from("youtube_search_cache")
      .select("*")
      .eq("search_id", searchId)
      .single();
      
    if (!error && data) {
      const updateTime = new Date(data.updated_at);
      const now = new Date();
      const diffHours = Math.abs(now - updateTime) / (1000 * 60 * 60);
      
      // 24 saatten yeni ise kullan
      if (diffHours <= 24) {
        console.log("YouTube search results from DB cache:", query);
        return data.results;
      }
    }
    
    // Veritabanında bulunamadı veya eski, localStorage'a bak
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
      console.log("YouTube search results retrieved from localStorage:", query);
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
