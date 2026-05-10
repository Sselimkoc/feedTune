import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

const BATCH_SIZE = 20;

export const POST = withAuth(async (request, { user }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { feedId, items } = body;

  if (!feedId || !Array.isArray(items) || items.length === 0) {
    return ApiResponse.badRequest("feedId and non-empty items array are required");
  }

  const supabase = createServerSupabaseClient();

  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .select("user_id, type")
    .eq("id", feedId)
    .maybeSingle();

  if (feedError) {
    console.error("[youtube-items/add] feed check error:", feedError);
    return ApiResponse.error(feedError.message);
  }
  if (!feed) return ApiResponse.notFound("Feed not found");
  if (feed.user_id !== user.id) return ApiResponse.forbidden();
  if (feed.type !== "youtube") return ApiResponse.badRequest("Feed is not a YouTube feed");

  const { data: existing, error: existingError } = await supabase
    .from("youtube_items")
    .select("video_id")
    .eq("feed_id", feedId);

  if (existingError) {
    console.error("[youtube-items/add] existing check error:", existingError);
    return ApiResponse.error(existingError.message);
  }

  const existingIds = new Set(existing?.map((i) => i.video_id) ?? []);

  const newItems = items
    .map((item) => {
      let videoId = item.video_id;
      if (!videoId && item.url) {
        try {
          videoId = new URL(item.url).searchParams.get("v") ?? undefined;
        } catch {}
      }
      if (!videoId) return null;

      return {
        feed_id: feedId,
        video_id: videoId,
        title: item.title || "Untitled Video",
        description: item.description ? item.description.substring(0, 500) : null,
        thumbnail: item.thumbnail || item.image || null,
        published_at: item.published_at || item.pubDate || new Date().toISOString(),
        channel_title: item.channel_title || item.channelTitle || null,
        url: item.url || `https://youtube.com/watch?v=${videoId}`,
        created_at: new Date().toISOString(),
      };
    })
    .filter(Boolean)
    .filter((item) => !existingIds.has(item.video_id));

  if (newItems.length === 0) {
    return ApiResponse.ok({ inserted: 0 });
  }

  let insertedCount = 0;
  const errors = [];

  for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
    const batch = newItems.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("youtube_items").insert(batch);

    if (error) {
      console.error(`[youtube-items/add] batch ${i / BATCH_SIZE + 1} error:`, error);
      errors.push({ batch: i / BATCH_SIZE + 1, error: error.message });
    } else {
      insertedCount += batch.length;
    }
  }

  return ApiResponse.ok({
    inserted: insertedCount,
    ...(errors.length ? { errors } : {}),
  });
});

export function GET() {
  return ApiResponse.ok({ status: "available" });
}
