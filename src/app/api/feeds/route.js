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

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [{ data: recentRssItems, error: rssError }, { data: recentYoutubeItems, error: youtubeError }] =
    await Promise.all([
      serviceSupabase
        .from("rss_items")
        .select("*, feed:feeds(id, title)")
        .gte("published_at", thirtyDaysAgo)
        .order("published_at", { ascending: false })
        .limit(50),
      serviceSupabase
        .from("youtube_items")
        .select("*, feed:feeds(id, title)")
        .gte("published_at", thirtyDaysAgo)
        .order("published_at", { ascending: false })
        .limit(50),
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
    .slice(0, 30);

  return ApiResponse.ok({ feeds: feeds ?? [], stats, recentItems });
});
