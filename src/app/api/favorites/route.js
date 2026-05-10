import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { fetchInteractionItems } from "@/lib/api/fetchInteractionItems";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_request, { user }) => {
  const supabase = createServerSupabaseClient();

  try {
    const items = await fetchInteractionItems(supabase, user.id, "is_favorite");
    return ApiResponse.ok({ items, count: items.length });
  } catch (error) {
    console.error("[favorites] fetch error:", error);
    return ApiResponse.error("Failed to fetch favorites");
  }
});
