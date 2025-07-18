import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * User-accessible cleanup endpoint
 * This endpoint can be called by authenticated users from the settings page
 *
 * Query parameters:
 * - olderThanDays: Delete items older than this many days (default: 30)
 * - keepFavorites: Keep favorite items (default: true)
 * - keepReadLater: Keep read later items (default: true)
 * - dryRun: Only count items, don't delete (default: false)
 */
export async function POST(request) {
  try {
    // Create Supabase client
    const supabase = createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User verification error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("olderThanDays")) || 30;
    const keepFavorites = searchParams.get("keepFavorites") !== "false";
    const keepReadLater = searchParams.get("keepReadLater") !== "false";
    const dryRun = searchParams.get("dryRun") === "true";

    console.log(`[User Cleanup] Starting cleanup for user ${userId}`, {
      olderThanDays,
      keepFavorites,
      keepReadLater,
      dryRun,
    });

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffIsoString = cutoffDate.toISOString();

    let totalDeleted = 0;
    let results = {
      rssItems: 0,
      youtubeItems: 0,
      errors: [],
    };

    // Clean up RSS items for this user only
    try {
      const rssResult = await cleanupUserRssItems(
        userId,
        cutoffIsoString,
        keepFavorites,
        keepReadLater,
        dryRun
      );
      results.rssItems = rssResult;
      totalDeleted += rssResult;
      console.log(
        `[User Cleanup] RSS items: ${rssResult} ${
          dryRun ? "would be" : ""
        } deleted for user ${userId}`
      );
    } catch (error) {
      console.error("[User Cleanup] Error cleaning RSS items:", error);
      results.errors.push(`RSS cleanup error: ${error.message}`);
    }

    // Clean up YouTube items for this user only
    try {
      const youtubeResult = await cleanupUserYoutubeItems(
        userId,
        cutoffIsoString,
        keepFavorites,
        keepReadLater,
        dryRun
      );
      results.youtubeItems = youtubeResult;
      totalDeleted += youtubeResult;
      console.log(
        `[User Cleanup] YouTube items: ${youtubeResult} ${
          dryRun ? "would be" : ""
        } deleted for user ${userId}`
      );
    } catch (error) {
      console.error("[User Cleanup] Error cleaning YouTube items:", error);
      results.errors.push(`YouTube cleanup error: ${error.message}`);
    }

    // Clean up orphaned interactions for this user only
    try {
      const interactionsResult = await cleanupUserOrphanedInteractions(
        userId,
        dryRun
      );
      results.orphanedInteractions = interactionsResult;
      console.log(
        `[User Cleanup] Orphaned interactions: ${interactionsResult} ${
          dryRun ? "would be" : ""
        } deleted for user ${userId}`
      );
    } catch (error) {
      console.error(
        "[User Cleanup] Error cleaning orphaned interactions:",
        error
      );
      results.errors.push(`Interactions cleanup error: ${error.message}`);
    }

    console.log(
      `[User Cleanup] Completed for user ${userId}: ${totalDeleted} total items ${
        dryRun ? "would be" : ""
      } deleted`
    );

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${totalDeleted} items ${
        dryRun ? "would be" : ""
      } deleted`,
      details: results,
      cutoffDate: cutoffIsoString,
      dryRun,
      userId,
    });
  } catch (error) {
    console.error("[User Cleanup] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Cleanup job failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Clean up old RSS items for a specific user
 */
async function cleanupUserRssItems(
  userId,
  cutoffDate,
  keepFavorites,
  keepReadLater,
  dryRun
) {
  const supabase = createServerSupabaseClient();

  // Get RSS feeds for this user
  const { data: userFeeds, error: feedsError } = await supabase
    .from("feeds")
    .select("id")
    .eq("user_id", userId)
    .in("type", ["rss", "atom"]);

  if (feedsError) throw feedsError;

  if (!userFeeds || userFeeds.length === 0) {
    return 0;
  }

  const feedIds = userFeeds.map((feed) => feed.id);

  let query = supabase
    .from("rss_items")
    .select("id")
    .in("feed_id", feedIds)
    .lt("pub_date", cutoffDate);

  // Build exclusion conditions
  const exclusions = [];

  if (keepFavorites) {
    // Exclude items that are favorited by this user
    const { data: favoritedItems } = await supabase
      .from("rss_interactions")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_favorite", true);

    if (favoritedItems && favoritedItems.length > 0) {
      const favoritedIds = favoritedItems.map((item) => item.item_id);
      exclusions.push(...favoritedIds);
    }
  }

  if (keepReadLater) {
    // Exclude items that are marked for read later by this user
    const { data: readLaterItems } = await supabase
      .from("rss_interactions")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_read_later", true);

    if (readLaterItems && readLaterItems.length > 0) {
      const readLaterIds = readLaterItems.map((item) => item.item_id);
      exclusions.push(...readLaterIds);
    }
  }

  // Apply exclusions
  if (exclusions.length > 0) {
    query = query.not("id", "in", `(${exclusions.join(",")})`);
  }

  if (dryRun) {
    const { data, error } = await query;
    if (error) throw error;
    return data?.length || 0;
  } else {
    // Get the items to delete first
    const { data: itemsToDelete, error: selectError } = await query;
    if (selectError) throw selectError;

    if (!itemsToDelete || itemsToDelete.length === 0) {
      return 0;
    }

    // Delete the items
    const idsToDelete = itemsToDelete.map((item) => item.id);
    const { error: deleteError } = await supabase
      .from("rss_items")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) throw deleteError;
    return itemsToDelete.length;
  }
}

/**
 * Clean up old YouTube items for a specific user
 */
async function cleanupUserYoutubeItems(
  userId,
  cutoffDate,
  keepFavorites,
  keepReadLater,
  dryRun
) {
  const supabase = createServerSupabaseClient();

  // Get YouTube feeds for this user
  const { data: userFeeds, error: feedsError } = await supabase
    .from("feeds")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "youtube");

  if (feedsError) throw feedsError;

  if (!userFeeds || userFeeds.length === 0) {
    return 0;
  }

  const feedIds = userFeeds.map((feed) => feed.id);

  let query = supabase
    .from("youtube_items")
    .select("id")
    .in("feed_id", feedIds)
    .lt("published_at", cutoffDate);

  // Build exclusion conditions
  const exclusions = [];

  if (keepFavorites) {
    // Exclude items that are favorited by this user
    const { data: favoritedItems } = await supabase
      .from("youtube_interactions")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_favorite", true);

    if (favoritedItems && favoritedItems.length > 0) {
      const favoritedIds = favoritedItems.map((item) => item.item_id);
      exclusions.push(...favoritedIds);
    }
  }

  if (keepReadLater) {
    // Exclude items that are marked for read later by this user
    const { data: readLaterItems } = await supabase
      .from("youtube_interactions")
      .select("item_id")
      .eq("user_id", userId)
      .eq("is_read_later", true);

    if (readLaterItems && readLaterItems.length > 0) {
      const readLaterIds = readLaterItems.map((item) => item.item_id);
      exclusions.push(...readLaterIds);
    }
  }

  // Apply exclusions
  if (exclusions.length > 0) {
    query = query.not("id", "in", `(${exclusions.join(",")})`);
  }

  if (dryRun) {
    const { data, error } = await query;
    if (error) throw error;
    return data?.length || 0;
  } else {
    // Get the items to delete first
    const { data: itemsToDelete, error: selectError } = await query;
    if (selectError) throw selectError;

    if (!itemsToDelete || itemsToDelete.length === 0) {
      return 0;
    }

    // Delete the items
    const idsToDelete = itemsToDelete.map((item) => item.id);
    const { error: deleteError } = await supabase
      .from("youtube_items")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) throw deleteError;
    return itemsToDelete.length;
  }
}

/**
 * Clean up orphaned interactions for a specific user
 */
async function cleanupUserOrphanedInteractions(userId, dryRun) {
  const supabase = createServerSupabaseClient();
  let totalCleaned = 0;

  try {
    // Get user's feeds first
    const { data: userFeeds, error: feedsError } = await supabase
      .from("feeds")
      .select("id")
      .eq("user_id", userId);

    if (feedsError) throw feedsError;

    if (!userFeeds || userFeeds.length === 0) {
      return 0;
    }

    const feedIds = userFeeds.map((feed) => feed.id);

    // Get all valid RSS item IDs for this user
    const { data: validRssItems, error: rssItemsError } = await supabase
      .from("rss_items")
      .select("id")
      .in("feed_id", feedIds);

    if (rssItemsError) throw rssItemsError;

    const validRssItemIds = validRssItems
      ? validRssItems.map((item) => item.id)
      : [];

    // Find orphaned RSS interactions
    const { data: rssInteractions, error: rssInteractionsError } =
      await supabase
        .from("rss_interactions")
        .select("id, item_id")
        .eq("user_id", userId);

    if (rssInteractionsError) throw rssInteractionsError;

    if (rssInteractions && rssInteractions.length > 0) {
      const orphanedRssInteractions = rssInteractions.filter(
        (interaction) => !validRssItemIds.includes(interaction.item_id)
      );

      if (orphanedRssInteractions.length > 0) {
        if (!dryRun) {
          const { error: deleteError } = await supabase
            .from("rss_interactions")
            .delete()
            .in(
              "id",
              orphanedRssInteractions.map((item) => item.id)
            );

          if (deleteError) throw deleteError;
        }
        totalCleaned += orphanedRssInteractions.length;
      }
    }

    // Get all valid YouTube item IDs for this user
    const { data: validYoutubeItems, error: youtubeItemsError } = await supabase
      .from("youtube_items")
      .select("id")
      .in("feed_id", feedIds);

    if (youtubeItemsError) throw youtubeItemsError;

    const validYoutubeItemIds = validYoutubeItems
      ? validYoutubeItems.map((item) => item.id)
      : [];

    // Find orphaned YouTube interactions
    const { data: youtubeInteractions, error: youtubeInteractionsError } =
      await supabase
        .from("youtube_interactions")
        .select("id, item_id")
        .eq("user_id", userId);

    if (youtubeInteractionsError) throw youtubeInteractionsError;

    if (youtubeInteractions && youtubeInteractions.length > 0) {
      const orphanedYoutubeInteractions = youtubeInteractions.filter(
        (interaction) => !validYoutubeItemIds.includes(interaction.item_id)
      );

      if (orphanedYoutubeInteractions.length > 0) {
        if (!dryRun) {
          const { error: deleteError } = await supabase
            .from("youtube_interactions")
            .delete()
            .in(
              "id",
              orphanedYoutubeInteractions.map((item) => item.id)
            );

          if (deleteError) throw deleteError;
        }
        totalCleaned += orphanedYoutubeInteractions.length;
      }
    }
  } catch (error) {
    console.error("Error in orphaned interactions cleanup:", error);
    // Return 0 instead of throwing to not break the entire cleanup process
    return 0;
  }

  return totalCleaned;
}

// Allow GET for testing
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") !== "false"; // Default to dry run for GET

  // Create a new URL with dryRun=true for safety
  const testUrl = new URL(request.url);
  testUrl.searchParams.set("dryRun", "true");

  // Create a new request with POST method
  const testRequest = new Request(testUrl, {
    method: "POST",
    headers: request.headers,
  });

  return POST(testRequest);
}
