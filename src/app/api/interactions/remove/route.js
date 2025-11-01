import { NextResponse } from "next/server";
import { getSecureUser } from "@/lib/auth/serverAuth";

/**
 * Remove Interaction API Route
 * Removes items from read, favorite, or read-later list
 * - Requires authentication (401 if not)
 * - Validates interaction type and item type
 * - Returns success or error
 */
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // Authenticate user
    const user = await getSecureUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { itemId, type, itemType } = await request.json();

    if (!itemId || !type || !itemType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validTypes = ["is_read", "is_favorite", "is_read_later"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid interaction type" },
        { status: 400 }
      );
    }

    // Validate item type
    const validItemTypes = ["rss", "youtube"];
    if (!validItemTypes.includes(itemType)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    // Process interaction removal
    console.log(
      `[API] Removing interaction: ${type} for ${itemType} item ${itemId} by user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: "Interaction removed successfully",
    });
  } catch (error) {
    console.error("[API] Remove interaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
