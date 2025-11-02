import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { mockFeeds } from "@/lib/mockData";

export async function POST(request) {
  try {
    console.log("Feed add API - Using mock data for demonstration");

    // Skip authentication check for demo
    // const cookieStore = await cookies();
    // const supabase = createServerSupabaseClient();
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) {
    //   return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    // }

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

    // Map category name to UUID
    const categoryMap = {
      general: "550e8400-e29b-41d4-a716-446655440001",
      tech: "550e8400-e29b-41d4-a716-446655440002",
      news: "550e8400-e29b-41d4-a716-446655440003",
      entertainment: "550e8400-e29b-41d4-a716-446655440004",
      other: "550e8400-e29b-41d4-a716-446655440005",
    };

    const categoryId = extraData.category
      ? categoryMap[extraData.category] || categoryMap.general
      : categoryMap.general;

    // Prepare feed data
    const feedData = {
      url: normalizedUrl,
      user_id: session.user.id,
      type: feedType,
      title: extraData.title || feedInfo.feed?.title || normalizedUrl,
      description: extraData.description || feedInfo.feed?.description || "",
      icon: extraData.icon || feedInfo.feed?.icon || null,
      category_id: categoryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create mock feed for demonstration
    const mockFeed = {
      id: `mock-${Date.now()}`,
      url: normalizedUrl,
      user_id: "demo-user",
      type: feedType,
      title: extraData.title || feedInfo.feed?.title || normalizedUrl,
      description: extraData.description || feedInfo.feed?.description || "",
      icon: extraData.icon || feedInfo.feed?.icon || null,
      category_id: categoryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      feed: mockFeed,
      message: "Feed added successfully (mock data)",
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
