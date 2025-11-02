import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();

    // Authenticated user'ı al
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // Service role client kullan (backend operations için)
    const serviceSupabase = createServiceRoleClient();

    // User'ın feeds'lerini al
    const { data: feeds, error: feedsError } = await serviceSupabase
      .from("feeds")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (feedsError) {
      console.error("Error fetching feeds:", feedsError);
      return NextResponse.json(
        { error: `Failed to fetch feeds: ${feedsError.message}` },
        { status: 500 }
      );
    }

    // Recent items'ları al (son 30 gün)
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: recentRssItems, error: rssError } = await serviceSupabase
      .from("rss_items")
      .select("*, feed:feeds(id, title)")
      .gte("published_at", thirtyDaysAgo)
      .order("published_at", { ascending: false })
      .limit(50);

    const { data: recentYoutubeItems, error: youtubeError } =
      await serviceSupabase
        .from("youtube_items")
        .select("*, feed:feeds(id, title)")
        .gte("published_at", thirtyDaysAgo)
        .order("published_at", { ascending: false })
        .limit(50);

    if (rssError || youtubeError) {
      console.error("Error fetching recent items:", rssError || youtubeError);
      return NextResponse.json(
        { error: "Failed to fetch recent items" },
        { status: 500 }
      );
    }

    // Stats hesapla
    const { data: interactions, error: interactionsError } =
      await serviceSupabase
        .from("user_interactions")
        .select("*")
        .eq("user_id", user.id);

    const stats = {
      totalFeeds: feeds?.length || 0,
      totalRead: interactions?.filter((i) => i.is_read).length || 0,
      totalFavorites: interactions?.filter((i) => i.is_favorite).length || 0,
      totalReadLater: interactions?.filter((i) => i.is_read_later).length || 0,
    };

    // Items'ları birleştir ve sırala
    const allRecentItems = [
      ...(recentRssItems || []).map((item) => ({
        ...item,
        type: "rss",
      })),
      ...(recentYoutubeItems || []).map((item) => ({
        ...item,
        type: "youtube",
      })),
    ].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    return NextResponse.json({
      feeds: feeds || [],
      stats,
      recentItems: allRecentItems.slice(0, 30),
    });
  } catch (error) {
    console.error("Feeds API error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
