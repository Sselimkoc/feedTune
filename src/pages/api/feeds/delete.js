import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

/**
 * API Route for deleting a feed
 * DELETE /api/feeds/delete
 *
 * Body:
 * - feedId: ID of the feed to delete
 * - permanent: If true, permanently delete the feed and its items (default: false)
 */
export default async function handler(req, res) {
  // Only allow DELETE requests
  if (req.method !== "DELETE") {
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

  const { feedId, permanent = false } = req.body;

  if (!feedId) {
    return res.status(400).json({ error: "Feed ID is required" });
  }

  try {
    // Check if the feed exists and belongs to the user
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .select("id, type")
      .eq("id", feedId)
      .eq("user_id", session.user.id)
      .single();

    if (feedError || !feed) {
      return res.status(404).json({ error: "Feed not found or access denied" });
    }

    // Determine feed type (rss or youtube)
    const feedType = feed.type || "rss";
    const itemsTable = feedType === "youtube" ? "youtube_items" : "rss_items";

    // If permanent deletion is requested
    if (permanent) {
      // Delete all items belonging to this feed
      const { error: itemsDeleteError } = await supabase
        .from(itemsTable)
        .delete()
        .eq("feed_id", feedId)
        .eq("user_id", session.user.id);

      if (itemsDeleteError) {
        console.error("Error deleting feed items:", itemsDeleteError);
        return res.status(500).json({ error: "Failed to delete feed items" });
      }

      // Delete the feed
      const { error: feedDeleteError } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId)
        .eq("user_id", session.user.id);

      if (feedDeleteError) {
        console.error("Error deleting feed:", feedDeleteError);
        return res.status(500).json({ error: "Failed to delete feed" });
      }

      return res.status(200).json({
        success: true,
        message: "Feed and its items have been permanently deleted",
        feedId,
      });
    } else {
      // Soft delete - mark the feed as deleted but keep the data
      const { error: updateError } = await supabase
        .from("feeds")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedId)
        .eq("user_id", session.user.id);

      if (updateError) {
        console.error("Error soft-deleting feed:", updateError);
        return res.status(500).json({ error: "Failed to delete feed" });
      }

      return res.status(200).json({
        success: true,
        message: "Feed has been soft-deleted",
        feedId,
      });
    }
  } catch (error) {
    console.error("Error in feed deletion:", error);
    return res
      .status(500)
      .json({ error: `Failed to delete feed: ${error.message}` });
  }
}

// Allow DELETE method for CORS
export function options(req, res) {
  res.setHeader("Allow", ["DELETE", "OPTIONS"]);
  res.status(200).end();
}
