import { NextResponse } from "next/server";
import { updateYoutubeChannel } from "@/lib/youtube-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * YouTube kanal güncelleme endpoint'i
 *
 * PUT isteği ile gelen feedId parametresi ile kanal bilgilerini günceller
 */
export async function PUT(request) {
  try {
    // Oturum kontrolü
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // İstek parametrelerini al
    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get("feedId");

    if (!feedId) {
      return NextResponse.json(
        { error: "feedId parameter is required" },
        { status: 400 }
      );
    }

    // Check if the user has this feed
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .select("*")
      .eq("id", feedId)
      .eq("user_id", session.user.id)
      .single();

    if (feedError || !feed) {
      return NextResponse.json(
        { error: "You don't have permission to update this feed or the feed was not found" },
        { status: 403 }
      );
    }

    // Update the YouTube channel
    const result = await updateYoutubeChannel(feedId);

    return NextResponse.json({
      success: true,
      message: "YouTube channel updated successfully",
      result: result,
    });
  } catch (error) {
    console.error("YouTube channel update error:", error);

    return NextResponse.json(
      { error: error.message || "YouTube channel update failed" },
      { status: 500 }
    );
  }
}
