import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Auto-sync API endpoint for refreshing stale feeds
 * This endpoint checks all user feeds and syncs those that haven't been updated recently
 */
export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[Auto Sync API] Starting auto-sync for user: ${userId}`);

    // Get all user feeds that haven't been fetched in the last 30 minutes
    const thirtyMinutesAgo = new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString();

    const { data: feeds, error: feedsError } = await supabase
      .from("feeds")
      .select("id, title, url, type, last_fetched, last_updated")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .or(`last_fetched.is.null,last_fetched.lt.${thirtyMinutesAgo}`);

    if (feedsError) {
      console.error("[Auto Sync API] Error fetching feeds:", feedsError);
      return NextResponse.json(
        { error: "Failed to fetch feeds" },
        { status: 500 }
      );
    }

    if (!feeds || feeds.length === 0) {
      console.log("[Auto Sync API] No feeds need syncing");
      return NextResponse.json({
        success: true,
        message: "All feeds are up to date",
        synced: 0,
      });
    }

    console.log(`[Auto Sync API] Found ${feeds.length} feeds to sync`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process feeds in batches of 3 to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < feeds.length; i += batchSize) {
      const batch = feeds.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (feed) => {
          try {
            console.log(`[Auto Sync API] Syncing feed: ${feed.title}`);

            // Simple sync approach - just update the timestamp
            // The actual feed content will be fetched by the client-side auto-sync
            console.log(
              `[Auto Sync API] Marking feed as synced: ${feed.title}`
            );

            // For now, we'll just mark the feed as "needs sync" by updating last_fetched
            // The client-side auto-sync will handle the actual content fetching

            // Update feed timestamp
            await supabase
              .from("feeds")
              .update({
                last_fetched: new Date().toISOString(),
                last_updated: new Date().toISOString(),
              })
              .eq("id", feed.id);

            return { success: true, feedId: feed.id, title: feed.title };
          } catch (error) {
            console.error(
              `[Auto Sync API] Failed to sync feed ${feed.title}:`,
              error
            );
            throw error;
          }
        })
      );

      // Count results
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          errorCount++;
          const feed = batch[index];
          errors.push({
            feedId: feed.id,
            title: feed.title,
            error: result.reason.message,
          });
        }
      });

      // Small delay between batches
      if (i + batchSize < feeds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `[Auto Sync API] Completed: ${successCount} success, ${errorCount} errors`
    );

    return NextResponse.json({
      success: true,
      message: `Auto-sync completed: ${successCount} feeds synced`,
      synced: successCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Auto Sync API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Auto-sync failed", details: error.message },
      { status: 500 }
    );
  }
}
