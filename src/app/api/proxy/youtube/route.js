const YOUTUBE_API_KEY = "AIzaSyB3zRVgDqXIdMLUn2UDEDCwmAJnb-m1J1Y";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return new Response(JSON.stringify({ error: "Channel ID is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
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

    return new Response(JSON.stringify(videosData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch YouTube data",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
