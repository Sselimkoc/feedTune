import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const POST = withAuth(async (request, { user }) => {
  const supabase = createServerSupabaseClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { url, type, extraData = {} } = body;

  if (!url) return ApiResponse.badRequest("Feed URL is required");

  const feedType =
    type ||
    (url.includes("youtube.com") || url.includes("youtu.be") ? "youtube" : "rss");

  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  // Validate URL format
  try {
    new URL(normalizedUrl);
  } catch {
    return ApiResponse.badRequest("Invalid feed URL format");
  }

  // Check if feed already exists for this user
  const { data: existingFeed } = await supabase
    .from("feeds")
    .select("id")
    .eq("url", normalizedUrl)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingFeed) {
    return ApiResponse.conflict("This feed is already in your collection");
  }

  // Parse feed metadata
  let feedInfo = {};
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/rss-preview`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl, skipCache: true }),
      }
    );
    if (response.ok) {
      feedInfo = await response.json();
    }
  } catch (error) {
    console.error("Feed parsing error:", error);
    return ApiResponse.badRequest(`Failed to parse feed: ${error.message}`);
  }

  // Resolve category
  let categoryId = null;
  if (extraData.category) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", extraData.category)
      .maybeSingle();
    categoryId = category?.id ?? null;
  }
  if (!categoryId) {
    const { data: defaultCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "general")
      .maybeSingle();
    categoryId = defaultCategory?.id ?? null;
  }

  const { data: newFeed, error: insertError } = await supabase
    .from("feeds")
    .insert({
      url: normalizedUrl,
      user_id: user.id,
      type: feedType,
      title: extraData.title || feedInfo.feed?.title || normalizedUrl,
      description: extraData.description || feedInfo.feed?.description || "",
      icon: extraData.icon || feedInfo.feed?.icon || null,
      category_id: categoryId,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting feed:", insertError);
    return ApiResponse.error("Failed to save feed to database");
  }

  return ApiResponse.ok({ feed: newFeed }, 201);
});
