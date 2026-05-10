import { youtubeService } from "@/lib/youtube/service";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

async function insertYoutubeItems(supabase, feedId, items) {
  let insertedCount = 0;

  for (const item of items) {
    const videoId = item.videoId || item.video_id;
    if (!videoId) continue;

    const { error } = await supabase.from("youtube_items").insert({
      feed_id: feedId,
      video_id: videoId,
      title: item.title || "Untitled Video",
      description: item.description ? item.description.substring(0, 500) : null,
      thumbnail: item.thumbnail || item.image || null,
      published_at: item.pubDate || item.publishedAt || new Date().toISOString(),
      channel_title: item.author || item.channelTitle || null,
      url: item.link || `https://youtube.com/watch?v=${videoId}`,
      created_at: new Date().toISOString(),
    });

    if (!error) {
      insertedCount++;
    } else if (error.code !== "23505") {
      console.error("[youtube/add] item insert error:", error);
    }
  }

  return insertedCount;
}

export const POST = withAuth(async (request, { user }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { channelId } = body;
  if (!channelId) return ApiResponse.badRequest("channelId is required");

  const supabase = createServerSupabaseClient();

  try {
    const newFeed = await youtubeService.addYoutubeChannel(
      channelId,
      user.id,
      (feedId, items) => insertYoutubeItems(supabase, feedId, items)
    );

    return ApiResponse.ok({ feed: newFeed }, 201);
  } catch (error) {
    console.error("[youtube/add] error:", error);
    return ApiResponse.error(error.message || "Failed to add YouTube channel");
  }
});
