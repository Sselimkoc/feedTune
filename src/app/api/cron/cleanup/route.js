import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron/cleanup] CRON_SECRET not set");
    return NextResponse.json({ error: "Cron job not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const olderThanDays = parseInt(searchParams.get("olderThanDays")) || 30;
  const keepFavorites = searchParams.get("keepFavorites") !== "false";
  const keepReadLater = searchParams.get("keepReadLater") !== "false";
  const dryRun = searchParams.get("dryRun") === "true";

  const supabase = createServiceRoleClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const cutoffIsoString = cutoffDate.toISOString();

  let totalDeleted = 0;
  const results = { rssItems: 0, youtubeItems: 0, errors: [] };

  try {
    results.rssItems = await cleanupRssItems(supabase, cutoffIsoString, keepFavorites, keepReadLater, dryRun);
    totalDeleted += results.rssItems;
  } catch (error) {
    console.error("[cron/cleanup] RSS items error:", error);
    results.errors.push(`RSS cleanup error: ${error.message}`);
  }

  try {
    results.youtubeItems = await cleanupYoutubeItems(supabase, cutoffIsoString, keepFavorites, keepReadLater, dryRun);
    totalDeleted += results.youtubeItems;
  } catch (error) {
    console.error("[cron/cleanup] YouTube items error:", error);
    results.errors.push(`YouTube cleanup error: ${error.message}`);
  }

  try {
    results.orphanedInteractions = await cleanupOrphanedInteractions(supabase, dryRun);
  } catch (error) {
    console.error("[cron/cleanup] Orphaned interactions error:", error);
    results.errors.push(`Interactions cleanup error: ${error.message}`);
  }

  return NextResponse.json({
    success: true,
    message: `Cleanup completed: ${totalDeleted} items ${dryRun ? "would be " : ""}deleted`,
    details: results,
    cutoffDate: cutoffIsoString,
    dryRun,
  });
}

async function cleanupRssItems(supabase, cutoffDate, keepFavorites, keepReadLater, dryRun) {
  let query = supabase.from("rss_items").select("id").lt("published_at", cutoffDate);
  const exclusions = [];

  if (keepFavorites) {
    const { data } = await supabase.from("user_interactions").select("item_id").eq("item_type", "rss").eq("is_favorite", true);
    if (data?.length) exclusions.push(...data.map((i) => i.item_id));
  }
  if (keepReadLater) {
    const { data } = await supabase.from("user_interactions").select("item_id").eq("item_type", "rss").eq("is_read_later", true);
    if (data?.length) exclusions.push(...data.map((i) => i.item_id));
  }
  if (exclusions.length) {
    query = query.not("id", "in", `(${[...new Set(exclusions)].join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (dryRun || !data?.length) return data?.length ?? 0;

  const { error: deleteError } = await supabase.from("rss_items").delete().in("id", data.map((i) => i.id));
  if (deleteError) throw deleteError;
  return data.length;
}

async function cleanupYoutubeItems(supabase, cutoffDate, keepFavorites, keepReadLater, dryRun) {
  let query = supabase.from("youtube_items").select("id").lt("published_at", cutoffDate);
  const exclusions = [];

  if (keepFavorites) {
    const { data } = await supabase.from("user_interactions").select("item_id").eq("item_type", "youtube").eq("is_favorite", true);
    if (data?.length) exclusions.push(...data.map((i) => i.item_id));
  }
  if (keepReadLater) {
    const { data } = await supabase.from("user_interactions").select("item_id").eq("item_type", "youtube").eq("is_read_later", true);
    if (data?.length) exclusions.push(...data.map((i) => i.item_id));
  }
  if (exclusions.length) {
    query = query.not("id", "in", `(${[...new Set(exclusions)].join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (dryRun || !data?.length) return data?.length ?? 0;

  const { error: deleteError } = await supabase.from("youtube_items").delete().in("id", data.map((i) => i.id));
  if (deleteError) throw deleteError;
  return data.length;
}

async function cleanupOrphanedInteractions(supabase, dryRun) {
  if (dryRun) {
    const { data: rssOrphans } = await supabase.rpc("count_orphaned_rss_interactions");
    const { data: ytOrphans } = await supabase.rpc("count_orphaned_youtube_interactions");
    return (rssOrphans || 0) + (ytOrphans || 0);
  }

  await supabase.rpc("cleanup_orphaned_rss_interactions");
  await supabase.rpc("cleanup_orphaned_youtube_interactions");
  return 0;
}

export async function GET(request) {
  const testUrl = new URL(request.url);
  testUrl.searchParams.set("dryRun", "true");
  return POST(new Request(testUrl, { method: "POST", headers: request.headers }));
}
