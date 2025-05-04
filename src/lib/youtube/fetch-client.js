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

    // URL parametrelerini oluştur
    const searchParams = new URLSearchParams({
      ...params,
      key: apiKey,
    });

    const url = `${API_BASE_URL}/${endpoint}?${searchParams.toString()}`;
    console.log("Fetch API isteği yapılıyor:", url);

    const response = await fetch(url);

    if (!response.ok) {
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
    const response = await makeRequest("search", {
      part: "snippet",
      type: "channel",
      q: query,
      maxResults,
    });

    return response.items.map((item) => ({
      id: item.id.channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
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
    const response = await makeRequest("channels", {
      part: "snippet,contentDetails,statistics",
      id: channelId,
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
        channel.snippet.thumbnails.default?.url,
      channel_title: channel.snippet.title,
      statistics: channel.statistics,
      rss_url: rssUrl,
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
    // First get the uploads playlist ID
    const channelResponse = await makeRequest("channels", {
      part: "contentDetails",
      id: channelId,
    });

    if (!channelResponse.items || channelResponse.items.length === 0) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const uploadsPlaylistId =
      channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

    // Then get the videos from the uploads playlist
    const playlistResponse = await makeRequest("playlistItems", {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults,
    });

    return playlistResponse.items.map((item) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error("Error fetching YouTube channel videos:", error);
    return [];
  }
}
