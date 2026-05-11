import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["is_read", "is_favorite", "is_read_later"];
const VALID_ITEM_TYPES = ["rss", "youtube"];

export const POST = withAuth(async (request, { user }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { itemId, type, itemType } = body;

  if (!itemId || !type || !itemType) {
    return ApiResponse.badRequest("Missing required fields: itemId, type, itemType");
  }
  if (!VALID_TYPES.includes(type)) {
    return ApiResponse.badRequest(`Invalid interaction type. Must be one of: ${VALID_TYPES.join(", ")}`);
  }
  if (!VALID_ITEM_TYPES.includes(itemType)) {
    return ApiResponse.badRequest(`Invalid item type. Must be one of: ${VALID_ITEM_TYPES.join(", ")}`);
  }

  const supabase = createServiceRoleClient();

  // Set only the specific interaction flag to false
  const { error } = await supabase
    .from("user_interactions")
    .update({
      [type]: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("item_id", itemId);

  if (error) {
    console.error("[interactions/remove] update error:", error);
    return ApiResponse.error("Failed to remove interaction");
  }

  return ApiResponse.ok({ success: true });
});
