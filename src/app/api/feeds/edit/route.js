import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const PATCH = withAuth(async (request, { user }) => {
  const supabase = createServerSupabaseClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { id, ...feedData } = body;

  if (!id) return ApiResponse.badRequest("Feed ID is required");

  const { data, error } = await supabase
    .from("feeds")
    .update(feedData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return ApiResponse.error("Failed to update feed");

  return ApiResponse.ok({ feed: data });
});
