import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

export const DELETE = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const feedId = searchParams.get("feedId");

  if (!feedId) return ApiResponse.badRequest("Feed ID is required");

  const supabase = createServiceRoleClient();

  // Verify the feed belongs to this user before deleting
  const { data: feed, error: fetchError } = await supabase
    .from("feeds")
    .select("id")
    .eq("id", feedId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) {
    console.error("[feeds/delete] fetch error:", fetchError);
    return ApiResponse.error("Failed to verify feed ownership");
  }

  if (!feed) return ApiResponse.notFound("Feed not found");

  // Soft-delete
  const { error: deleteError } = await supabase
    .from("feeds")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", feedId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[feeds/delete] delete error:", deleteError);
    return ApiResponse.error("Failed to delete feed");
  }

  return ApiResponse.ok({ success: true });
});
