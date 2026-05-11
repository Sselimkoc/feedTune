import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const DELETE = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const feedId = searchParams.get("feedId");

  if (!feedId) return ApiResponse.badRequest("feedId is required");

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("feeds")
    .delete()
    .eq("id", feedId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[youtube/delete] error:", error);
    return ApiResponse.error("Failed to delete YouTube channel");
  }

  return ApiResponse.ok({ success: true });
});
