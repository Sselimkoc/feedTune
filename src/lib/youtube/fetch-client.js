/**
 * YouTube API interaction module (Fetch API version)
 */

/**
 * YouTube API Configuration
 */
const getApiKey = () => {
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    console.error(
      "YouTube API anahtarı tanımlanmamış! Lütfen .env.local dosyasını kontrol edin."
    );
  }

  return key;
};

const API_BASE_URL = "https://www.googleapis.com/youtube/v3";

// API rate limiter - basit bir implementasyon
let lastRequestTime = 0;
const requestDelay = 100; // ms

/**
 * Make a request to the YouTube API using Fetch API
 * @param {string} endpoint - API endpoint
 * @param {object} params - Request parameters
 * @returns {Promise<object>} - API response
 */
async function makeRequest(endpoint, params = {}) {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      throw new Error("YouTube API anahtarı tanımlanmamış");
    }

    // Rate limiting - istek zaman aralığını kontrol et
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < requestDelay) {
      // Bir önceki istekten yeterli süre geçmediyse bekle
      await new Promise((resolve) =>
        setTimeout(resolve, requestDelay - timeSinceLastRequest)
      );
    }

    lastRequestTime = Date.now();

    // URL parametrelerini oluştur
    const searchParams = new URLSearchParams({
      ...params,
      key: apiKey,
    });

    const url = `${API_BASE_URL}/${endpoint}?${searchParams.toString()}`;
    console.log("Fetch API isteği yapılıyor:", url);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FeedTune YouTube Integration",
      },
    });

    if (!response.ok) {
      const status = response.status;

      // API'den dönen spesifik hata mesajlarını işle
      if (status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (
          errorData.error?.errors?.some((e) => e.reason === "quotaExceeded")
        ) {
          throw new Error(
            "YouTube API kota sınırına ulaşıldı. Lütfen daha sonra tekrar deneyin."
          );
        }
        throw new Error(
          "YouTube API erişim reddedildi. API anahtarınızı kontrol edin."
        );
      } else if (status === 404) {
        throw new Error("İstenilen kaynak bulunamadı.");
      } else if (status === 429) {
        throw new Error(
          "Çok fazla istek yapıldı. Lütfen daha sonra tekrar deneyin."
        );
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP error ${response.status}: ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`YouTube API hatası (${endpoint}):`, error.message);
    throw error;
  }
}

/**
 * Search for YouTube channels
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default: 10)
 * @returns {Promise<Array>} - List of channel results
 */
export async function searchChannels(query, maxResults = 10) {
  try {
    if (!query || query.trim() === "") {
      console.warn("Empty search query provided");
      return [];
    }

    const trimmedQuery = query.trim();
    console.log(`YouTube kanalları aranıyor: "${trimmedQuery}"`);

    const response = await makeRequest("search", {
      part: "snippet",
      type: "channel",
      q: trimmedQuery,
      maxResults: Math.min(maxResults, 50), // YouTube API en fazla 50 sonuç döndürür
    });

    if (!response.items || response.items.length === 0) {
      console.log("Kanal bulunamadı:", trimmedQuery);
      return [];
    }

    return response.items.map((item) => ({
      id: item.id.channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error("Error searching YouTube channels:", error);
    return [];
  }
}

/**
 * Get channel details by ID
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<object>} - Channel details
 */
export async function getChannelById(channelId) {
  try {
    if (!channelId || channelId.trim() === "") {
      throw new Error("Geçerli bir YouTube kanal ID'si gerekli");
    }

    const response = await makeRequest("channels", {
      part: "snippet,contentDetails,statistics",
      id: channelId.trim(),
    });

    if (!response.items || response.items.length === 0) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const channel = response.items[0];
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    return {
      youtube_id: channelId,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail:
        channel.snippet.thumbnails.high?.url ||
        channel.snippet.thumbnails.medium?.url ||
        channel.snippet.thumbnails.default?.url,
      channel_title: channel.snippet.title,
      statistics: channel.statistics,
      rss_url: rssUrl,
      publishedAt: channel.snippet.publishedAt,
    };
  } catch (error) {
    console.error("Error fetching YouTube channel:", error);
    throw error;
  }
}

/**
 * Get videos for a channel
 * @param {string} channelId - YouTube channel ID
 * @param {number} maxResults - Maximum number of results (default: 50)
 * @returns {Promise<Array>} - List of videos
 */
export async function getChannelVideos(channelId, maxResults = 50) {
  try {
    if (!channelId || channelId.trim() === "") {
      throw new Error("Geçerli bir YouTube kanal ID'si gerekli");
    }

    // First get the uploads playlist ID
    const channelResponse = await makeRequest("channels", {
      part: "contentDetails",
      id: channelId.trim(),
    });

    if (!channelResponse.items || channelResponse.items.length === 0) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const uploadsPlaylistId =
      channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

    // Then get the videos from the uploads playlist
    const playlistResponse = await makeRequest("playlistItems", {
      part: "snippet,contentDetails,status",
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(maxResults, 50), // YouTube API en fazla 50 sonuç döndürür
    });

    // Sadece yayınlanmış videoları filtrele (yayınlanmamış veya özel videolar olabilir)
    const publishedVideos = playlistResponse.items
      .filter((item) => item.status?.privacyStatus === "public" || !item.status)
      .map((item) => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        url: `https://youtube.com/watch?v=${item.contentDetails.videoId}`,
      }));

    return publishedVideos;
  } catch (error) {
    console.error("Error fetching YouTube channel videos:", error);
    return [];
  }
}

/**
 * Get video details by video ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<object>} - Video details
 */
export async function getVideoById(videoId) {
  try {
    if (!videoId || videoId.trim() === "") {
      throw new Error("Geçerli bir YouTube video ID'si gerekli");
    }

    const response = await makeRequest("videos", {
      part: "snippet,contentDetails,statistics",
      id: videoId.trim(),
    });

    if (!response.items || response.items.length === 0) {
      throw new Error(`Video not found: ${videoId}`);
    }

    const video = response.items[0];

    return {
      id: videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail:
        video.snippet.thumbnails.high?.url ||
        video.snippet.thumbnails.medium?.url ||
        video.snippet.thumbnails.default?.url,
      publishedAt: video.snippet.publishedAt,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      viewCount: video.statistics?.viewCount,
      likeCount: video.statistics?.likeCount,
      duration: video.contentDetails?.duration, // ISO 8601 duration format
      url: `https://youtube.com/watch?v=${videoId}`,
    };
  } catch (error) {
    console.error("Error fetching YouTube video:", error);
    throw error;
  }
}
