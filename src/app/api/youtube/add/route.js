import { NextResponse } from "next/server";
import { addYoutubeChannel } from "@/lib/youtube-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * YouTube channel add endpoint
 *
 * Adds a YouTube channel using the channelId parameter from the POST request.
 */
export async function POST(request) {
  try {
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

    const body = await request.json();
    const channelId = body.channelId;

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId parameter is required" },
        { status: 400 }
      );
    }

    const newFeed = await addYoutubeChannel(channelId, session.user.id);

    return NextResponse.json({
      success: true,
      message: "YouTube channel added successfully",
      feed: newFeed,
    });
  } catch (error) {
    console.error("YouTube channel add error:", error);

    return NextResponse.json(
      { error: error.message || "YouTube channel add error" },
      { status: 500 }
    );
  }
}
