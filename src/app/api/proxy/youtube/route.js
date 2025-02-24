import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const YOUTUBE_API_KEY = "AIzaSyB3zRVgDqXIdMLUn2UDEDCwmAJnb-m1J1Y";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Debug session check
    console.log("API Route - Session Check:", {
      hasSession: !!session,
      sessionError,
      sessionToken: session?.access_token,
    });

    if (!session) {
      console.log("API Route - No session found");
      return Response.json({ error: "No session found" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return Response.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    try {
      // First, get the channel's upload playlist ID
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      const channelData = await channelResponse.json();

      if (!channelResponse.ok) {
        throw new Error(
          channelData.error?.message || "Failed to fetch channel data"
        );
      }

      const uploadsPlaylistId =
        channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

      // Then, get the latest videos from that playlist
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`
      );
      const videosData = await videosResponse.json();

      if (!videosResponse.ok) {
        throw new Error(videosData.error?.message || "Failed to fetch videos");
      }

      return Response.json(videosData);
    } catch (error) {
      console.error("YouTube API Error:", error);
      return Response.json(
        { error: error.message || "Failed to fetch YouTube data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
