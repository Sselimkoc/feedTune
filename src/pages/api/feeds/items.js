import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

/**
 * API Route for fetching feed items
 * GET /api/feeds/items
 *
 * Query Parameters:
 * - feedId: Specific feed ID (can be comma-separated for multiple feeds)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - type: Filter by item type ('rss' or 'youtube')
 * - filter: Filter by read status ('all', 'unread', 'read')
 * - search: Search query
 * - sort: Sort field ('date', 'title')
 * - direction: Sort direction ('asc' or 'desc')
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
    // Get query parameters
    const {
      feedId,
      type = "all",
      page = "1",
      pageSize = "20",
      filter = "all",
      search = "",
      sort = "date",
      direction = "desc",
    } = req.query;

    // Parse parameters
    const parsedPage = parseInt(page, 10) || 1;
    const parsedPageSize = Math.min(parseInt(pageSize, 10) || 20, 100); // Max 100 items
    const offset = (parsedPage - 1) * parsedPageSize;

    // Parse feedId (can be comma-separated list)
    let feedIds = [];
    if (feedId) {
      feedIds = feedId.split(",").filter((id) => id);
    } else {
      // If no feed ID provided, get all user's feeds
      const { data: userFeeds } = await supabase
        .from("feeds")
        .select("id")
        .eq("user_id", session.user.id)
        .is("deleted_at", null);

      feedIds = userFeeds?.map((feed) => feed.id) || [];
    }

    // Safety check - if no feeds, return empty result
    if (feedIds.length === 0) {
      return res.status(200).json({
        success: true,
        items: [],
        total: 0,
        page: parsedPage,
        pageSize: parsedPageSize,
        totalPages: 0,
        hasMore: false,
      });
    }

    // Build initial query for counting total items
    let countQueryRSS = supabase
      .from("rss_items")
      .select("id", { count: "exact" })
      .eq("user_id", session.user.id)
      .in("feed_id", feedIds);

    let countQueryYouTube = supabase
      .from("youtube_items")
      .select("id", { count: "exact" })
      .eq("user_id", session.user.id)
      .in("feed_id", feedIds);

    // Build initial queries for selecting data
    let queryRSS = supabase
      .from("rss_items")
      .select(
        `
        id,
        feed_id,
        title,
        description,
        link,
        pub_date,
        guid,
        thumbnail,
        author,
        content,
        created_at,
        is_read,
        is_favorite,
        is_read_later,
        feeds!inner(title, image, domain, type)
      `
      )
      .eq("user_id", session.user.id)
      .in("feed_id", feedIds);

    let queryYouTube = supabase
      .from("youtube_items")
      .select(
        `
        id,
        feed_id,
        title,
        description,
        link,
        pub_date,
        guid,
        thumbnail,
        author,
        content,
        created_at,
        video_id,
        is_read,
        is_favorite,
        is_read_later,
        feeds!inner(title, image, domain, type)
      `
      )
      .eq("user_id", session.user.id)
      .in("feed_id", feedIds);

    // Apply read status filtering
    if (filter === "unread") {
      countQueryRSS = countQueryRSS.eq("is_read", false);
      countQueryYouTube = countQueryYouTube.eq("is_read", false);
      queryRSS = queryRSS.eq("is_read", false);
      queryYouTube = queryYouTube.eq("is_read", false);
    } else if (filter === "read") {
      countQueryRSS = countQueryRSS.eq("is_read", true);
      countQueryYouTube = countQueryYouTube.eq("is_read", true);
      queryRSS = queryRSS.eq("is_read", true);
      queryYouTube = queryYouTube.eq("is_read", true);
    }

    // Apply search if provided
    if (search && search.trim() !== "") {
      const searchTerm = search.trim();
      countQueryRSS = countQueryRSS.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
      countQueryYouTube = countQueryYouTube.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
      queryRSS = queryRSS.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
      queryYouTube = queryYouTube.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }

    // Set sorting - default newest first
    let sortField = "pub_date";
    if (sort === "title") {
      sortField = "title";
    } else if (sort === "created") {
      sortField = "created_at";
    }

    const ascending = direction === "asc";

    // Execute count queries
    let totalItems = 0;
    let rssCount = 0;
    let youtubeCount = 0;

    // Count RSS items if type is 'all' or 'rss'
    if (type === "all" || type === "rss") {
      const { count: rssTotal, error: rssCountError } = await countQueryRSS;
      if (!rssCountError) {
        rssCount = rssTotal || 0;
        totalItems += rssCount;
      } else {
        console.error("Error counting RSS items:", rssCountError);
      }
    }

    // Count YouTube items if type is 'all' or 'youtube'
    if (type === "all" || type === "youtube") {
      const { count: youtubeTotal, error: youtubeCountError } =
        await countQueryYouTube;
      if (!youtubeCountError) {
        youtubeCount = youtubeTotal || 0;
        totalItems += youtubeCount;
      } else {
        console.error("Error counting YouTube items:", youtubeCountError);
      }
    }

    // Set sorting for data queries
    queryRSS = queryRSS.order(sortField, { ascending });
    queryYouTube = queryYouTube.order(sortField, { ascending });

    // Apply pagination - strategy depends on whether we're fetching both or just one type
    let rssItems = [];
    let youtubeItems = [];

    if (type === "all") {
      // For combined results, we need special handling
      // Calculate how many items to fetch from each source
      const rssRatio = totalItems > 0 ? rssCount / totalItems : 0.5;
      const rssLimit = Math.min(
        Math.max(Math.round(parsedPageSize * rssRatio), 1),
        rssCount
      );
      const youtubeLimit = Math.min(parsedPageSize - rssLimit, youtubeCount);

      const rssOffset = Math.min(Math.round(offset * rssRatio), rssCount);
      const youtubeOffset = Math.min(offset - rssOffset, youtubeCount);

      // Fetch RSS items
      if (rssLimit > 0) {
        const { data: rssData, error: rssError } = await queryRSS.range(
          rssOffset,
          rssOffset + rssLimit - 1
        );

        if (!rssError && rssData) {
          rssItems = rssData;
        } else if (rssError) {
          console.error("Error fetching RSS items:", rssError);
        }
      }

      // Fetch YouTube items
      if (youtubeLimit > 0) {
        const { data: youtubeData, error: youtubeError } =
          await queryYouTube.range(
            youtubeOffset,
            youtubeOffset + youtubeLimit - 1
          );

        if (!youtubeError && youtubeData) {
          youtubeItems = youtubeData;
        } else if (youtubeError) {
          console.error("Error fetching YouTube items:", youtubeError);
        }
      }
    } else if (type === "rss") {
      // Only RSS items
      const { data: rssData, error: rssError } = await queryRSS.range(
        offset,
        offset + parsedPageSize - 1
      );

      if (!rssError && rssData) {
        rssItems = rssData;
      } else if (rssError) {
        console.error("Error fetching RSS items:", rssError);
      }
    } else if (type === "youtube") {
      // Only YouTube items
      const { data: youtubeData, error: youtubeError } =
        await queryYouTube.range(offset, offset + parsedPageSize - 1);

      if (!youtubeError && youtubeData) {
        youtubeItems = youtubeData;
      } else if (youtubeError) {
        console.error("Error fetching YouTube items:", youtubeError);
      }
    }

    // Combine and normalize the items
    const allItems = [
      ...normalizeItems(rssItems, "rss"),
      ...normalizeItems(youtubeItems, "youtube"),
    ];

    // Sort combined items (needed for the 'all' type case)
    if (type === "all") {
      allItems.sort((a, b) => {
        const valA = a[sortField] || "";
        const valB = b[sortField] || "";

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });

      // Limit to pageSize
      if (allItems.length > parsedPageSize) {
        allItems.length = parsedPageSize;
      }
    }

    // Calculate pagination values
    const totalPages = Math.ceil(totalItems / parsedPageSize);
    const hasMore = parsedPage < totalPages;

    return res.status(200).json({
      success: true,
      items: allItems,
      total: totalItems,
      page: parsedPage,
      pageSize: parsedPageSize,
      totalPages,
      hasMore,
      stats: {
        rssCount,
        youtubeCount,
      },
    });
  } catch (error) {
    console.error("Error in feeds/items:", error);
    return res
      .status(500)
      .json({ error: `Failed to fetch feed items: ${error.message}` });
  }
}

/**
 * Normalize items to a consistent format
 */
function normalizeItems(items, type) {
  return items.map((item) => {
    // Common fields
    const normalizedItem = {
      id: item.id,
      feedId: item.feed_id,
      title: item.title || "Untitled",
      description: item.description || "",
      content: item.content || item.description || "",
      link: item.link || "",
      pubDate: item.pub_date || item.created_at,
      guid: item.guid || "",
      thumbnail: item.thumbnail || "",
      author: item.author || "",
      createdAt: item.created_at,
      isRead: item.is_read || false,
      isFavorite: item.is_favorite || false,
      isReadLater: item.is_read_later || false,
      type: type,
      feed: {
        title: item.feeds?.title || "Unknown Feed",
        image: item.feeds?.image || null,
        domain: item.feeds?.domain || "",
        type: item.feeds?.type || type,
      },
    };

    // YouTube-specific fields
    if (type === "youtube" && item.video_id) {
      normalizedItem.videoId = item.video_id;
    }

    return normalizedItem;
  });
}
