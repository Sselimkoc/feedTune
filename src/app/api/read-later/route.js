import { NextResponse } from "next/server";
import { mockRecentItems } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Return only read later items
    const readLaterItems = mockRecentItems.filter((item) => item.is_read_later);

    return NextResponse.json({
      items: readLaterItems,
      count: readLaterItems.length,
    });
  } catch (error) {
    console.error("Read Later API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
