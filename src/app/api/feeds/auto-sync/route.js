import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const POST = withAuth(async (_request, { user }) => {
  const supabase = createServerSupabaseClient();

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: feeds, error: feedsError } = await supabase
    .from("feeds")
    .select("id, title, url, type, last_fetched")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .or(`last_fetched.is.null,last_fetched.lt.${thirtyMinutesAgo}`);

  if (feedsError) {
    console.error("[auto-sync] error fetching feeds:", feedsError);
    return ApiResponse.error("Failed to fetch feeds");
  }

  if (!feeds || feeds.length === 0) {
    return ApiResponse.ok({ synced: 0, message: "All feeds are up to date" });
  }

  const now = new Date().toISOString();
  let successCount = 0;
  const errors = [];

  const BATCH_SIZE = 3;
  for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
    const batch = feeds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((feed) =>
        supabase
          .from("feeds")
          .update({ last_fetched: now, updated_at: now })
          .eq("id", feed.id)
      )
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successCount++;
      } else {
        errors.push({ feedId: batch[index].id, error: result.reason?.message });
      }
    });
  }

  return ApiResponse.ok({
    synced: successCount,
    ...(errors.length ? { errors } : {}),
  });
});
