import { createServerSupabaseClient } from "@/lib/supabase-server";
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

  const supabase = createServerSupabaseClient();

  // Upsert: create or update the interaction row, setting only the requested field
  const { error } = await supabase
    .from("user_interactions")
    .upsert(
      {
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        [type]: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_id" }
    );

  if (error) {
    console.error("[interactions/add] upsert error:", error);
    return ApiResponse.error("Failed to save interaction");
  }

  return ApiResponse.ok({ success: true });
});
