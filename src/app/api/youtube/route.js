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
    const handle = searchParams.get("handle");

    if (!channelId && !handle) {
      return Response.json(
        { error: "Channel ID or handle is required" },
        { status: 400 }
      );
    }

    // Handle varsa, önce kanal ID'sini bul
    let targetChannelId = channelId;
    if (handle) {
      try {
        // Önce doğrudan handle ile arama yapalım
        const handleResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=@${handle}&maxResults=5&key=${YOUTUBE_API_KEY}`
        );

        if (!handleResponse.ok) {
          const errorData = await handleResponse.json();
          console.error("YouTube Search API Error:", errorData);
          throw new Error(
            errorData.error?.message || "Failed to fetch channel from handle"
          );
        }

        const handleData = await handleResponse.json();

        // Sonuçları kontrol et
        if (!handleData.items || handleData.items.length === 0) {
          // Eğer sonuç yoksa, @ olmadan tekrar deneyelim
          const fallbackResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&maxResults=5&key=${YOUTUBE_API_KEY}`
          );

          if (!fallbackResponse.ok) {
            const fallbackErrorData = await fallbackResponse.json();
            console.error(
              "YouTube Fallback Search API Error:",
              fallbackErrorData
            );
            throw new Error(
              fallbackErrorData.error?.message ||
                "Failed to fetch channel from handle"
            );
          }

          const fallbackData = await fallbackResponse.json();

          if (!fallbackData.items || fallbackData.items.length === 0) {
            return Response.json(
              { error: "Channel not found with given handle" },
              { status: 404 }
            );
          }

          // İlk eşleşen kanalı al
          targetChannelId = fallbackData.items[0].id.channelId;
        } else {
          // İlk eşleşen kanalı al
          targetChannelId = handleData.items[0].id.channelId;
        }

        console.log(
          `Found channel ID for handle @${handle}: ${targetChannelId}`
        );
      } catch (error) {
        console.error("Error fetching channel from handle:", error);
        return Response.json(
          { error: `Failed to fetch channel from handle: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // YouTube API istekleri
    try {
      // 1. Kanal bilgilerini al
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${targetChannelId}&key=${YOUTUBE_API_KEY}`
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
      let videosData = { items: [] };
      try {
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`
        );

        if (!videosResponse.ok) {
          const errorData = await videosResponse.json();
          console.error("YouTube Videos API Error:", errorData);
          throw new Error(errorData.error?.message || "Failed to fetch videos");
        }

        videosData = await videosResponse.json();
      } catch (playlistError) {
        console.error("Error fetching playlist items:", playlistError);
        // Playlist hatası durumunda, doğrudan kanal videolarını almayı deneyelim
        try {
          console.log(
            `Trying alternative method to fetch videos for channel ${targetChannelId}`
          );
          const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${targetChannelId}&order=date&maxResults=10&type=video&key=${YOUTUBE_API_KEY}`
          );

          if (!searchResponse.ok) {
            const searchErrorData = await searchResponse.json();
            console.error("YouTube Search API Error:", searchErrorData);
            // Hata fırlatmıyoruz, boş video listesi ile devam ediyoruz
          } else {
            const searchData = await searchResponse.json();
            if (searchData.items && searchData.items.length > 0) {
              // Search API'den gelen videoları playlistItems formatına dönüştür
              videosData.items = searchData.items.map((item) => ({
                snippet: {
                  resourceId: { videoId: item.id.videoId },
                  title: item.snippet.title,
                  description: item.snippet.description,
                  thumbnails: item.snippet.thumbnails,
                  publishedAt: item.snippet.publishedAt,
                },
              }));
            }
          }
        } catch (searchError) {
          console.error("Error with alternative video fetching:", searchError);
          // Hata fırlatmıyoruz, boş video listesi ile devam ediyoruz
        }
      }

      // 3. Yanıtı formatla
      const formattedResponse = {
        channel: {
          id: targetChannelId,
          title: channelInfo.snippet.title,
          description: channelInfo.snippet.description,
          thumbnail:
            channelInfo.snippet.thumbnails?.default?.url ||
            channelInfo.snippet.thumbnails?.medium?.url ||
            channelInfo.snippet.thumbnails?.high?.url,
          handle: channelInfo.snippet.customUrl,
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

      // Eğer kanal bilgileri alındıysa ama videolar alınamadıysa,
      // en azından kanal bilgilerini döndür
      if (channelInfo) {
        return Response.json({
          channel: {
            id: targetChannelId,
            title: channelInfo.snippet.title,
            description: channelInfo.snippet.description,
            thumbnail:
              channelInfo.snippet.thumbnails?.default?.url ||
              channelInfo.snippet.thumbnails?.medium?.url ||
              channelInfo.snippet.thumbnails?.high?.url,
            handle: channelInfo.snippet.customUrl,
            statistics: {
              subscriberCount: channelInfo.statistics?.subscriberCount,
              videoCount: channelInfo.statistics?.videoCount,
              viewCount: channelInfo.statistics?.viewCount,
            },
            uploadsPlaylistId,
          },
          videos: [],
          warning: "Could not fetch videos for this channel",
        });
      }

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
