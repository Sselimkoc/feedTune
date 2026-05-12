import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_request, { user }) => {
  const serviceSupabase = createServiceRoleClient();

  const [
    { data: feeds, error: feedsError },
    { data: interactions },
    { count: rssItemCount },
    { count: ytItemCount },
  ] = await Promise.all([
    serviceSupabase
      .from("feeds")
      .select("id, type")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    serviceSupabase
      .from("user_interactions")
      .select("is_read, is_favorite, is_read_later")
      .eq("user_id", user.id),
    serviceSupabase
      .from("rss_items")
      .select("id", { count: "exact", head: true })
      .in("feed_id", []),
    serviceSupabase
      .from("youtube_items")
      .select("id", { count: "exact", head: true })
      .in("feed_id", []),
  ]);

  if (feedsError) {
    console.error("[feeds/summary] error:", feedsError);
    return ApiResponse.error(feedsError.message);
  }

  const feedIds = feeds?.map((f) => f.id) ?? [];

  let totalItems = 0;
  if (feedIds.length > 0) {
    const [{ count: rss }, { count: yt }] = await Promise.all([
      serviceSupabase
        .from("rss_items")
        .select("id", { count: "exact", head: true })
        .in("feed_id", feedIds),
      serviceSupabase
        .from("youtube_items")
        .select("id", { count: "exact", head: true })
        .in("feed_id", feedIds),
    ]);
    totalItems = (rss ?? 0) + (yt ?? 0);
  }

  return ApiResponse.ok({
    totalFeeds: feeds?.length ?? 0,
    rssFeeds: feeds?.filter((f) => f.type === "rss").length ?? 0,
    youtubeFeeds: feeds?.filter((f) => f.type === "youtube").length ?? 0,
    totalItems,
    totalRead: interactions?.filter((i) => i.is_read).length ?? 0,
    totalFavorites: interactions?.filter((i) => i.is_favorite).length ?? 0,
    totalReadLater: interactions?.filter((i) => i.is_read_later).length ?? 0,
  });
});
