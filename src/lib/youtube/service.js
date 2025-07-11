/**
 * YouTube Service
 * Provides all YouTube related functionality for the application
 *
 * Bu servis, YouTube API ile etkileşim, önbellekleme, veri ayrıştırma ve feed senkronizasyonu için
 * merkezi bir noktadır.
 */
import { supabase } from "@/lib/supabase";
import axios from "axios";
// Note: insertYoutubeItems will be passed as parameter to avoid circular dependency
import Parser from "rss-parser";

// Import utilities
import {
  extractChannelId,
  createRssUrl,
  extractVideoId,
  createThumbnailUrl,
} from "@/lib/youtube/utils";
import {
  getChannelFromCache,
  cacheChannelInfo,
  cacheSearchResults,
  getVideoFromCache,
  cacheVideoInfo,
  getCachedSearchResults,
} from "@/lib/youtube/cache";
import {
  getChannelById,
  searchChannels,
  getChannelVideos,
  getVideoById,
} from "@/lib/youtube/api-client";

/**
 * YouTube Service sınıfı için hata tipleri
 */
export class YouTubeError extends Error {
  /**
   * @param {string} message - Hata mesajı
   * @param {string} code - Hata kodu
   * @param {Error} [originalError] - Orijinal hata
   */
  constructor(message, code, originalError = null) {
    super(message);
    this.name = "YouTubeError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * YouTube Service Class
 * Central implementation of all YouTube functionality
 */
class YouTubeService {
  /**
   * Get YouTube channel information from cache or make a new request
   * @param {string} youtubeId - YouTube channel ID
   * @returns {Promise<object>} - Channel information
   * @throws {YouTubeError} - If channel information cannot be retrieved
   */
  async getChannelInfo(youtubeId) {
    if (!youtubeId) {
      throw new YouTubeError(
        "YouTube channel ID is required",
        "MISSING_PARAMETER"
      );
    }

    try {
      // Try to get from cache first
      const cachedData = await getChannelFromCache(youtubeId);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache or expired, fetch from API
      try {
        const channelInfo = await getChannelById(youtubeId);

        // Store in cache
        await cacheChannelInfo(youtubeId, channelInfo);

        return channelInfo;
      } catch (apiError) {
        // Log specific API error for better debugging
        console.warn(
          `YouTube API error for channel ${youtubeId}: ${apiError.message}`,
          { error: apiError }
        );

        // Fall back to proxy method
        const channelInfo = await this.fetchChannelInfo(youtubeId);

        // Still store this data in cache
        await cacheChannelInfo(youtubeId, channelInfo);

        return channelInfo;
      }
    } catch (error) {
      console.error("Error getting YouTube channel info:", error);

      // Provide a descriptive error with original error attached
      throw new YouTubeError(
        `Failed to get YouTube channel information: ${error.message}`,
        "CHANNEL_INFO_ERROR",
        error
      );
    }
  }

  /**
   * Fetch channel information from YouTube API or proxy
   * @param {string} youtubeId - YouTube channel ID
   * @returns {Promise<object>} - Channel information
   * @throws {YouTubeError} - If channel information cannot be fetched
   */
  async fetchChannelInfo(youtubeId) {
    try {
      // First try to get channel info from YouTube API
      try {
        const channelInfo = await getChannelById(youtubeId);
        if (channelInfo) {
          return channelInfo;
        }
      } catch (apiError) {
        console.warn(
          "YouTube API failed, falling back to proxy:",
          apiError.message
        );
      }

      // Fallback to proxy if API fails
      const response = await axios.post("/api/proxy", {
        url: `https://www.youtube.com/channel/${youtubeId}`,
        method: "GET",
      });

      // Extract data from HTML (basic example)
      const html = response.data;

      // In a real application, use a more robust parser
      const title = this.extractFromHtml(
        html,
        /"title":"([^"]+)"/,
        "Unknown Channel"
      );
      const thumbnail = this.extractFromHtml(
        html,
        /"avatar":{"thumbnails":\[{"url":"([^"]+)"/,
        ""
      );
      const description = this.extractFromHtml(
        html,
        /"description":"([^"]+)"/,
        ""
      );

      // Create RSS URL
      const rssUrl = createRssUrl(youtubeId);

      return {
        youtube_id: youtubeId,
        title,
        thumbnail,
        description,
        channel_title: title,
        rss_url: rssUrl,
      };
    } catch (error) {
      console.error("Error fetching YouTube channel info:", error);

      // Return a simple object in case of error
      return {
        youtube_id: youtubeId,
        title: "Unknown Channel",
        thumbnail: "",
        description: "",
        channel_title: "Unknown Channel",
        rss_url: createRssUrl(youtubeId),
      };
    }
  }

  /**
   * Extract data from HTML using regex
   * @param {string} html - HTML content
   * @param {RegExp} regex - Regex pattern
   * @param {string} defaultValue - Default value if not found
   * @returns {string} - Found value or default value
   * @private
   */
  extractFromHtml(html, regex, defaultValue) {
    const match = html.match(regex);
    return match && match[1]
      ? match[1].replace(/\\u0026/g, "&").replace(/\\"/g, '"')
      : defaultValue;
  }

  /**
   * Create an RSS feed URL from a YouTube URL
   * @param {string} youtubeUrl - YouTube URL (channel, user, or video)
   * @returns {Promise<string>} - RSS feed URL
   * @throws {YouTubeError} - If RSS URL cannot be created
   */
  async getYoutubeRssUrl(youtubeUrl) {
    if (!youtubeUrl) {
      throw new YouTubeError("YouTube URL is required", "MISSING_PARAMETER");
    }

    try {
      // Normalize URL
      let normalizedUrl = youtubeUrl.trim();

      // If already an RSS URL, return directly
      if (normalizedUrl.includes("youtube.com/feeds/videos.xml")) {
        return normalizedUrl;
      }

      // Try to extract channel ID
      let channelId = extractChannelId(normalizedUrl);

      // If direct extraction fails, try the more comprehensive method
      if (!channelId) {
        channelId = await this.extractYoutubeChannelId(normalizedUrl);
      }

      // If channel ID is found
      if (channelId) {
        console.log("Channel ID extracted:", channelId);
        return createRssUrl(channelId);
      }

      console.log("Making API call to youtube-to-rss with URL:", normalizedUrl);

      // Use API
      const response = await axios.post("/api/youtube/to-rss", {
        url: normalizedUrl,
      });

      if (!response.data || !response.data.rssUrl) {
        throw new YouTubeError(
          "YouTube RSS URL not found in API response",
          "API_RESPONSE_ERROR"
        );
      }

      console.log("Received RSS URL from API:", response.data.rssUrl);
      return response.data.rssUrl;
    } catch (error) {
      console.error("Error creating YouTube RSS URL:", error);

      // In case of API error, try to create direct RSS URL
      try {
        const channelId = extractChannelId(youtubeUrl);
        if (channelId) {
          console.log(
            "Fallback: Creating direct RSS URL for channel ID:",
            channelId
          );
          return createRssUrl(channelId);
        }
      } catch (fallbackError) {
        console.error("Fallback URL creation failed:", fallbackError);
      }

      throw new YouTubeError(
        `Failed to create YouTube RSS URL: ${error.message}`,
        "RSS_URL_ERROR",
        error
      );
    }
  }

  /**
   * Extract channel ID from YouTube URL
   * @param {string} youtubeUrl - YouTube URL (channel, user, or video)
   * @returns {Promise<string|null>} - Channel ID or null
   */
  async extractYoutubeChannelId(youtubeUrl) {
    if (!youtubeUrl) return null;

    try {
      // First try the utility function
      const directId = extractChannelId(youtubeUrl);
      if (directId) {
        return directId;
      }

      // Normalize URL
      const normalizedUrl = youtubeUrl.trim();

      // Create URL object
      let url;
      try {
        url = new URL(normalizedUrl);
      } catch (e) {
        // If not a valid URL and doesn't include http(s), try adding https://
        if (!normalizedUrl.startsWith("http")) {
          try {
            url = new URL(`https://${normalizedUrl}`);
          } catch (e2) {
            console.error("Invalid URL format:", normalizedUrl);
            return null;
          }
        } else {
          console.error("Invalid URL format:", normalizedUrl);
          return null;
        }
      }

      // Check for /c/ format
      if (url.pathname.includes("/c/") || url.pathname.startsWith("/c/")) {
        const customName = url.pathname.split("/c/")[1]?.split(/[/?#]/)[0];
        if (customName) {
          // Need to make an API call to get channel ID for custom name
          // Check cache first
          const { data } = await supabase
            .from("youtube_cache")
            .select("youtube_id")
            .ilike("title", `%${customName}%`)
            .limit(1)
            .single();

          if (data?.youtube_id) return data.youtube_id;
        }
      }

      // Check for /@username format
      if (url.pathname.includes("/@")) {
        const username = url.pathname.split("/@")[1]?.split(/[/?#]/)[0];
        if (username) {
          // Check cache
          const { data } = await supabase
            .from("youtube_cache")
            .select("youtube_id")
            .ilike("title", `%${username}%`)
            .limit(1)
            .single();

          if (data?.youtube_id) return data.youtube_id;
        }
      }

      // Check for /user/ format
      if (url.pathname.includes("/user/")) {
        const username = url.pathname.split("/user/")[1]?.split(/[/?#]/)[0];
        if (username) {
          // Check cache
          const { data } = await supabase
            .from("youtube_cache")
            .select("youtube_id")
            .ilike("title", `%${username}%`)
            .limit(1)
            .single();

          if (data?.youtube_id) return data.youtube_id;
        }
      }

      return null;
    } catch (error) {
      console.error("Error extracting channel ID:", error);
      return null;
    }
  }

  /**
   * Synchronize videos for a YouTube feed
   * @param {string} feedId - Feed ID
   * @param {string} channelId - YouTube channel ID
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, count: number, error?: string}>}
   */
  async syncVideos(feedId, channelId, userId, insertYoutubeItems) {
    if (!feedId || !channelId) {
      console.error("Invalid feedId or channelId:", { feedId, channelId });
      return { success: false, error: "Invalid feedId or channelId" };
    }

    try {
      console.log(
        `Synchronizing YouTube videos. FeedId: ${feedId}, ChannelId: ${channelId}`
      );

      // Create RSS URL
      const rssUrl = createRssUrl(channelId);
      if (!rssUrl) {
        return { success: false, error: "Failed to create RSS URL" };
      }

      // Get feed content
      console.log("Getting RSS feed:", rssUrl);
      const parser = new Parser({
        timeout: 30000, // 30 saniye timeout (bağlantı sorunları için)
        customFields: {
          item: [
            ["media:group", "mediaGroup"],
            ["media:thumbnail", "mediaThumbnail"],
          ],
        },
      });

      try {
        const feed = await parser.parseURL(rssUrl);

        if (!feed || !feed.items || feed.items.length === 0) {
          console.log("Feed is empty or has no items");
          return {
            success: true,
            count: 0,
            message: "No videos found in YouTube channel",
          };
        }

        // Sadece son 20 video ile çalış (en yeni videolar öncelikli)
        let items = feed.items;
        if (items.length > 20) {
          console.log(`Sınırlandırma yapılıyor: ${items.length} -> 20 video`);
          items = items.slice(0, 20);
        }

        // Process and format items
        console.log(`Found ${items.length} videos, formatting...`);
        const formattedItems = items.map((item) => {
          const videoId = extractVideoId(item.link);
          const publishedDate = new Date(item.pubDate);

          // Thumbnail belirleme - ekstra thumbnail kaynaklarını da dene
          let thumbnailUrl = "";

          if (item.mediaThumbnail && item.mediaThumbnail.$.url) {
            thumbnailUrl = item.mediaThumbnail.$.url;
          } else if (
            item.mediaGroup &&
            item.mediaGroup["media:thumbnail"] &&
            item.mediaGroup["media:thumbnail"][0] &&
            item.mediaGroup["media:thumbnail"][0].$.url
          ) {
            thumbnailUrl = item.mediaGroup["media:thumbnail"][0].$.url;
          } else if (item.itunes?.image) {
            thumbnailUrl = item.itunes.image;
          } else if (videoId) {
            thumbnailUrl = createThumbnailUrl(videoId, "high");
          }

          return {
            feed_id: feedId,
            title: item.title,
            description: item.contentSnippet || "",
            link: item.link,
            video_id: videoId,
            thumbnail_url: thumbnailUrl,
            published_at: publishedDate.toISOString(),
            created_at: new Date().toISOString(),
            guid: item.guid || item.id || videoId,
            channel_id: channelId,
            user_id: userId,
          };
        });

        // Add to database
        console.log(`Adding ${formattedItems.length} videos`);
        if (!insertYoutubeItems) {
          throw new Error("insertYoutubeItems function is required");
        }
        const result = await insertYoutubeItems(feedId, formattedItems);

        console.log("YouTube video sync result:", result);
        return result;
      } catch (parseError) {
        console.error("Feed parsing error:", parseError);
        return {
          success: false,
          error: `Feed parsing error: ${parseError.message}`,
        };
      }
    } catch (error) {
      console.error("Error syncing YouTube videos:", error);
      return {
        success: false,
        error: error.message || "Unexpected error in video synchronization",
      };
    }
  }

  /**
   * Get YouTube video information by ID
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<object>} - Video information
   * @throws {YouTubeError} - If video information cannot be retrieved
   */
  async getVideoInfo(videoId) {
    if (!videoId) {
      throw new YouTubeError(
        "YouTube video ID is required",
        "MISSING_PARAMETER"
      );
    }

    try {
      // Try to get from cache first
      const cachedData = await getVideoFromCache(videoId);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache or expired, fetch from API
      try {
        const videoInfo = await getVideoById(videoId);

        // Store in cache
        await cacheVideoInfo(videoId, videoInfo);

        return videoInfo;
      } catch (apiError) {
        // Log specific API error for better debugging
        console.warn(
          `YouTube API error for video ${videoId}: ${apiError.message}`,
          { error: apiError }
        );

        // Fallback to simpler video object
        return {
          video_id: videoId,
          title: "Unknown Video",
          url: `https://youtube.com/watch?v=${videoId}`,
          thumbnail: createThumbnailUrl(videoId),
        };
      }
    } catch (error) {
      console.error("Error getting YouTube video info:", error);

      // Provide a descriptive error with original error attached
      throw new YouTubeError(
        `Failed to get YouTube video information: ${error.message}`,
        "VIDEO_INFO_ERROR",
        error
      );
    }
  }

  /**
   * Get videos from a specific channel
   * @param {string} channelId - YouTube channel ID
   * @param {number} maxResults - Maximum number of results to return (default: 20)
   * @returns {Promise<Array>} - List of videos
   * @throws {YouTubeError} - If videos cannot be retrieved
   */
  async getChannelVideos(channelId, maxResults = 20) {
    if (!channelId) {
      throw new YouTubeError(
        "YouTube channel ID is required",
        "MISSING_PARAMETER"
      );
    }

    try {
      // Get videos from API
      const videos = await getChannelVideos(channelId, maxResults);

      if (!videos || videos.length === 0) {
        console.log(`No videos found for channel: ${channelId}`);
        return [];
      }

      // Cache each video
      for (const video of videos) {
        if (video.id) {
          await cacheVideoInfo(video.id, video);
        }
      }

      return videos;
    } catch (error) {
      console.error(`Error getting videos for channel ${channelId}:`, error);
      throw new YouTubeError(
        `Failed to get channel videos: ${error.message}`,
        "CHANNEL_VIDEOS_ERROR",
        error
      );
    }
  }

  /**
   * Search for YouTube channels
   * @param {string} query - Search query
   * @returns {Promise<Array>} - List of found channels
   */
  async searchChannel(query) {
    if (!query || typeof query !== "string") {
      console.warn("Invalid search query:", query);
      return [];
    }

    try {
      console.log(`Starting YouTube channel search: ${query}`);

      // Check cache first
      const cachedResults = await getCachedSearchResults(query);
      if (cachedResults && cachedResults.length > 0) {
        console.log("Using cached search results for:", query);
        return cachedResults;
      }

      // Use the utility function for search
      const results = await searchChannels(query);
      if (results && results.length > 0) {
        // Cache the results
        await cacheSearchResults(query, results);
        return results;
      }

      // Fallback to API endpoint if direct search fails
      const isBrowser = typeof window !== "undefined";
      let baseUrl = "";

      if (isBrowser) {
        // In browser environment we can use relative URL
        baseUrl = "";
      } else {
        // On server side we need the full URL
        const vercelUrl = process.env.VERCEL_URL;
        baseUrl = vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";
      }

      console.log(
        `YouTube kanal arama API endpoint: ${baseUrl}/api/youtube/channel-search`
      );

      // Make request with Fetch API - works on both client and server
      const response = await fetch(`${baseUrl}/api/youtube/channel-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: query }),
      });

      if (!response.ok) {
        throw new YouTubeError(
          `YouTube API request failed: ${response.status}`,
          "API_REQUEST_ERROR"
        );
      }

      const data = await response.json();

      if (!data.success || !data.channel) {
        console.log("YouTube channel search: No results found");
        return [];
      }

      const channel = data.channel;
      console.log(`YouTube channel found: ${channel.title}`);

      // Cache the results
      await cacheSearchResults(query, [channel]);

      return [channel];
    } catch (error) {
      console.error("YouTube channel search error:", error);

      // İstisnayı yöneten kodun hatasını görmesi için yeniden fırlat
      // Böylece UI katmanı kullanıcıya anlamlı bir hata mesajı gösterebilir
      throw new YouTubeError(
        `YouTube channel search failed: ${error.message}`,
        "SEARCH_ERROR",
        error
      );
    }
  }

  /**
   * Search for YouTube videos
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise<Array>} - List of videos
   */
  async searchVideos(query, maxResults = 10) {
    if (!query || typeof query !== "string") {
      console.warn("Invalid search query for videos:", query);
      return [];
    }

    try {
      console.log(`Starting YouTube video search: ${query}`);

      // API'den arama yap
      const response = await fetch(`/api/youtube/video-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, maxResults }),
      });

      if (!response.ok) {
        throw new Error(`Video search API failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.videos || !Array.isArray(data.videos)) {
        console.log("No videos found for:", query);
        return [];
      }

      console.log(`Found ${data.videos.length} videos for: ${query}`);
      return data.videos;
    } catch (error) {
      console.error("YouTube video search error:", error);
      throw new YouTubeError(
        `YouTube video search failed: ${error.message}`,
        "VIDEO_SEARCH_ERROR",
        error
      );
    }
  }

  /**
   * Extract YouTube video ID from URL or string
   * @param {string} url - URL or string containing video ID
   * @returns {string|null} - YouTube video ID or null if not found
   */
  extractVideoId(url) {
    return extractVideoId(url);
  }

  /**
   * Create thumbnail URL for a YouTube video
   * @param {string} videoId - YouTube video ID
   * @param {string} quality - Thumbnail quality (default, mqdefault, hqdefault, sddefault, maxresdefault)
   * @returns {string} - Thumbnail URL
   */
  createThumbnailUrl(videoId, quality = "hqdefault") {
    return createThumbnailUrl(videoId, quality);
  }

  /**
   * Format YouTube video duration from ISO 8601 format to human readable format
   * @param {string} isoDuration - ISO 8601 duration (e.g. PT1H30M15S)
   * @returns {string} - Formatted duration (e.g. 1:30:15)
   */
  formatVideoDuration(isoDuration) {
    if (!isoDuration) return "";

    // ISO 8601 süreden saat, dakika ve saniye değerlerini çıkart
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return "";

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    // Farklı formatlar oluştur
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  /**
   * Format YouTube view count to human readable format
   * @param {string|number} viewCount - View count as string or number
   * @returns {string} - Formatted view count (e.g. 1.2M, 3.4K)
   */
  formatViewCount(viewCount) {
    if (!viewCount) return "0";

    const count =
      typeof viewCount === "string" ? parseInt(viewCount) : viewCount;

    if (isNaN(count)) return "0";

    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toString();
    }
  }

  /**
   * Add a YouTube channel to feeds
   * @param {string} channelId - YouTube channel ID or URL
   * @param {string} userId - User ID
   * @returns {Promise<object>} - The newly created feed
   * @throws {YouTubeError} - If channel cannot be added
   */
  async addYoutubeChannel(channelId, userId, insertYoutubeItems) {
    if (!channelId) {
      throw new YouTubeError(
        "Channel ID or URL is required",
        "MISSING_PARAMETER"
      );
    }

    if (!userId) {
      throw new YouTubeError("User ID is required", "MISSING_PARAMETER");
    }

    try {
      // Check if it's a URL instead of an ID
      if (channelId.includes("youtube.com") || channelId.includes("youtu.be")) {
        const extractedId = extractChannelId(channelId);
        if (extractedId) {
          channelId = extractedId;
        } else {
          // If direct extraction fails, use the comprehensive method
          channelId = await this.extractYoutubeChannelId(channelId);
        }
      }

      if (!channelId) {
        throw new YouTubeError(
          "Invalid YouTube channel ID or URL",
          "INVALID_CHANNEL"
        );
      }

      // Get channel info
      const channelInfo = await this.getChannelInfo(channelId);

      // Add feed to database
      const { data: feed, error } = await supabase
        .from("feeds")
        .insert({
          user_id: userId,
          title: channelInfo.title,
          url: channelInfo.rss_url || createRssUrl(channelId),
          feed_type: "youtube",
          channel_id: channelId,
          thumbnail: channelInfo.thumbnail,
          description: channelInfo.description,
        })
        .select("*")
        .single();

      if (error) {
        // Duplicated feed error için özel işleme
        if (error.code === "23505") {
          // PostgreSQL duplicate key error
          throw new YouTubeError(
            "This YouTube channel is already in your feeds",
            "DUPLICATE_FEED",
            error
          );
        }

        console.error("Error adding YouTube channel:", error);
        throw new YouTubeError(
          "Failed to add YouTube channel",
          "DATABASE_ERROR",
          error
        );
      }

      // Sync videos after adding the channel
      if (insertYoutubeItems) {
        await this.syncVideos(feed.id, channelId, userId, insertYoutubeItems);
      }

      return feed;
    } catch (error) {
      console.error("Error in addYoutubeChannel:", error);

      // Eğer zaten bir YouTubeError ise, doğrudan ilet
      if (error instanceof YouTubeError) {
        throw error;
      }

      // Değilse, yeni bir hata oluştur
      throw new YouTubeError(
        `Failed to add YouTube channel: ${error.message}`,
        "ADD_CHANNEL_ERROR",
        error
      );
    }
  }

  /**
   * Update a YouTube channel feed
   * @param {string} feedId - Feed ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} - The updated feed
   * @throws {YouTubeError} - If channel cannot be updated
   */
  async updateYoutubeChannel(feedId, userId, insertYoutubeItems) {
    if (!feedId) {
      throw new YouTubeError("Feed ID is required", "MISSING_PARAMETER");
    }

    if (!userId) {
      throw new YouTubeError("User ID is required", "MISSING_PARAMETER");
    }

    try {
      // Get feed info
      const { data: feed, error: feedError } = await supabase
        .from("feeds")
        .select("*")
        .eq("id", feedId)
        .eq("user_id", userId)
        .single();

      if (feedError || !feed) {
        throw new YouTubeError("Feed not found", "NOT_FOUND", feedError);
      }

      // Sync videos
      if (insertYoutubeItems) {
        await this.syncVideos(
          feedId,
          feed.channel_id,
          userId,
          insertYoutubeItems
        );
      }

      return feed;
    } catch (error) {
      console.error("Error in updateYoutubeChannel:", error);

      // Eğer zaten bir YouTubeError ise, doğrudan ilet
      if (error instanceof YouTubeError) {
        throw error;
      }

      throw new YouTubeError(
        `Failed to update YouTube channel: ${error.message}`,
        "UPDATE_CHANNEL_ERROR",
        error
      );
    }
  }

  /**
   * Parse a YouTube channel URL
   * @param {string} url - YouTube channel URL
   * @returns {Promise<object>} - Channel information
   * @throws {YouTubeError} - If URL cannot be parsed
   */
  async parseYoutubeChannel(url) {
    if (!url) {
      throw new YouTubeError("URL is required", "MISSING_PARAMETER");
    }

    try {
      // Try to extract directly first
      let channelId = extractChannelId(url);

      // If direct extraction fails, use the comprehensive method
      if (!channelId) {
        channelId = await this.extractYoutubeChannelId(url);
      }

      if (!channelId) {
        throw new YouTubeError(
          "Invalid YouTube channel URL",
          "INVALID_CHANNEL"
        );
      }

      const channelInfo = await this.getChannelInfo(channelId);
      return {
        channelId,
        channelInfo,
      };
    } catch (error) {
      console.error("Error in parseYoutubeChannel:", error);

      // Eğer zaten bir YouTubeError ise, doğrudan ilet
      if (error instanceof YouTubeError) {
        throw error;
      }

      throw new YouTubeError(
        `Failed to parse YouTube channel: ${error.message}`,
        "PARSE_ERROR",
        error
      );
    }
  }

  /**
   * Delete a YouTube channel feed
   * @param {string} feedId - Feed ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   * @throws {YouTubeError} - If feed cannot be deleted
   */
  async deleteYoutubeChannel(feedId, userId) {
    if (!feedId) {
      throw new YouTubeError("Feed ID is required", "MISSING_PARAMETER");
    }

    if (!userId) {
      throw new YouTubeError("User ID is required", "MISSING_PARAMETER");
    }

    try {
      // Delete feed
      const { error } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId)
        .eq("user_id", userId);

      if (error) {
        throw new YouTubeError(
          "Failed to delete feed",
          "DATABASE_ERROR",
          error
        );
      }

      return true;
    } catch (error) {
      console.error("Error in deleteYoutubeChannel:", error);

      // Eğer zaten bir YouTubeError ise, doğrudan ilet
      if (error instanceof YouTubeError) {
        throw error;
      }

      throw new YouTubeError(
        `Failed to delete YouTube channel: ${error.message}`,
        "DELETE_ERROR",
        error
      );
    }
  }

  /**
   * Temizlik işlemlerini gerçekleştirir ve önbelleği temizler
   * @returns {Promise<boolean>} - İşlem başarı durumu
   */
  async cleanCache() {
    try {
      // Burada önbellek temizleme işlemleri gerçekleştirilebilir
      // Örneğin youtube_cache tablosundan eski verileri silme

      return true;
    } catch (error) {
      console.error("Error cleaning YouTube cache:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const youtubeService = new YouTubeService();
