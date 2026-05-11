import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_request, { user }) => {
  const serviceSupabase = createServiceRoleClient();

  const { data: feeds, error: feedsError } = await serviceSupabase
    .from("feeds")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (feedsError) {
    console.error("Error fetching feeds:", feedsError);
    return ApiResponse.error(`Failed to fetch feeds: ${feedsError.message}`);
  }

  const activeFeedIds = feeds.map((f) => f.id);

  const hasFeeds = activeFeedIds.length > 0;

  const [{ data: recentRssItems, error: rssError }, { data: recentYoutubeItems, error: youtubeError }] =
    await Promise.all([
      hasFeeds
        ? serviceSupabase
            .from("rss_items")
            .select("*, feed:feeds(id, title)")
            .in("feed_id", activeFeedIds)
            .order("published_at", { ascending: false })
            .limit(100)
        : { data: [], error: null },
      hasFeeds
        ? serviceSupabase
            .from("youtube_items")
            .select("*, feed:feeds(id, title)")
            .in("feed_id", activeFeedIds)
            .order("published_at", { ascending: false })
            .limit(100)
        : { data: [], error: null },
    ]);

  if (rssError || youtubeError) {
    console.error("Error fetching recent items:", rssError || youtubeError);
    return ApiResponse.error("Failed to fetch recent items");
  }

  const { data: interactions } = await serviceSupabase
    .from("user_interactions")
    .select("is_read, is_favorite, is_read_later")
    .eq("user_id", user.id);

  const stats = {
    totalFeeds: feeds?.length ?? 0,
    totalRead: interactions?.filter((i) => i.is_read).length ?? 0,
    totalFavorites: interactions?.filter((i) => i.is_favorite).length ?? 0,
    totalReadLater: interactions?.filter((i) => i.is_read_later).length ?? 0,
  };

  const recentItems = [
    ...(recentRssItems ?? []).map((item) => ({ ...item, type: "rss" })),
    ...(recentYoutubeItems ?? []).map((item) => ({ ...item, type: "youtube" })),
  ]
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 200);

  return ApiResponse.ok({ feeds: feeds ?? [], stats, recentItems });
});
