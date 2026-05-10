import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const DELETE = withAuth(async (request, { user }) => {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc("delete_user_account", {
    user_id: user.id,
  });

  if (error) return ApiResponse.error("Failed to delete account");

  return ApiResponse.ok({ success: true });
});
