import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Cron job endpoint for cleaning up old feed data
 * This endpoint should be called weekly to clean up old items
 *
 * Query parameters:
 * - olderThanDays: Delete items older than this many days (default: 30)
 * - keepFavorites: Keep favorite items (default: true)
 * - keepReadLater: Keep read later items (default: true)
 * - dryRun: Only count items, don't delete (default: false)
 */
export async function POST(request) {
  try {
    // Verify cron job authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET environment variable not set");
      return NextResponse.json(
        { error: "Cron job not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("olderThanDays")) || 30;
    const keepFavorites = searchParams.get("keepFavorites") !== "false";
    const keepReadLater = searchParams.get("keepReadLater") !== "false";
    const dryRun = searchParams.get("dryRun") === "true";

    console.log(`[Cleanup Cron] Starting cleanup job`, {
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

    // Clean up RSS items
    try {
      const rssResult = await cleanupRssItems(
        cutoffIsoString,
        keepFavorites,
        keepReadLater,
        dryRun
      );
      results.rssItems = rssResult;
      totalDeleted += rssResult;
      console.log(
        `[Cleanup Cron] RSS items: ${rssResult} ${
          dryRun ? "would be" : ""
        } deleted`
      );
    } catch (error) {
      console.error("[Cleanup Cron] Error cleaning RSS items:", error);
      results.errors.push(`RSS cleanup error: ${error.message}`);
    }

    // Clean up YouTube items
    try {
      const youtubeResult = await cleanupYoutubeItems(
        cutoffIsoString,
        keepFavorites,
        keepReadLater,
        dryRun
      );
      results.youtubeItems = youtubeResult;
      totalDeleted += youtubeResult;
      console.log(
        `[Cleanup Cron] YouTube items: ${youtubeResult} ${
          dryRun ? "would be" : ""
        } deleted`
      );
    } catch (error) {
      console.error("[Cleanup Cron] Error cleaning YouTube items:", error);
      results.errors.push(`YouTube cleanup error: ${error.message}`);
    }

    // Clean up orphaned interactions
    try {
      const interactionsResult = await cleanupOrphanedInteractions(dryRun);
      results.orphanedInteractions = interactionsResult;
      console.log(
        `[Cleanup Cron] Orphaned interactions: ${interactionsResult} ${
          dryRun ? "would be" : ""
        } deleted`
      );
    } catch (error) {
      console.error(
        "[Cleanup Cron] Error cleaning orphaned interactions:",
        error
      );
      results.errors.push(`Interactions cleanup error: ${error.message}`);
    }

    console.log(
      `[Cleanup Cron] Completed: ${totalDeleted} total items ${
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
    });
  } catch (error) {
    console.error("[Cleanup Cron] Unexpected error:", error);
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
 * Clean up old RSS items
 */
async function cleanupRssItems(
  cutoffDate,
  keepFavorites,
  keepReadLater,
  dryRun
) {
  let query = supabase
    .from("rss_items")
    .select("id")
    .lt("published_at", cutoffDate);

  // Build exclusion conditions
  const exclusions = [];

  if (keepFavorites) {
    // Exclude items that are favorited by any user
    const { data: favoritedItems } = await supabase
      .from("rss_interactions")
      .select("item_id")
      .eq("is_favorite", true);

    if (favoritedItems && favoritedItems.length > 0) {
      const favoritedIds = favoritedItems.map((item) => item.item_id);
      exclusions.push(...favoritedIds);
    }
  }

  if (keepReadLater) {
    // Exclude items that are marked for read later by any user
    const { data: readLaterItems } = await supabase
      .from("rss_interactions")
      .select("item_id")
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
    const { count, error } = await query.delete();
    if (error) throw error;
    return count || 0;
  }
}

/**
 * Clean up old YouTube items
 */
async function cleanupYoutubeItems(
  cutoffDate,
  keepFavorites,
  keepReadLater,
  dryRun
) {
  let query = supabase
    .from("youtube_items")
    .select("id")
    .lt("published_at", cutoffDate);

  // Build exclusion conditions
  const exclusions = [];

  if (keepFavorites) {
    // Exclude items that are favorited by any user
    const { data: favoritedItems } = await supabase
      .from("youtube_interactions")
      .select("item_id")
      .eq("is_favorite", true);

    if (favoritedItems && favoritedItems.length > 0) {
      const favoritedIds = favoritedItems.map((item) => item.item_id);
      exclusions.push(...favoritedIds);
    }
  }

  if (keepReadLater) {
    // Exclude items that are marked for read later by any user
    const { data: readLaterItems } = await supabase
      .from("youtube_interactions")
      .select("item_id")
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
    const { count, error } = await query.delete();
    if (error) throw error;
    return count || 0;
  }
}

/**
 * Clean up orphaned interactions (interactions for deleted items)
 */
async function cleanupOrphanedInteractions(dryRun) {
  let totalCleaned = 0;

  // Clean RSS interactions
  const rssOrphansQuery = `
    DELETE FROM rss_interactions 
    WHERE item_id NOT IN (SELECT id FROM rss_items)
  `;

  // Clean YouTube interactions
  const youtubeOrphansQuery = `
    DELETE FROM youtube_interactions 
    WHERE item_id NOT IN (SELECT id FROM youtube_items)
  `;

  if (dryRun) {
    // Count orphaned RSS interactions
    const { data: rssOrphans } = await supabase.rpc(
      "count_orphaned_rss_interactions"
    );

    // Count orphaned YouTube interactions
    const { data: youtubeOrphans } = await supabase.rpc(
      "count_orphaned_youtube_interactions"
    );

    totalCleaned = (rssOrphans || 0) + (youtubeOrphans || 0);
  } else {
    // Execute cleanup
    const { error: rssError } = await supabase.rpc(
      "cleanup_orphaned_rss_interactions"
    );

    const { error: youtubeError } = await supabase.rpc(
      "cleanup_orphaned_youtube_interactions"
    );

    if (rssError) console.error("RSS interactions cleanup error:", rssError);
    if (youtubeError)
      console.error("YouTube interactions cleanup error:", youtubeError);

    // Note: We can't get exact count from RPC, so we return 0 for now
    totalCleaned = 0;
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
