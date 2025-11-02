import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { feedId } = body;

    if (!feedId) {
      return NextResponse.json(
        { error: "Feed ID is required" },
        { status: 400 }
      );
    }

    // TODO: Implement sync items logic here

    return NextResponse.json({
      success: true,
      message: "Items synced successfully",
    });
  } catch (error) {
    console.error("Sync items error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to sync items" },
      { status: 500 }
    );
  }
}
