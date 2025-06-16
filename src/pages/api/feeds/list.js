import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

/**
 * API Route for fetching the user's feed list
 * GET /api/feeds/list
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Create authenticated Supabase client
  const supabase = createServerSupabaseClient({ req, res });

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // Get query parameters for filtering
    const { type, category, sort, direction = "asc" } = req.query;

    // Start building the query
    let query = supabase
      .from("feeds")
      .select(
        `
        id, 
        title, 
        description, 
        url, 
        source_url,
        type, 
        category, 
        domain, 
        image, 
        last_fetched, 
        last_updated,
        error_count,
        item_count,
        created_at,
        fetch_full_content
      `
      )
      .eq("user_id", session.user.id)
      .is("deleted_at", null); // Only non-deleted feeds

    // Apply filters if provided
    if (type) {
      query = query.eq("type", type);
    }

    if (category) {
      query = query.eq("category", category);
    }

    // Apply sorting
    if (sort) {
      // Validate sort field to prevent SQL injection
      const validSortFields = [
        "title",
        "created_at",
        "last_updated",
        "last_fetched",
        "category",
        "type",
      ];
      const sortField = validSortFields.includes(sort) ? sort : "created_at";

      // Validate direction
      const sortDirection = ["asc", "desc"].includes(direction)
        ? direction
        : "asc";

      query = query.order(sortField, { ascending: sortDirection === "asc" });
    } else {
      // Default sort by created_at descending (newest first)
      query = query.order("created_at", { ascending: false });
    }

    // Execute the query
    const { data: feeds, error } = await query;

    if (error) {
      console.error("Database error fetching feeds:", error);
      return res.status(500).json({ error: "Failed to fetch feeds" });
    }

    // Get item counts and stats
    let feedStats = {};
    try {
      // Get overall feed item count and unread count
      const { data: rssStats, error: rssError } = await supabase
        .from("rss_items")
        .select("feed_id, id, is_read", { count: "exact" })
        .eq("user_id", session.user.id)
        .in(
          "feed_id",
          feeds.map((feed) => feed.id)
        );

      if (!rssError && rssStats) {
        // Calculate stats per feed
        rssStats.forEach((item) => {
          if (!feedStats[item.feed_id]) {
            feedStats[item.feed_id] = { total: 0, unread: 0 };
          }

          feedStats[item.feed_id].total++;
          if (!item.is_read) {
            feedStats[item.feed_id].unread++;
          }
        });
      }

      // Get YouTube item count and unread count
      const { data: youtubeStats, error: youtubeError } = await supabase
        .from("youtube_items")
        .select("feed_id, id, is_read", { count: "exact" })
        .eq("user_id", session.user.id)
        .in(
          "feed_id",
          feeds.map((feed) => feed.id)
        );

      if (!youtubeError && youtubeStats) {
        // Calculate stats per feed
        youtubeStats.forEach((item) => {
          if (!feedStats[item.feed_id]) {
            feedStats[item.feed_id] = { total: 0, unread: 0 };
          }

          feedStats[item.feed_id].total++;
          if (!item.is_read) {
            feedStats[item.feed_id].unread++;
          }
        });
      }
    } catch (statsError) {
      console.error("Error fetching feed stats:", statsError);
      // Continue without stats if there's an error
    }

    // Attach stats to each feed
    const feedsWithStats = feeds.map((feed) => ({
      ...feed,
      stats: feedStats[feed.id] || { total: 0, unread: 0 },
    }));

    // Get total counts for all feeds
    const totalStats = {
      totalFeeds: feedsWithStats.length,
      totalItems: feedsWithStats.reduce(
        (sum, feed) => sum + (feed.stats?.total || 0),
        0
      ),
      totalUnread: feedsWithStats.reduce(
        (sum, feed) => sum + (feed.stats?.unread || 0),
        0
      ),
      byType: {
        rss: feedsWithStats.filter((feed) => feed.type === "rss").length,
        youtube: feedsWithStats.filter((feed) => feed.type === "youtube")
          .length,
      },
    };

    // Return the feeds with their stats
    return res.status(200).json({
      success: true,
      feeds: feedsWithStats,
      stats: totalStats,
    });
  } catch (error) {
    console.error("Error in feeds/list:", error);
    return res
      .status(500)
      .json({ error: `Failed to fetch feeds: ${error.message}` });
  }
}
