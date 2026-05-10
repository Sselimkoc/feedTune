import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get favorite interaction records
    const { data: favoriteInteractions, error: interactionsError } = await supabase
      .from("user_interactions")
      .select("id,item_id,item_type,is_favorite,is_read_later,created_at")
      .eq("user_id", userId)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false });

    if (interactionsError) {
      console.error("Error fetching favorites:", interactionsError);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 }
      );
    }

    const rssIds = favoriteInteractions
      .filter((interaction) => interaction.item_type === "rss")
      .map((interaction) => interaction.item_id);
    const youtubeIds = favoriteInteractions
      .filter((interaction) => interaction.item_type === "youtube")
      .map((interaction) => interaction.item_id);

    const [rssResult, youtubeResult] = await Promise.all([
      rssIds.length
        ? supabase
            .from("rss_items")
            .select("id,title,description,url,thumbnail,published_at,feed_id,feeds(id,title,icon,type)")
            .in("id", rssIds)
        : { data: [], error: null },
      youtubeIds.length
        ? supabase
            .from("youtube_items")
            .select("id,title,description,url,thumbnail,published_at,feed_id,feeds(id,title,icon,type)")
            .in("id", youtubeIds)
        : { data: [], error: null },
    ]);

    if (rssResult.error || youtubeResult.error) {
      console.error("Error fetching favorite item data:", rssResult.error || youtubeResult.error);
      return NextResponse.json(
        { error: "Failed to fetch favorite items" },
        { status: 500 }
      );
    }

    const rssItemMap = new Map(rssResult.data.map((item) => [item.id, item]));
    const youtubeItemMap = new Map(youtubeResult.data.map((item) => [item.id, item]));

    const transformedItems = favoriteInteractions
      .map((interaction) => {
        const item =
          interaction.item_type === "rss"
            ? rssItemMap.get(interaction.item_id)
            : youtubeItemMap.get(interaction.item_id);

        if (!item) return null;

        const feed = item.feeds;

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          url: item.url,
          thumbnail: item.thumbnail,
          published_at: item.published_at,
          feed_id: item.feed_id,
          channelName: feed?.title || "",
          channelLogo: feed?.icon || "",
          type: interaction.item_type,
          is_favorite: interaction.is_favorite || true,
          is_read_later: interaction.is_read_later || false,
          created_at: interaction.created_at,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      items: transformedItems,
      count: transformedItems.length,
    });
  } catch (error) {
    console.error("Favorites API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
