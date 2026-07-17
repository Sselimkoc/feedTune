import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const PATCH = withAuth(async (request, { user }) => {
  const supabase = createServiceRoleClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { id, ...feedData } = body;

  if (!id) return ApiResponse.badRequest("Feed ID is required");

  // Only allow editing known-safe columns (never user_id, id, timestamps)
  const ALLOWED_FIELDS = ["title", "description", "icon", "category_id", "url"];
  const updates = Object.fromEntries(
    Object.entries(feedData).filter(([key]) => ALLOWED_FIELDS.includes(key)),
  );
  if (Object.keys(updates).length === 0) {
    return ApiResponse.badRequest("No editable fields provided");
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("feeds")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return ApiResponse.error("Failed to update feed");

  return ApiResponse.ok({ feed: data });
});
