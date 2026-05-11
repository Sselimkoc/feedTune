import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { createServiceRoleClient } from "@/lib/supabase-server";

async function handleCleanup(request, user) {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const olderThanDays = parseInt(searchParams.get("olderThanDays")) || 30;
  const keepFavorites = searchParams.get("keepFavorites") !== "false";
  const keepReadLater = searchParams.get("keepReadLater") !== "false";
  const dryRun = searchParams.get("dryRun") === "true";

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const cutoffIso = cutoffDate.toISOString();

  const results = { rssItems: 0, youtubeItems: 0, errors: [] };

  async function getProtectedIds(itemType) {
    const ids = new Set();
    const conditions = [];
    if (keepFavorites) conditions.push("is_favorite");
    if (keepReadLater) conditions.push("is_read_later");

    for (const field of conditions) {
      const { data } = await supabase
        .from("user_interactions")
        .select("item_id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq(field, true);
      data?.forEach((r) => ids.add(r.item_id));
    }
    return [...ids];
  }

  // Clean RSS items
  try {
    const { data: rssFeeds } = await supabase
      .from("feeds")
      .select("id")
      .eq("user_id", user.id)
      .in("type", ["rss", "atom"]);

    if (rssFeeds?.length) {
      const feedIds = rssFeeds.map((f) => f.id);
      const protectedIds = await getProtectedIds("rss");
      let query = supabase
        .from("rss_items")
        .select("id")
        .in("feed_id", feedIds)
        .lt("pub_date", cutoffIso);
      if (protectedIds.length) query = query.not("id", "in", `(${protectedIds.join(",")})`);

      const { data: toDelete, error } = await query;
      if (error) throw error;
      if (!dryRun && toDelete?.length) {
        const { error: delErr } = await supabase
          .from("rss_items")
          .delete()
          .in("id", toDelete.map((i) => i.id));
        if (delErr) throw delErr;
      }
      results.rssItems = toDelete?.length ?? 0;
    }
  } catch (e) {
    results.errors.push(`RSS: ${e.message}`);
  }

  // Clean YouTube items
  try {
    const { data: ytFeeds } = await supabase
      .from("feeds")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "youtube");

    if (ytFeeds?.length) {
      const feedIds = ytFeeds.map((f) => f.id);
      const protectedIds = await getProtectedIds("youtube");
      let query = supabase
        .from("youtube_items")
        .select("id")
        .in("feed_id", feedIds)
        .lt("published_at", cutoffIso);
      if (protectedIds.length) query = query.not("id", "in", `(${protectedIds.join(",")})`);

      const { data: toDelete, error } = await query;
      if (error) throw error;
      if (!dryRun && toDelete?.length) {
        const { error: delErr } = await supabase
          .from("youtube_items")
          .delete()
          .in("id", toDelete.map((i) => i.id));
        if (delErr) throw delErr;
      }
      results.youtubeItems = toDelete?.length ?? 0;
    }
  } catch (e) {
    results.errors.push(`YouTube: ${e.message}`);
  }

  const totalDeleted = results.rssItems + results.youtubeItems;
  return ApiResponse.ok({
    success: true,
    message: `Cleanup ${dryRun ? "preview" : "completed"}: ${totalDeleted} items ${dryRun ? "would be" : ""} deleted`,
    details: results,
    cutoffDate: cutoffIso,
    dryRun,
  });
}

export const POST = withAuth(async (request, { user }) => {
  return handleCleanup(request, user);
});

// GET defaults to dryRun for safety
export const GET = withAuth(async (request, { user }) => {
  const url = new URL(request.url);
  url.searchParams.set("dryRun", "true");
  return handleCleanup(new Request(url.toString(), { headers: request.headers }), user);
});
