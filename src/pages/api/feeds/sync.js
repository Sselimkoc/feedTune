import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import Parser from "rss-parser";
import axios from "axios";
import { extractDomain } from "@/lib/utils";
import { extractYoutubeChannelId } from "@/lib/youtube/utils";

// Create parser instance with extended options
const parser = new Parser({
  timeout: 15000, // 15 seconds timeout
  headers: {
    "User-Agent": "FeedTune/1.0 (https://feedtune.app)",
    Accept:
      "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html",
  },
  customFields: {
    item: [
      ["media:content", "media"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
    feed: ["image", "language"],
  },
});

/**
 * API Route for syncing a specific feed
 * POST /api/feeds/sync
 * Body: { feedId: string }
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

  const { feedId } = req.body;

  if (!feedId) {
    return res.status(400).json({ error: "Feed ID is required" });
  }

  try {
    // Check if the feed exists and belongs to the user
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .select("*")
      .eq("id", feedId)
      .eq("user_id", session.user.id)
      .single();

    if (feedError || !feed) {
      return res.status(404).json({ error: "Feed not found or access denied" });
    }

    // Check if the feed was recently updated (within the last minute)
    const lastUpdated = new Date(feed.last_fetched || 0);
    const now = new Date();
    const timeDiff = now - lastUpdated; // in milliseconds

    // If feed was updated less than 60 seconds ago, return cached data
    if (timeDiff < 60000 && req.body.force !== true) {
      return res.status(200).json({
        success: true,
        message: "Feed was recently updated",
        feed,
        cached: true,
        lastUpdated: feed.last_fetched,
      });
    }

    // Determine feed type (rss or youtube)
    const feedType = feed.type || "rss";

    // Fetch and parse the feed
    let feedData;
    let feedItems = [];

    try {
      // For both RSS and YouTube feeds, we'll fetch the XML
      const response = await axios.get(feed.url, {
        timeout: 15000,
        headers: {
          "User-Agent": "FeedTune/1.0 (https://feedtune.app)",
          Accept:
            "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html",
        },
      });

      feedData = await parser.parseString(response.data);

      if (!feedData || !feedData.items) {
        return res
          .status(422)
          .json({ error: "Invalid feed format or empty feed" });
      }

      // Process the items based on feed type
      if (feedType === "youtube") {
        feedItems = await processYoutubeItems(feedData.items, feed);
      } else {
        feedItems = await processRssItems(feedData.items, feed);
      }

      // Update the feed metadata
      await supabase
        .from("feeds")
        .update({
          title: feed.title || feedData.title || "Untitled Feed",
          description: feed.description || feedData.description || "",
          link: feedData.link || feed.url,
          image: feedData.image?.url || feed.image || null,
          domain: extractDomain(feedData.link || feed.url),
          language: feedData.language || "en",
          last_fetched: now.toISOString(),
          last_updated: now.toISOString(),
          item_count: feedItems.length,
        })
        .eq("id", feed.id);

      // For each item, insert or update
      const insertResults = await insertFeedItems(
        supabase,
        feedItems,
        feed.id,
        session.user.id,
        feedType
      );

      return res.status(200).json({
        success: true,
        message: "Feed successfully synced",
        insertedCount: insertResults.inserted,
        updatedCount: insertResults.updated,
        itemCount: feedItems.length,
        feed: {
          ...feed,
          last_fetched: now.toISOString(),
          last_updated: now.toISOString(),
          item_count: feedItems.length,
        },
      });
    } catch (fetchError) {
      console.error("Feed fetching error:", fetchError);

      // Update the last fetch attempt even if it failed
      await supabase
        .from("feeds")
        .update({
          last_fetched: now.toISOString(),
          error_message: fetchError.message || "Failed to fetch feed",
          error_count: (feed.error_count || 0) + 1,
        })
        .eq("id", feed.id);

      return res.status(422).json({
        error: "Failed to fetch feed content",
        details: fetchError.message,
        feed: {
          ...feed,
          last_fetched: now.toISOString(),
          error_message: fetchError.message || "Failed to fetch feed",
          error_count: (feed.error_count || 0) + 1,
        },
      });
    }
  } catch (error) {
    console.error("Feed sync error:", error);
    return res
      .status(500)
      .json({ error: `Failed to sync feed: ${error.message}` });
  }
}

/**
 * Process RSS feed items
 */
async function processRssItems(items, feed) {
  // Limit to 50 items max
  const limitedItems = items.slice(0, 50);

  return limitedItems.map((item) => {
    // Extract thumbnail from media, enclosures, or content
    const thumbnail = extractImageFromItem(item);

    // Parse date correctly
    const pubDate = item.pubDate || item.isoDate || new Date().toISOString();

    return {
      feed_id: feed.id,
      title: item.title || "Untitled Item",
      description: item.contentSnippet || item.description || "",
      content: item.content || item.contentEncoded || item.description || "",
      link: item.link || "",
      pub_date: pubDate,
      guid: item.guid || item.id || item.link || "",
      thumbnail: thumbnail,
      author: item.creator || item.author || item.dc?.creator || "",
      created_at: new Date().toISOString(),
      type: "rss",
    };
  });
}

/**
 * Process YouTube feed items
 */
async function processYoutubeItems(items, feed) {
  // Limit to 30 items max for YouTube
  const limitedItems = items.slice(0, 30);

  return limitedItems.map((item) => {
    // Extract video ID from URL or guid
    const videoId = extractYoutubeVideoId(item.link || item.guid || "");

    // Use high quality thumbnail if available
    const thumbnail = videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : extractImageFromItem(item);

    // Parse date correctly
    const pubDate = item.pubDate || item.isoDate || new Date().toISOString();

    // YouTube items have special fields
    return {
      feed_id: feed.id,
      title: item.title || "Untitled Video",
      description: item.contentSnippet || item.description || "",
      content: item.content || item.contentEncoded || item.description || "",
      link: item.link || "",
      pub_date: pubDate,
      guid: item.guid || item.id || item.link || "",
      thumbnail: thumbnail,
      author: item.author || item.creator || item.dc?.creator || "",
      created_at: new Date().toISOString(),
      video_id: videoId,
      type: "youtube",
    };
  });
}

/**
 * Insert or update feed items in the database
 */
async function insertFeedItems(supabase, items, feedId, userId, feedType) {
  let inserted = 0;
  let updated = 0;

  // Use the appropriate items table based on feed type
  const tableName = feedType === "youtube" ? "youtube_items" : "rss_items";

  // Process items in batches to avoid exceeding limits
  const batchSize = 10;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // For each item in the batch, check if it already exists (by guid/link)
    for (const item of batch) {
      const { data: existingItems, error: selectError } = await supabase
        .from(tableName)
        .select("id, guid")
        .eq("feed_id", feedId)
        .eq("guid", item.guid)
        .limit(1);

      if (selectError) {
        console.error(`Error checking existing item: ${selectError.message}`);
        continue;
      }

      if (existingItems?.length > 0) {
        // Update existing item
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            title: item.title,
            description: item.description,
            content: item.content,
            link: item.link,
            thumbnail: item.thumbnail,
            pub_date: item.pub_date,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingItems[0].id);

        if (!updateError) {
          updated++;
        } else {
          console.error(`Error updating item: ${updateError.message}`);
        }
      } else {
        // Insert new item
        const { error: insertError } = await supabase.from(tableName).insert({
          ...item,
          user_id: userId,
        });

        if (!insertError) {
          inserted++;
        } else {
          console.error(`Error inserting item: ${insertError.message}`);
        }
      }
    }
  }

  return { inserted, updated };
}

/**
 * Extract image URL from a feed item
 */
function extractImageFromItem(item) {
  // Check media:content
  if (item.media && item.media.$ && item.media.$.url) {
    return item.media.$.url;
  }

  // Check media:thumbnail
  if (
    item.mediaThumbnail &&
    item.mediaThumbnail.$ &&
    item.mediaThumbnail.$.url
  ) {
    return item.mediaThumbnail.$.url;
  }

  // Check enclosure
  if (
    item.enclosure &&
    item.enclosure.url &&
    item.enclosure.type &&
    item.enclosure.type.startsWith("image/")
  ) {
    return item.enclosure.url;
  }

  // Try to extract from content
  const content = item.content || item.contentEncoded || item.description || "";
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Extract YouTube video ID from a URL or guid
 */
function extractYoutubeVideoId(url) {
  if (!url) return null;

  // Check for standard YouTube URL
  let match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }

  // Check for YouTube RSS feed format (yt:video:ID)
  match = url.match(/yt:video:([^"&?\/ ]{11})/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}
