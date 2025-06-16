import axios from "axios";

/**
 * API Route for searching YouTube channels
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  // Get YouTube API key from environment variables
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("Missing YouTube API key");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Check if query is a channel URL or ID
    const channelId = extractChannelId(query);

    if (channelId) {
      // If it's a channel ID or URL, fetch that specific channel
      return await getChannelById(channelId, apiKey, res);
    }

    // Otherwise, search for channels
    const searchUrl = "https://www.googleapis.com/youtube/v3/search";
    const response = await axios.get(searchUrl, {
      params: {
        part: "snippet",
        q: query,
        type: "channel",
        maxResults: 10,
        key: apiKey,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(200).json({ channels: [] });
    }

    // Extract channel IDs from search results
    const channelIds = response.data.items.map(
      (item) => item.snippet.channelId
    );

    // Get detailed information for these channels
    const channelsUrl = "https://www.googleapis.com/youtube/v3/channels";
    const channelsResponse = await axios.get(channelsUrl, {
      params: {
        part: "snippet,statistics,contentDetails",
        id: channelIds.join(","),
        maxResults: 10,
        key: apiKey,
      },
    });

    if (!channelsResponse.data.items) {
      return res.status(200).json({ channels: [] });
    }

    // Process and format channel data
    const channels = channelsResponse.data.items.map((channel) => ({
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnail:
        channel.snippet.thumbnails.high?.url ||
        channel.snippet.thumbnails.medium?.url ||
        channel.snippet.thumbnails.default?.url,
      statistics: {
        subscriberCount: parseInt(channel.statistics.subscriberCount, 10),
        videoCount: parseInt(channel.statistics.videoCount, 10),
        viewCount: parseInt(channel.statistics.viewCount, 10),
      },
      publishedAt: channel.snippet.publishedAt,
      country: channel.snippet.country || null,
      rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`,
    }));

    return res.status(200).json({ channels });
  } catch (error) {
    console.error("YouTube API error:", error);

    // Handle rate limit errors
    if (error.response?.status === 403) {
      return res
        .status(429)
        .json({ error: "YouTube API quota exceeded. Please try again later." });
    }

    return res
      .status(500)
      .json({ error: `Error searching YouTube: ${error.message}` });
  }
}

/**
 * Helper function to get a specific channel by ID
 */
async function getChannelById(channelId, apiKey, res) {
  try {
    const channelsUrl = "https://www.googleapis.com/youtube/v3/channels";
    const response = await axios.get(channelsUrl, {
      params: {
        part: "snippet,statistics,contentDetails",
        id: channelId,
        key: apiKey,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const channel = response.data.items[0];
    const formattedChannel = {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnail:
        channel.snippet.thumbnails.high?.url ||
        channel.snippet.thumbnails.medium?.url ||
        channel.snippet.thumbnails.default?.url,
      statistics: {
        subscriberCount: parseInt(channel.statistics.subscriberCount, 10),
        videoCount: parseInt(channel.statistics.videoCount, 10),
        viewCount: parseInt(channel.statistics.viewCount, 10),
      },
      publishedAt: channel.snippet.publishedAt,
      country: channel.snippet.country || null,
      rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`,
    };

    return res.status(200).json({ channels: [formattedChannel] });
  } catch (error) {
    console.error("YouTube API error:", error);
    return res
      .status(500)
      .json({ error: `Error fetching YouTube channel: ${error.message}` });
  }
}

/**
 * Helper function to extract channel ID from various YouTube URL formats or @username
 */
function extractChannelId(input) {
  // If input is already a channel ID (starts with UC and 22 chars in length)
  if (/^UC[\w-]{21,22}$/.test(input)) {
    return input;
  }

  // Handle @username format
  if (input.startsWith("@")) {
    // We'll need to handle this via a channel lookup by username in the main function
    return null;
  }

  try {
    const url = input.includes("://")
      ? new URL(input)
      : new URL(`https://${input}`);

    // Handle youtube.com URLs
    if (url.hostname === "youtube.com" || url.hostname === "www.youtube.com") {
      // Handle /channel/ID format
      const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]{21,22})/);
      if (channelMatch) {
        return channelMatch[1];
      }

      // Handle /c/customname or /user/username format - these require additional API lookups
      return null;
    }

    // Handle youtu.be URLs - these are typically for videos, not channels
    return null;
  } catch (error) {
    // If it's not a valid URL, it's not a channel ID we can extract
    return null;
  }
}
