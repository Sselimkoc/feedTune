import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mockFeeds, mockStats, mockRecentItems } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    console.log("API: Starting feeds request - Using mock data");

    // Return mock data for demonstration
    return NextResponse.json({
      feeds: mockFeeds,
      stats: mockStats,
      recentItems: mockRecentItems,
    });
  } catch (error) {
    console.error("Feeds API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
