import { NextResponse } from "next/server";
import { deleteYoutubeChannel } from "@/lib/youtube-service";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

/**
 * YouTube channel delete endpoint
 *
 * Deletes a channel using the feedId parameter from the DELETE request
 */
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get("feedId");

    if (!feedId) {
      return NextResponse.json(
        { error: "feedId parametresi gereklidir" },
        { status: 400 }
      );
    }

    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .select("*")
      .eq("id", feedId)
      .eq("user_id", session.user.id)
      .single();

    if (feedError || !feed) {
      return NextResponse.json(
        { error: "Beslemeyi silme yetkiniz yok veya besleme bulunamadı" },
        { status: 403 }
      );
    }

    const result = await deleteYoutubeChannel(feedId);

    return NextResponse.json({
      success: true,
      message: "YouTube channel deleted successfully",
      result: result,
    });
  } catch (error) {
    console.error("YouTube channel delete error:", error);

    return NextResponse.json(
      { error: error.message || "YouTube channel delete error" },
      { status: 500 }
    );
  }
}
