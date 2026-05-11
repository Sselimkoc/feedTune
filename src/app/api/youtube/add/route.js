import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { getChannelInfo } from "@/lib/youtube";
import { createRssUrl } from "@/lib/youtube/utils";
import Parser from "rss-parser";

const feedParser = new Parser({
  customFields: {
    item: [
      ["media:group", "mediaGroup"],
      ["media:thumbnail", "thumbnail"],
    ],
  },
});

async function syncInitialVideos(supabase, feedId, rssUrl) {
  try {
    const feed = await feedParser.parseURL(rssUrl);
    const items = (feed.items ?? []).slice(0, 20).map((item) => {
      let videoId = "";
      if (item.id) {
        const parts = item.id.split(":");
        videoId = parts[parts.length - 1];
      } else if (item.link) {
        try { videoId = new URL(item.link).searchParams.get("v") ?? ""; } catch {}
      }
      if (!videoId) return null;
      return {
        feed_id: feedId,
        video_id: videoId,
        title: item.title || "Untitled Video",
        url: item.link || `https://www.youtube.com/watch?v=${videoId}`,
        description: item.mediaGroup?.["media:description"]?.[0] || item.description || item.summary || "",
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        channel_title: feed.title || "",
        published_at: item.pubDate || item.isoDate || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }).filter(Boolean);

    if (items.length) {
      await supabase.from("youtube_items").insert(items);
    }
  } catch (e) {
    console.error("[youtube/add] initial sync error:", e);
  }
}

export const POST = withAuth(async (request, { user }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { channelId, title, description, thumbnail } = body;
  if (!channelId) return ApiResponse.badRequest("channelId is required");

  const supabase = createServiceRoleClient();

  // Use prefetched info if provided (avoids redundant API call + quota)
  let channelInfo;
  if (title) {
    channelInfo = {
      title,
      description: description || "",
      thumbnail: thumbnail || "",
      rssUrl: createRssUrl(channelId),
    };
  } else {
    try {
      channelInfo = await getChannelInfo(channelId);
    } catch (error) {
      console.error("[youtube/add] getChannelInfo error:", error);
      return ApiResponse.error(error.message || "Failed to fetch channel info");
    }
  }

  const feedUrl = channelInfo.rssUrl;
  if (!feedUrl) return ApiResponse.badRequest("Invalid channel ID");

  // Check for existing (including soft-deleted) feed
  const { data: existingFeed } = await supabase
    .from("feeds")
    .select("id, deleted_at")
    .eq("url", feedUrl)
    .eq("user_id", user.id)
    .maybeSingle();

  let feed;

  if (existingFeed) {
    if (!existingFeed.deleted_at) {
      return ApiResponse.error("This YouTube channel is already in your feeds");
    }
    // Restore soft-deleted feed
    const { data: restored, error } = await supabase
      .from("feeds")
      .update({
        deleted_at: null,
        title: channelInfo.title,
        icon: channelInfo.thumbnail,
        description: channelInfo.description,
        channel_id: channelId,
      })
      .eq("id", existingFeed.id)
      .select("*")
      .single();

    if (error) return ApiResponse.error("Failed to restore YouTube channel");
    feed = restored;
  } else {
    const { data: newFeed, error } = await supabase
      .from("feeds")
      .insert({
        user_id: user.id,
        title: channelInfo.title,
        url: feedUrl,
        type: "youtube",
        icon: channelInfo.thumbnail,
        description: channelInfo.description,
        channel_id: channelId,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[youtube/add] insert error:", error);
      return ApiResponse.error("Failed to add YouTube channel");
    }
    feed = newFeed;
  }

  // Sync initial videos in the background (non-blocking)
  syncInitialVideos(supabase, feed.id, feedUrl);

  return ApiResponse.ok({ feed }, 201);
});
