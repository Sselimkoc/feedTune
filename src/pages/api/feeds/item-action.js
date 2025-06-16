import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

/**
 * API Route for managing feed item actions
 * POST /api/feeds/item-action
 *
 * Body:
 * - itemId: ID of the item
 * - itemType: Type of the item ('rss' or 'youtube')
 * - action: Action to perform ('read', 'favorite', 'read-later')
 * - value: Boolean value to set
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
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

  const { itemId, itemType, action, value } = req.body;

  // Validate required parameters
  if (!itemId) {
    return res.status(400).json({ error: "Item ID is required" });
  }

  if (!itemType || !["rss", "youtube"].includes(itemType)) {
    return res
      .status(400)
      .json({ error: "Valid item type is required (rss or youtube)" });
  }

  if (!action || !["read", "favorite", "read-later"].includes(action)) {
    return res
      .status(400)
      .json({
        error: "Valid action is required (read, favorite, or read-later)",
      });
  }

  if (typeof value !== "boolean") {
    return res.status(400).json({ error: "Value must be a boolean" });
  }

  try {
    // Determine the table to use based on itemType
    const tableName = itemType === "rss" ? "rss_items" : "youtube_items";

    // Check if the item exists and belongs to the user
    const { data: item, error: itemError } = await supabase
      .from(tableName)
      .select("id, is_read, is_favorite, is_read_later")
      .eq("id", itemId)
      .eq("user_id", session.user.id)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: "Item not found or access denied" });
    }

    // Prepare update data based on the action
    const updateData = {};

    if (action === "read") {
      updateData.is_read = value;
      // If marking as read, set the read_at timestamp
      if (value) {
        updateData.read_at = new Date().toISOString();
      } else {
        updateData.read_at = null;
      }
    } else if (action === "favorite") {
      updateData.is_favorite = value;
      // If marking as favorite, set the favorite_at timestamp
      if (value) {
        updateData.favorite_at = new Date().toISOString();
      } else {
        updateData.favorite_at = null;
      }
    } else if (action === "read-later") {
      updateData.is_read_later = value;
      // If marking for read later, set the read_later_at timestamp
      if (value) {
        updateData.read_later_at = new Date().toISOString();
      } else {
        updateData.read_later_at = null;
      }
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the item
    const { data: updatedItem, error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", itemId)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating item:", updateError);
      return res.status(500).json({ error: "Failed to update item" });
    }

    // Handle bulk actions if needed (e.g., mark all items in a feed as read)
    if (action === "read" && req.body.feedId && req.body.bulk === true) {
      try {
        // This is a bulk operation for all items in a feed
        const { feedId } = req.body;

        // Update all unread items in the feed if marking as read
        if (value) {
          await supabase
            .from(tableName)
            .update({
              is_read: true,
              read_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("feed_id", feedId)
            .eq("user_id", session.user.id)
            .eq("is_read", false);
        }

        return res.status(200).json({
          success: true,
          message: `Bulk ${action} status updated for feed ${feedId}`,
          item: updatedItem,
        });
      } catch (bulkError) {
        console.error("Error processing bulk action:", bulkError);
        // Continue with the single item update result
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: `Item ${action} status updated`,
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error in item-action:", error);
    return res
      .status(500)
      .json({ error: `Failed to update item: ${error.message}` });
  }
}
