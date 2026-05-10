import { NextResponse } from "next/server";
import { searchChannels, getChannelVideos } from "@/lib/youtube/fetch-client";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { query, maxResults = 10 } = body;

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const channels = await searchChannels(query, 1);

    if (!channels || channels.length === 0) {
      return NextResponse.json(
        { error: "No channels found for this query", videos: [] },
        { status: 404 }
      );
    }

    const channelId = channels[0].id;
    const videos = await getChannelVideos(channelId, Math.min(Number(maxResults) || 10, 30));

    return NextResponse.json({
      success: true,
      channelId,
      channelTitle: channels[0].title,
      query,
      videos: videos ?? [],
    });
  } catch (error) {
    console.error("[video-search] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search videos" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const maxResults = searchParams.get("maxResults") || 10;

  if (query) {
    return POST(
      new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, maxResults }),
      })
    );
  }

  return NextResponse.json({ status: "available" });
}
