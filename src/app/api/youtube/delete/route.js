import { youtubeService } from "@/lib/youtube/service";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const DELETE = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const feedId = searchParams.get("feedId");

  if (!feedId) return ApiResponse.badRequest("feedId is required");

  const supabase = createServiceRoleClient();

  // Verify ownership before deleting
  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .select("id")
    .eq("id", feedId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (feedError) {
    console.error("[youtube/delete] fetch error:", feedError);
    return ApiResponse.error("Failed to verify feed ownership");
  }

  if (!feed) return ApiResponse.notFound("Feed not found");

  try {
    const result = await youtubeService.deleteYoutubeChannel(feedId, user.id);
    return ApiResponse.ok({ success: true, result });
  } catch (error) {
    console.error("[youtube/delete] error:", error);
    return ApiResponse.error(error.message || "Failed to delete YouTube channel");
  }
});
