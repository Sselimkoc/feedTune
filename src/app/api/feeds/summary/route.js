import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase-server";
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
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Service role client kullan
    const serviceSupabase = createServiceRoleClient();

    // Only get feeds count and recent items summary
    const { data: feeds, error: feedsError } = await serviceSupabase
      .from("feeds")
      .select("id, type")
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (feedsError) throw feedsError;

    // Get stats only
    const { data: interactions } = await serviceSupabase
      .from("user_interactions")
      .select("is_read, is_favorite, is_read_later")
      .eq("user_id", user.id);

    const stats = {
      totalFeeds: feeds?.length || 0,
      totalRead: interactions?.filter((i) => i.is_read).length || 0,
      totalFavorites: interactions?.filter((i) => i.is_favorite).length || 0,
      totalReadLater: interactions?.filter((i) => i.is_read_later).length || 0,
      rssFeeds: feeds?.filter((f) => f.type === "rss").length || 0,
      youtubeFeeds: feeds?.filter((f) => f.type === "youtube").length || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Feeds summary error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
