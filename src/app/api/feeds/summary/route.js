import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_request, { user }) => {
  const serviceSupabase = createServiceRoleClient();

  const [{ data: feeds, error: feedsError }, { data: interactions }] =
    await Promise.all([
      serviceSupabase
        .from("feeds")
        .select("id, type")
        .eq("user_id", user.id)
        .is("deleted_at", null),
      serviceSupabase
        .from("user_interactions")
        .select("is_read, is_favorite, is_read_later")
        .eq("user_id", user.id),
    ]);

  if (feedsError) {
    console.error("[feeds/summary] error:", feedsError);
    return ApiResponse.error(feedsError.message);
  }

  return ApiResponse.ok({
    totalFeeds: feeds?.length ?? 0,
    rssFeeds: feeds?.filter((f) => f.type === "rss").length ?? 0,
    youtubeFeeds: feeds?.filter((f) => f.type === "youtube").length ?? 0,
    totalRead: interactions?.filter((i) => i.is_read).length ?? 0,
    totalFavorites: interactions?.filter((i) => i.is_favorite).length ?? 0,
    totalReadLater: interactions?.filter((i) => i.is_read_later).length ?? 0,
  });
});
