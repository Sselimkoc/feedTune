import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { url, type, extraData = {} } = await request.json();

    // Validate input
    if (!url) {
      return NextResponse.json(
        { error: "Feed URL is required" },
        { status: 400 }
      );
    }

    // Validate and parse feed metadata
    const feedType =
      type ||
      (url.includes("youtube.com") || url.includes("youtu.be")
        ? "youtube"
        : "rss");

    // Parse feed metadata
    let feedInfo = {};
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/rss-preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, skipCache: true }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.statusText}`);
      }

      feedInfo = await response.json();
    } catch (error) {
      console.error("Feed parsing error:", error);
      throw new Error(`Failed to parse ${feedType} feed: ${error.message}`);
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Get category from database instead of hard-coded UUIDs
    let categoryId = null;
    if (extraData.category) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("name", extraData.category)
        .single();

      if (category) {
        categoryId = category.id;
      }
    }

    // If no category found, use default category
    if (!categoryId) {
      const { data: defaultCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("name", "general")
        .single();

      categoryId = defaultCategory?.id || null;
    }

    // Check if feed already exists for this user
    const { data: existingFeed } = await supabase
      .from("rss_feeds")
      .select("id")
      .eq("url", normalizedUrl)
      .eq("user_id", session.user.id)
      .single();

    if (existingFeed) {
      return NextResponse.json(
        { error: "This feed is already in your collection" },
        { status: 409 }
      );
    }

    // Prepare feed data
    const feedData = {
      url: normalizedUrl,
      user_id: session.user.id,
      type: feedType,
      title: extraData.title || feedInfo.feed?.title || normalizedUrl,
      description: extraData.description || feedInfo.feed?.description || "",
      icon: extraData.icon || feedInfo.feed?.icon || null,
      category_id: categoryId,
    };

    // Insert feed into database
    const { data: newFeed, error: insertError } = await supabase
      .from("rss_feeds")
      .insert(feedData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting feed:", insertError);
      throw new Error("Failed to save feed to database");
    }

    return NextResponse.json({
      success: true,
      feed: newFeed,
      message: "Feed added successfully",
    });
  } catch (error) {
    console.error("Error adding feed:", error);

    // Handle specific error cases
    if (error.message.includes("already in your collection")) {
      return NextResponse.json(
        { error: "This feed is already in your collection" },
        { status: 409 }
      );
    }

    if (error.message.includes("Invalid URL")) {
      return NextResponse.json(
        { error: "Invalid feed URL format" },
        { status: 400 }
      );
    }

    if (error.message.includes("validation failed")) {
      return NextResponse.json(
        { error: "Feed validation failed. Please check the URL." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to add feed" },
      { status: 500 }
    );
  }
}
