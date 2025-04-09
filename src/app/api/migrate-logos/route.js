import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Admin check
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: youtubeFeeds, error: feedsError } = await supabase
      .from("youtube_feeds")
      .select("id, channel_avatar");

    if (feedsError) {
      console.error("Error fetching YouTube feeds:", feedsError);
      return Response.json(
        { error: "Failed to fetch YouTube feeds" },
        { status: 500 }
      );
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const feed of youtubeFeeds) {
      if (feed.channel_avatar) {
        const { error: updateError } = await supabase
          .from("feeds")
          .update({ site_favicon: feed.channel_avatar })
          .eq("id", feed.id);

        if (updateError) {
          console.error(`Error updating feed ${feed.id}:`, updateError);
          errorCount++;
        } else {
          updatedCount++;
        }
      }
    }

    return Response.json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} feeds. Errors: ${errorCount}`,
      updated: updatedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
