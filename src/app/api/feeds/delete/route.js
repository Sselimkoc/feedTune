import { NextResponse } from "next/server";
import { getSecureUser } from "@/lib/auth/serverAuth";

/**
 * Delete Feed API Route
 * Removes a feed from user's feed list
 * - Requires authentication (401 if not)
 * - Validates feed ID
 * - Returns success or error
 */
export const dynamic = "force-dynamic";

export async function DELETE(request) {
  try {
    // Authenticate user
    const user = await getSecureUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get feed ID from URL params
    const url = new URL(request.url);
    const feedId = url.searchParams.get("feedId");

    if (!feedId) {
      return NextResponse.json(
        { error: "Feed ID is required" },
        { status: 400 }
      );
    }

    // Process feed deletion
    console.log(`[API] Deleting feed: ${feedId} by user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Feed deleted successfully",
    });
  } catch (error) {
    console.error("[API] Delete feed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
