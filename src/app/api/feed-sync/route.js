import { NextResponse } from "next/server";
import { updateRssFeed } from "@/lib/rss-service";
import { updateYoutubeChannel } from "@/lib/youtube-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * Feed synchronization endpoint
 * Refreshes all user feeds
 *
 * Called via POST method and works without parameters.
 * Handles both RSS and YouTube feed updates.
 */
export async function POST(request) {
  try {
    // Session check
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Get all active feeds of the user
    const { data: userFeeds, error: feedsError } = await supabase
      .from("feeds")
      .select("id, type")
      .eq("user_id", session.user.id)
      .eq("is_active", true);

    if (feedsError) {
      return NextResponse.json(
        { error: "Feeds fetching failed" },
        { status: 500 }
      );
    }

    // Update each feed
    const updatePromises = userFeeds.map(async (feed) => {
      try {
        if (feed.type === "rss") {
          await updateRssFeed(feed.id);
          return { id: feed.id, type: "rss", success: true };
        } else if (feed.type === "youtube") {
          await updateYoutubeChannel(feed.id);
          return { id: feed.id, type: "youtube", success: true };
        }
        return {
          id: feed.id,
          type: feed.type,
          success: false,
          message: "Unsupported feed type",
        };
      } catch (error) {
        return {
          id: feed.id,
          type: feed.type,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `${successCount} feed updated successfully${
        failCount > 0 ? `, ${failCount} feed update failed` : ""
      }`,
      results,
    });
  } catch (error) {
    console.error("Feed sync failed:", error);

    return NextResponse.json(
      {
        error: error.message ,
      },
      { status: 500 }
    );
  }
}

/**
 * Feed synchronization status endpoint
 * Optional, can be used for monitoring
 */
export async function GET(request) {
  try {
    return NextResponse.json({
      status: "available",
      message: "Feed synchronization service is running",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Feed synchronization service error" },
      { status: 500 }
    );
  }
}
