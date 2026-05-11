import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { getChannelInfo } from "@/lib/youtube";
import { createRssUrl } from "@/lib/youtube/utils";

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

  return ApiResponse.ok({ feed }, 201);
});
