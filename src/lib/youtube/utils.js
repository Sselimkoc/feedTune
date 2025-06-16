/**
 * YouTube Utility Functions
 */

/**
 * Extracts a YouTube channel ID from various YouTube URL formats
 * @param {string} url - The YouTube URL or channel ID
 * @returns {string|null} - The channel ID or null if not found
 */
export function extractChannelId(url) {
  if (!url) return null;

  // If it's already a channel ID (UC...)
  if (/^UC[\w-]{21,22}$/.test(url)) {
    return url;
  }

  try {
    // Ensure we have a valid URL
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      // If not a valid URL and doesn't include http(s), try adding https://
      if (!url.startsWith("http")) {
        try {
          urlObj = new URL(`https://${url}`);
        } catch (e2) {
          return null;
        }
      } else {
        return null;
      }
    }

    // Check if it's a YouTube URL
    if (
      !["youtube.com", "www.youtube.com", "youtu.be"].includes(urlObj.hostname)
    ) {
      return null;
    }

    // Extract from /channel/UCXXX format
    const channelMatch = urlObj.pathname.match(/\/channel\/(UC[\w-]{21,22})/);
    if (channelMatch) {
      return channelMatch[1];
    }

    // Cannot extract from other URL formats without API
    return null;
  } catch (error) {
    console.error("Error extracting YouTube channel ID:", error);
    return null;
  }
}

/**
 * Creates a YouTube RSS feed URL from a channel ID
 * @param {string} channelId - The YouTube channel ID
 * @returns {string|null} - The RSS feed URL or null if invalid
 */
export function createRssUrl(channelId) {
  if (!channelId) return null;

  // Validate channel ID format
  if (!/^UC[\w-]{21,22}$/.test(channelId)) {
    return null;
  }

  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

/**
 * Extracts a YouTube video ID from a URL or string
 * @param {string} url - The URL or string containing a video ID
 * @returns {string|null} - The video ID or null if not found
 */
export function extractVideoId(url) {
  if (!url) return null;

  // Check for standard YouTube URL formats
  const patterns = [
    // youtu.be/ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/,
    // youtube.com/watch?v=ID
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:&|$)/,
    // youtube.com/embed/ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/,
    // youtube.com/v/ID
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/,
    // youtube.com/shorts/ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/,
    // yt.be/ID (shortened URLs)
    /yt\.be\/([a-zA-Z0-9_-]{11})(?:\?|\/|$)/,
    // Direct ID pattern
    /^([a-zA-Z0-9_-]{11})$/,
    // yt:video:ID format in RSS feeds
    /yt:video:([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Creates a YouTube thumbnail URL for a video ID
 * @param {string} videoId - The YouTube video ID
 * @param {string} quality - The thumbnail quality (default, mqdefault, hqdefault, sddefault, maxresdefault)
 * @returns {string|null} - The thumbnail URL or null if invalid
 */
export function createThumbnailUrl(videoId, quality = "hqdefault") {
  if (!videoId) return null;

  // Validate video ID format
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return null;
  }

  // Validate quality option
  const validQualities = [
    "default",
    "mqdefault",
    "hqdefault",
    "sddefault",
    "maxresdefault",
  ];
  const thumbnailQuality = validQualities.includes(quality)
    ? quality
    : "hqdefault";

  return `https://i.ytimg.com/vi/${videoId}/${thumbnailQuality}.jpg`;
}

/**
 * Formats a YouTube video duration from ISO 8601 format
 * @param {string} isoDuration - The ISO 8601 duration (e.g. PT1H30M15S)
 * @returns {string} - The formatted duration (e.g. 1:30:15)
 */
export function formatDuration(isoDuration) {
  if (!isoDuration) return "";

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return "";

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

/**
 * Formats a view count to a human-readable string
 * @param {string|number} count - The view count
 * @returns {string} - The formatted count (e.g. 1.2M, 5.7K)
 */
export function formatViewCount(count) {
  if (!count) return "0";

  const num = typeof count === "string" ? parseInt(count) : count;

  if (isNaN(num)) return "0";

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}

/**
 * Generates a YouTube video URL from a video ID
 * @param {string} videoId - The YouTube video ID
 * @returns {string|null} - The video URL or null if invalid
 */
export function createVideoUrl(videoId) {
  if (!videoId) return null;

  // Validate video ID format
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Generates a YouTube channel URL from a channel ID
 * @param {string} channelId - The YouTube channel ID
 * @returns {string|null} - The channel URL or null if invalid
 */
export function createChannelUrl(channelId) {
  if (!channelId) return null;

  // Validate channel ID format
  if (!/^UC[\w-]{21,22}$/.test(channelId)) {
    return null;
  }

  return `https://www.youtube.com/channel/${channelId}`;
}

/**
 * Detects if a YouTube URL is for a Shorts video
 * @param {string} url - The YouTube URL
 * @returns {boolean} - Whether it's a Shorts video
 */
export function isYoutubeShorts(url) {
  if (!url) return false;

  try {
    return url.includes("/shorts/");
  } catch (error) {
    return false;
  }
}
