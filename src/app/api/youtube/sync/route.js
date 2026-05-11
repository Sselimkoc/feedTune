import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import Parser from "rss-parser";

const BATCH_SIZE = 20;

const feedParser = new Parser({
  customFields: {
    item: [
      ["media:group", "mediaGroup"],
      ["media:thumbnail", "thumbnail"],
    ],
  },
});

function extractChannelId(url) {
  if (!url) return null;
  if (url.includes("/channel/"))
    return url.split("/channel/")[1]?.split(/[/?#]/)[0] ?? null;
  if (url.includes("/@"))
    return url.split("/@")[1]?.split(/[/?#]/)[0] ?? null;
  if (url.includes("/user/"))
    return url.split("/user/")[1]?.split(/[/?#]/)[0] ?? null;
  return null;
}

async function updateFeedTimestamp(supabase, feedId) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("feeds")
    .update({ last_fetched: now, updated_at: now })
    .eq("id", feedId);
  if (error) console.error("[youtube/sync] timestamp update error:", error);
}

async function parseRssFeed(feedUrl) {
  return await feedParser.parseURL(feedUrl);
}

export const POST = withAuth(async (request, { user }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { feedId } = body;
  if (!feedId) return ApiResponse.badRequest("feedId is required");

  const supabase = createServiceRoleClient();

  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .select("id, title, url, type")
    .eq("id", feedId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (feedError) {
    console.error("[youtube/sync] feed fetch error:", feedError);
    return ApiResponse.error(feedError.message);
  }
  if (!feed) return ApiResponse.notFound("Feed not found");
  if (feed.type !== "youtube")
    return ApiResponse.badRequest("Feed is not a YouTube feed");

  // Build RSS URL
  let feedUrl = feed.url;
  if (!feedUrl.includes("feeds/videos.xml")) {
    const channelId = extractChannelId(feedUrl);
    if (!channelId)
      return ApiResponse.badRequest("Could not extract channel ID from feed URL");
    feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }

  let rssFeed;
  try {
    rssFeed = await parseRssFeed(feedUrl);
  } catch (error) {
    console.error("[youtube/sync] RSS parse error:", error);
    return ApiResponse.error(`Could not fetch RSS feed: ${error.message}`);
  }

  if (!Array.isArray(rssFeed?.items)) {
    return ApiResponse.error("Invalid RSS feed content");
  }

  const youtubeItems = rssFeed.items
    .map((item) => {
      let videoId = "";
      if (item.id) {
        const parts = item.id.split(":");
        videoId = parts[parts.length - 1];
      } else if (item.link) {
        try {
          videoId = new URL(item.link).searchParams.get("v") ?? "";
        } catch {}
      }
      if (!videoId) return null;

      return {
        feed_id: feedId,
        video_id: videoId,
        title: item.title || "Untitled Video",
        url: item.link || `https://www.youtube.com/watch?v=${videoId}`,
        description: item.description || item.summary || "",
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channel_title: feed.title || rssFeed.title,
        published_at: item.pubDate || item.isoDate || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  // Skip already-stored videos
  const { data: existingItems, error: existingError } = await supabase
    .from("youtube_items")
    .select("video_id")
    .eq("feed_id", feedId);

  if (existingError) {
    console.error("[youtube/sync] existing items check error:", existingError);
    return ApiResponse.error(existingError.message);
  }

  const existingIds = new Set(existingItems?.map((i) => i.video_id) ?? []);
  const newItems = youtubeItems.filter((i) => !existingIds.has(i.video_id));

  await updateFeedTimestamp(supabase, feedId);

  if (newItems.length === 0) {
    return ApiResponse.ok({ inserted: 0, total: rssFeed.items.length });
  }

  // Batch insert
  let insertedCount = 0;
  const errors = [];

  for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
    const batch = newItems.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("youtube_items")
      .insert(batch)
      .select("id");

    if (error) {
      console.error(`[youtube/sync] batch ${i / BATCH_SIZE + 1} error:`, error);
      errors.push({ batch: i / BATCH_SIZE + 1, error: error.message });
    } else {
      insertedCount += data?.length ?? batch.length;
    }
  }

  return ApiResponse.ok({
    inserted: insertedCount,
    total: rssFeed.items.length,
    ...(errors.length ? { errors } : {}),
  });
});

export const GET = withAuth(async () => {
  return ApiResponse.ok({ status: "available" });
});
