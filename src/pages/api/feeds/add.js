import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import Parser from "rss-parser";
import axios from "axios";
import { extractDomain } from "@/lib/utils";

// Create parser instance
const parser = new Parser({
  timeout: 10000, // 10 seconds timeout
  headers: {
    "User-Agent": "FeedTune/1.0 (https://feedtune.app)",
    Accept:
      "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html",
  },
});

/**
 * API Route for adding a new feed to the user's collection
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Create authenticated Supabase client
  const supabase = createServerSupabaseClient({ req, res });

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { title, url, type, category, fetch_full_content } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!type || !["rss", "youtube"].includes(type)) {
    return res.status(400).json({ error: "Valid feed type is required" });
  }

  try {
    // Check if the feed already exists for this user
    const { data: existingFeeds } = await supabase
      .from("feeds")
      .select("id, url")
      .eq("user_id", session.user.id)
      .eq("url", url);

    if (existingFeeds && existingFeeds.length > 0) {
      return res
        .status(409)
        .json({ error: "Feed already exists in your collection" });
    }

    // Validate the feed
    let feedData;
    let feedMetadata;

    if (type === "rss") {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            "User-Agent": "FeedTune/1.0 (https://feedtune.app)",
            Accept:
              "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html",
          },
        });

        feedData = await parser.parseString(response.data);

        feedMetadata = {
          title: title || feedData.title || "Untitled Feed",
          description: feedData.description || "",
          link: feedData.link || url,
          image: feedData.image?.url || feedData.image || null,
          domain: extractDomain(feedData.link || url),
          language: feedData.language || "en",
          last_updated: new Date().toISOString(),
        };
      } catch (error) {
        console.error("RSS parsing error:", error);
        return res.status(422).json({ error: "Invalid RSS feed format" });
      }
    } else if (type === "youtube") {
      // For YouTube, extract the channel ID from the URL
      const channelId = extractYoutubeChannelId(url);

      if (!channelId) {
        return res.status(422).json({ error: "Invalid YouTube channel URL" });
      }

      // Construct feed URL
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

      try {
        const response = await axios.get(rssUrl, {
          timeout: 10000,
          headers: {
            "User-Agent": "FeedTune/1.0 (https://feedtune.app)",
            Accept:
              "application/rss+xml, application/xml, text/xml, application/atom+xml",
          },
        });

        feedData = await parser.parseString(response.data);

        feedMetadata = {
          title: title || feedData.title || "YouTube Channel",
          description: feedData.description || "",
          link: url,
          image: feedData.image?.url || null,
          domain: "youtube.com",
          language: feedData.language || "en",
          last_updated: new Date().toISOString(),
        };
      } catch (error) {
        console.error("YouTube feed error:", error);
        return res.status(422).json({ error: "Invalid YouTube channel" });
      }
    }

    // Insert the feed into the database
    const { data: feed, error } = await supabase
      .from("feeds")
      .insert([
        {
          user_id: session.user.id,
          title: feedMetadata.title,
          url:
            type === "youtube"
              ? `https://www.youtube.com/feeds/videos.xml?channel_id=${extractYoutubeChannelId(
                  url
                )}`
              : url,
          source_url: url,
          description: feedMetadata.description,
          image: feedMetadata.image,
          domain: feedMetadata.domain,
          type,
          category: category || "general",
          fetch_full_content: fetch_full_content || false,
          last_fetched: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to add feed to database" });
    }

    // Fetch the initial items for this feed
    // This would typically be done in a background job, but for simplicity
    // we'll just return success here and let the UI handle refreshing the feed

    return res.status(200).json({ success: true, feed });
  } catch (error) {
    console.error("Add feed error:", error);
    return res
      .status(500)
      .json({ error: `Failed to add feed: ${error.message}` });
  }
}

/**
 * Helper function to extract YouTube channel ID from a URL
 */
function extractYoutubeChannelId(url) {
  // If it's already a channel ID
  if (/^UC[\w-]{21,22}$/.test(url)) {
    return url;
  }

  try {
    const urlObj = new URL(url);

    // Check if it's a YouTube URL
    if (
      !["youtube.com", "www.youtube.com", "youtu.be"].includes(urlObj.hostname)
    ) {
      return null;
    }

    // Handle channel URL format
    const channelMatch = urlObj.pathname.match(/\/channel\/(UC[\w-]{21,22})/);
    if (channelMatch) {
      return channelMatch[1];
    }

    // If it's a user or custom URL, we need API to resolve it
    // This is simplified and would need the YouTube API to fully resolve
    return null;
  } catch (error) {
    return null;
  }
}
