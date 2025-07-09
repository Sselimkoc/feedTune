import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Initialize Supabase client
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

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user feeds
    const { data: feeds, error: feedsError } = await supabase
      .from("feeds")
      .select("*")
      .eq("user_id", session.user.id)
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

    // Combine and format items
    let recentItems = [];

    if (rssItems && rssItems.length > 0) {
      recentItems.push(
        ...rssItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          published_at: item.published_at,
          feed_id: item.feed_id,
          feed_title: item.feed_title,
          type: "rss",
          url: item.url,
          thumbnail: item.thumbnail,
        }))
      );
    }

    if (youtubeItems && youtubeItems.length > 0) {
      recentItems.push(
        ...youtubeItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          published_at: item.published_at,
          feed_id: item.feed_id,
          feed_title: item.channel_title,
          type: "youtube",
          url: `https://www.youtube.com/watch?v=${item.video_id}`,
          thumbnail: item.thumbnail,
        }))
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

    // Get favorites count from rss_interactions
    const { count: rssFavoritesCount, error: rssFavError } = await supabase
      .from("rss_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_favorite", true);

    if (rssFavError) {
      console.error("Error fetching RSS favorites count:", rssFavError);
    }

    // Get favorites count from youtube_interactions
    const { count: ytFavoritesCount, error: ytFavError } = await supabase
      .from("youtube_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_favorite", true);

    if (ytFavError) {
      console.error("Error fetching YouTube favorites count:", ytFavError);
    }

    // Get read later count from rss_interactions
    const { count: rssReadLaterCount, error: rssRlError } = await supabase
      .from("rss_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_read_later", true);

    if (rssRlError) {
      console.error("Error fetching RSS read later count:", rssRlError);
    }

    // Get read later count from youtube_interactions
    const { count: ytReadLaterCount, error: ytRlError } = await supabase
      .from("youtube_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("is_read_later", true);

    if (ytRlError) {
      console.error("Error fetching YouTube read later count:", ytRlError);
    }

    // Get unread count - combine RSS and YouTube items
    // For RSS items
    let rssUnreadCount = 0;
    let ytUnreadCount = 0;

    try {
      // First get all read RSS item IDs
      const { data: readRssItemIds } = await supabase
        .from("rss_interactions")
        .select("item_id")
        .eq("user_id", session.user.id)
        .eq("is_read", true);

      const readRssIds = readRssItemIds?.map((item) => item.item_id) || [];

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
    } catch (rssUnreadError) {
      console.error("Error calculating RSS unread count:", rssUnreadError);
    }

    try {
      // First get all read YouTube item IDs
      const { data: readYtItemIds } = await supabase
        .from("youtube_interactions")
        .select("item_id")
        .eq("user_id", session.user.id)
        .eq("is_read", true);

      const readYtIds = readYtItemIds?.map((item) => item.item_id) || [];

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
    } catch (ytUnreadError) {
      console.error("Error calculating YouTube unread count:", ytUnreadError);
    }

    // Calculate stats
    const stats = {
      feeds: feeds.length,
      favorites: (rssFavoritesCount || 0) + (ytFavoritesCount || 0),
      readLater: (rssReadLaterCount || 0) + (ytReadLaterCount || 0),
      unread: rssUnreadCount + ytUnreadCount,
    };

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
