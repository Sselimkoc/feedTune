import { createServiceRoleClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import { enrichItemsWithOgImages } from "@/lib/feed/imageUtils";
import Parser from "rss-parser";

export const dynamic = "force-dynamic";

function extractImgFromHtml(html) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || null;
}

const feedParser = new Parser({
  customFields: {
    item: [
      ["media:content", "media"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

const BATCH_SIZE = 20;

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
    .select("id, title, url, type")
    .eq("id", feedId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (feedError) {
    console.error("[sync-items] feed fetch error:", feedError);
    return ApiResponse.error(feedError.message);
  }
  if (!feed) return ApiResponse.notFound("Feed not found");
  if (feed.type !== "rss") return ApiResponse.badRequest("Feed is not an RSS feed");

  let rssFeed;
  try {
    rssFeed = await feedParser.parseURL(feed.url);
  } catch (error) {
    console.error("[sync-items] RSS parse error:", error);
    return ApiResponse.error(`Could not fetch RSS feed: ${error.message}`);
  }

  if (!Array.isArray(rssFeed?.items)) {
    return ApiResponse.error("Invalid RSS feed content");
  }

  const items = rssFeed.items
    .filter((item) => item.link || item.guid)
    .map((item) => {
      const thumbnail =
        item.mediaThumbnail?.url ||
        (Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail[0]?.url : null) ||
        item.media?.url ||
        (Array.isArray(item.media) ? item.media[0]?.url : null) ||
        (item.enclosure?.type?.startsWith("image/") ? item.enclosure.url : null) ||
        item.thumbnail ||
        item.image?.url ||
        extractImgFromHtml(item.contentEncoded || item.description || "") ||
        "";

      return {
        feed_id: feedId,
        title: item.title || "Untitled",
        url: item.link || item.guid,
        description: item.contentSnippet || item.description || item.summary || "",
        thumbnail,
        published_at: item.pubDate || item.isoDate || new Date().toISOString(),
        guid: item.guid || item.link,
        created_at: new Date().toISOString(),
      };
    });

  const { data: existing, error: existingError } = await supabase
    .from("rss_items")
    .select("url")
    .eq("feed_id", feedId);

  if (existingError) {
    console.error("[sync-items] existing items check error:", existingError);
    return ApiResponse.error(existingError.message);
  }

  const existingUrls = new Set(existing?.map((i) => i.url) ?? []);
  const newItems = items.filter((i) => !existingUrls.has(i.url));

  await enrichItemsWithOgImages(newItems);

  const now = new Date().toISOString();
  await supabase
    .from("feeds")
    .update({ last_fetched: now, updated_at: now })
    .eq("id", feedId);

  if (newItems.length === 0) {
    return ApiResponse.ok({ inserted: 0, total: rssFeed.items.length });
  }

  let insertedCount = 0;
  const errors = [];

  for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
    const batch = newItems.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("rss_items")
      .insert(batch)
      .select("id");

    if (error) {
      console.error(`[sync-items] batch ${i / BATCH_SIZE + 1} error:`, error);
      errors.push({ batch: i / BATCH_SIZE + 1, error: error.message });
    } else {
      insertedCount += data?.length ?? batch.length;
    }
  }

  return ApiResponse.ok({
    inserted: insertedCount,
    total: rssFeed.items.length,
    ...(errors.length ? { errors } : {}),
  });
});
