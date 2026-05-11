import { NextResponse } from "next/server";
import { getChannelInfo, getChannelVideos } from "@/lib/youtube";

async function handleRequest({ channelId, maxResults = 20 }) {
  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  let channelTitle = "";
  let channelThumbnail = "";
  try {
    const info = await getChannelInfo(channelId);
    channelTitle = info.title;
    channelThumbnail = info.thumbnail;
  } catch {
    // non-fatal — proceed without channel info
  }

  try {
    const videos = await getChannelVideos(channelId, Math.min(Number(maxResults) || 20, 50));
    return NextResponse.json({
      success: true,
      channelId,
      channelTitle,
      channelThumbnail,
      videos,
      totalCount: videos.length,
    });
  } catch (error) {
    console.error("[channel-videos] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch channel videos" },
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
  const channelId = searchParams.get("channelId");
  const maxResults = searchParams.get("maxResults") || 20;

  if (channelId) {
    return handleRequest({ channelId, maxResults });
  }

  return NextResponse.json({ status: "available" });
}
