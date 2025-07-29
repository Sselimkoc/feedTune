import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Initialize Supabase client first
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Check if user is authenticated using the same client
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("API: User authenticated:", user.id);

    // Get user feeds using the same authenticated client
    const { data: feeds, error: feedsError } = await supabase
      .from("feeds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (feedsError) {
      console.error("Error fetching feeds:", feedsError);
      return NextResponse.json(
        { error: "Failed to fetch feeds" },
        { status: 500 }
      );
    }

    // If no feeds, return early with empty data
    if (!feeds || feeds.length === 0) {
      return NextResponse.json({
        feeds: [],
        stats: {
          feeds: 0,
          favorites: 0,
          readLater: 0,
          unread: 0,
        },
        recentItems: [],
      });
    }

    // Get feed IDs
    const feedIds = feeds.map((feed) => feed.id);

    // Get recent RSS items
    const { data: rssItems, error: rssError } = await supabase
      .from("rss_items")
      .select(
        "id, title, description, url, published_at, guid, thumbnail, author, feed_title, feed_id"
      )
      .in("feed_id", feedIds)
      .order("published_at", { ascending: false })
      .limit(10);

    if (rssError) {
      console.error("Error fetching RSS items:", rssError);
    }

    // Get recent YouTube items
    const { data: youtubeItems, error: ytError } = await supabase
      .from("youtube_items")
      .select(
        "id, title, description, thumbnail, published_at, channel_title, video_id, feed_id"
      )
      .in("feed_id", feedIds)
      .order("published_at", { ascending: false })
      .limit(10);

    if (ytError) {
      console.error("Error fetching YouTube items:", ytError);
    }

    // Get user interactions for all items
    const { data: userInteractions, error: interactionsError } = await supabase
      .from("user_interactions")
      .select("*")
      .eq("user_id", user.id);

    if (interactionsError) {
      console.error("Error fetching user interactions:", interactionsError);
    }

    // Create a map of interactions for quick lookup
    const interactionsMap = new Map();
    userInteractions?.forEach((interaction) => {
      const key = `${interaction.item_type}_${interaction.item_id}`;
      interactionsMap.set(key, interaction);
    });

    // Combine and format items with interactions
    let recentItems = [];

    if (rssItems && rssItems.length > 0) {
      recentItems.push(
        ...rssItems.map((item) => {
          const interaction = interactionsMap.get(`rss_${item.id}`);
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            published_at: item.published_at,
            feed_id: item.feed_id,
            feed_title: item.feed_title,
            type: "rss",
            url: item.url,
            thumbnail: item.thumbnail,
            is_read: interaction?.is_read || false,
            is_favorite: interaction?.is_favorite || false,
            is_read_later: interaction?.is_read_later || false,
          };
        })
      );
    }

    if (youtubeItems && youtubeItems.length > 0) {
      recentItems.push(
        ...youtubeItems.map((item) => {
          const interaction = interactionsMap.get(`youtube_${item.id}`);
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            published_at: item.published_at,
            feed_id: item.feed_id,
            feed_title: item.channel_title,
            type: "youtube",
            url: `https://www.youtube.com/watch?v=${item.video_id}`,
            thumbnail: item.thumbnail,
            is_read: interaction?.is_read || false,
            is_favorite: interaction?.is_favorite || false,
            is_read_later: interaction?.is_read_later || false,
          };
        })
      );
    }

    // Sort combined items by date
    recentItems.sort((a, b) => {
      const dateA = new Date(a.published_at || 0);
      const dateB = new Date(b.published_at || 0);
      return dateB - dateA;
    });

    // Limit to 10 most recent
    recentItems = recentItems.slice(0, 10);

    // Get favorites count from user_interactions
    const { count: favoritesCount, error: favError } = await supabase
      .from("user_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_favorite", true);

    if (favError) {
      console.error("Error fetching favorites count:", favError);
    }

    // Get read later count from user_interactions
    const { count: readLaterCount, error: rlError } = await supabase
      .from("user_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read_later", true);

    if (rlError) {
      console.error("Error fetching read later count:", rlError);
    }

    let rssUnreadCount = 0;
    let ytUnreadCount = 0;

    try {
      // First get all read item IDs from user_interactions
      const { data: readItemIds } = await supabase
        .from("user_interactions")
        .select("item_id, item_type")
        .eq("user_id", user.id)
        .eq("is_read", true);

      const readRssIds =
        readItemIds
          ?.filter((item) => item.item_type === "rss")
          .map((item) => item.item_id) || [];
      const readYtIds =
        readItemIds
          ?.filter((item) => item.item_type === "youtube")
          .map((item) => item.item_id) || [];

      // Then count all RSS items that are not in the read items
      if (feedIds.length > 0) {
        const { count, error } = await supabase
          .from("rss_items")
          .select("id", { count: "exact", head: true })
          .in("feed_id", feedIds);

        if (!error) {
          rssUnreadCount = count || 0;

          // If we have read items, subtract them from the total
          if (readRssIds.length > 0) {
            const { count: readCount, error: readError } = await supabase
              .from("rss_items")
              .select("id", { count: "exact", head: true })
              .in("feed_id", feedIds)
              .in("id", readRssIds);

            if (!readError && readCount) {
              rssUnreadCount -= readCount;
            }
          }
        }
      }

      // Then count all YouTube items that are not in the read items
      if (feedIds.length > 0) {
        const { count, error } = await supabase
          .from("youtube_items")
          .select("id", { count: "exact", head: true })
          .in("feed_id", feedIds);

        if (!error) {
          ytUnreadCount = count || 0;

          // If we have read items, subtract them from the total
          if (readYtIds.length > 0) {
            const { count: readCount, error: readError } = await supabase
              .from("youtube_items")
              .select("id", { count: "exact", head: true })
              .in("feed_id", feedIds)
              .in("id", readYtIds);

            if (!readError && readCount) {
              ytUnreadCount -= readCount;
            }
          }
        }
      }
    } catch (unreadError) {
      console.error("Error calculating unread count:", unreadError);
    }

    // Calculate stats
    const stats = {
      feeds: feeds.length,
      favorites: favoritesCount || 0,
      readLater: readLaterCount || 0,
      unread: rssUnreadCount + ytUnreadCount,
    };

    console.log("API: Successfully returning data for user:", user.id);

    return NextResponse.json({
      feeds,
      stats,
      recentItems,
    });
  } catch (error) {
    console.error("Feeds API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
