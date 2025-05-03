/**
 * Utility functions for YouTube-related operations
 */

/**
 * Extract YouTube channel ID from various URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - Channel ID or null if invalid
 */
export function extractChannelId(url) {
  if (!url) return null;

  // Clean up the URL
  url = url.trim();

  // Handle various YouTube URL formats
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) {
      return null;
    }

    const pathname = urlObj.pathname;

    // Format: youtube.com/channel/CHANNEL_ID
    if (pathname.startsWith("/channel/")) {
      return pathname.split("/channel/")[1].split("/")[0];
    }

    // Format: youtube.com/c/CHANNEL_NAME
    if (pathname.startsWith("/c/") || pathname.startsWith("/@")) {
      // Need to make an API call to get the channel ID
      // This function only handles direct IDs
      return null;
    }

    // Format: youtube.com/user/USERNAME
    if (pathname.startsWith("/user/")) {
      // Need to make an API call to get the channel ID
      // This function only handles direct IDs
      return null;
    }

    return null;
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
    return null;
  }
}

/**
 * Creates a valid YouTube RSS URL from a channel ID
 * @param {string} channelId - YouTube channel ID
 * @returns {string} - RSS URL
 */
export function createRssUrl(channelId) {
  if (!channelId) return null;
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

/**
 * Extracts video ID from a YouTube video URL
 * @param {string} url - YouTube video URL
 * @returns {string|null} - Video ID or null if invalid
 */
export function extractVideoId(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) {
      return null;
    }

    // Format: youtube.com/watch?v=VIDEO_ID
    if (hostname.includes("youtube.com")) {
      const videoId = urlObj.searchParams.get("v");
      if (videoId) return videoId;
    }

    // Format: youtu.be/VIDEO_ID
    if (hostname.includes("youtu.be")) {
      const pathname = urlObj.pathname;
      if (pathname.length > 1) {
        return pathname.substring(1);
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing YouTube video URL:", error);
    return null;
  }
}

/**
 * Creates a YouTube thumbnail URL from a video ID
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality (default, medium, high, standard, maxres)
 * @returns {string} - Thumbnail URL
 */
export function createThumbnailUrl(videoId, quality = "high") {
  if (!videoId) return null;

  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    standard: "sddefault",
    maxres: "maxresdefault",
  };

  const qualitySuffix = qualityMap[quality] || qualityMap.high;

  return `https://img.youtube.com/vi/${videoId}/${qualitySuffix}.jpg`;
}
