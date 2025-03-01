import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error("YOUTUBE_API_KEY is not defined in environment variables");
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Authentication error:", userError);
      return Response.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return Response.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    // YouTube API istekleri
    try {
      // 1. Kanal bilgilerini al
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );

      if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        console.error("YouTube Channel API Error:", errorData);
        throw new Error(
          errorData.error?.message || "Failed to fetch channel data"
        );
      }

      const channelData = await channelResponse.json();

      if (!channelData.items || channelData.items.length === 0) {
        throw new Error("Channel not found");
      }

      const channelInfo = channelData.items[0];
      const uploadsPlaylistId =
        channelInfo.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        throw new Error("Could not find uploads playlist for this channel");
      }

      // 2. Son videoları al
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`
      );

      if (!videosResponse.ok) {
        const errorData = await videosResponse.json();
        console.error("YouTube Videos API Error:", errorData);
        throw new Error(errorData.error?.message || "Failed to fetch videos");
      }

      const videosData = await videosResponse.json();

      // 3. Yanıtı formatla
      const formattedResponse = {
        channel: {
          id: channelId,
          title: channelInfo.snippet.title,
          description: channelInfo.snippet.description,
          thumbnail:
            channelInfo.snippet.thumbnails?.default?.url ||
            channelInfo.snippet.thumbnails?.medium?.url ||
            channelInfo.snippet.thumbnails?.high?.url,
          statistics: {
            subscriberCount: channelInfo.statistics?.subscriberCount,
            videoCount: channelInfo.statistics?.videoCount,
            viewCount: channelInfo.statistics?.viewCount,
          },
          uploadsPlaylistId,
        },
        videos: videosData.items.map((item) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt,
          link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        })),
      };

      return Response.json(formattedResponse);
    } catch (error) {
      console.error("YouTube API Error:", error);
      return Response.json(
        { error: error.message || "Failed to fetch YouTube data" },
        { status: error.status || 500 }
      );
    }
  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
