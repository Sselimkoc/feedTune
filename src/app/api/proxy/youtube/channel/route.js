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

    if (!session) {
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
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch channel data");
      }

      return Response.json(data);
    } catch (error) {
      console.error("YouTube API Error:", error);
      return Response.json(
        { error: error.message || "Failed to fetch channel data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
