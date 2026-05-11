import { NextResponse } from "next/server";
import { searchChannels, getChannelVideos } from "@/lib/youtube";

async function handleRequest({ query, maxResults = 10 }) {
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const channels = await searchChannels(query, 1);

    if (!channels.length) {
      return NextResponse.json(
        { error: "No channels found for this query", videos: [] },
        { status: 404 }
      );
    }

    const channel = channels[0];
    const videos = await getChannelVideos(channel.id, Math.min(Number(maxResults) || 10, 30));

    return NextResponse.json({
      success: true,
      channelId: channel.id,
      channelTitle: channel.title,
      query,
      videos,
    });
  } catch (error) {
    console.error("[video-search] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search videos" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  return handleRequest(body);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const maxResults = searchParams.get("maxResults") || 10;

  if (query) {
    return handleRequest({ query, maxResults });
  }

  return NextResponse.json({ status: "available" });
}
