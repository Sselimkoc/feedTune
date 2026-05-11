import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { getChannelInfo } from "@/lib/youtube";

export const POST = withAuth(async (request, { user }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { feedId } = body;
  if (!feedId) return ApiResponse.badRequest("feedId is required");

  const supabase = createServiceRoleClient();

  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .select("id, url, type")
    .eq("id", feedId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (feedError) return ApiResponse.error(feedError.message);
  if (!feed) return ApiResponse.notFound("Feed not found");
  if (feed.type !== "youtube") return ApiResponse.badRequest("Feed is not a YouTube feed");

  // Extract channel ID from feed URL
  const channelIdMatch = feed.url.match(/channel_id=(UC[\w-]{21,22})/);
  if (!channelIdMatch) return ApiResponse.badRequest("Could not extract channel ID from feed URL");
  const channelId = channelIdMatch[1];

  try {
    const info = await getChannelInfo(channelId);
    const { data: updated, error: updateError } = await supabase
      .from("feeds")
      .update({
        title: info.title,
        icon: info.thumbnail,
        description: info.description,
        channel_id: channelId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", feedId)
      .select("*")
      .single();

    if (updateError) return ApiResponse.error("Failed to update feed metadata");

    return ApiResponse.ok({ success: true, feed: updated });
  } catch (error) {
    console.error("[youtube/update] error:", error);
    return ApiResponse.error(error.message || "Failed to update YouTube channel");
  }
});
