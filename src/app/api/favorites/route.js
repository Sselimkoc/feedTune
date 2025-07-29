import { NextResponse } from "next/server";
import { mockRecentItems } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Return only favorite items
    const favoriteItems = mockRecentItems.filter((item) => item.is_favorite);

    return NextResponse.json({
      items: favoriteItems,
      count: favoriteItems.length,
    });
  } catch (error) {
    console.error("Favorites API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
