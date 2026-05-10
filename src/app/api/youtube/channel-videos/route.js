import { NextResponse } from "next/server";
import { getChannelVideos } from "@/lib/youtube/fetch-client";
import { youtubeService } from "@/lib/youtube/service";

function formatVideos(videos) {
  if (!Array.isArray(videos)) return [];
  return videos.map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description
      ? video.description.length > 150
        ? video.description.substring(0, 150) + "..."
        : video.description
      : "",
    thumbnail: video.thumbnail,
    publishedAt: video.publishedAt,
    url: video.url || `https://youtube.com/watch?v=${video.id}`,
    channelId: video.channelId,
    channelTitle: video.channelTitle,
  }));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { channelId, maxResults = 20 } = body;

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  let channelTitle = "";
  let channelThumbnail = "";
  try {
    const channelInfo = await youtubeService.getChannelInfo(channelId);
    if (channelInfo) {
      channelTitle = channelInfo.title || "";
      channelThumbnail = channelInfo.thumbnail || "";
    }
  } catch {
    // non-fatal — proceed without channel info
  }

  try {
    const videos = await getChannelVideos(channelId, Math.min(maxResults, 50));
    return NextResponse.json({
      success: true,
      channelId,
      channelTitle,
      channelThumbnail,
      videos: formatVideos(videos),
      totalCount: videos?.length ?? 0,
    });
  } catch (error) {
    console.error("[channel-videos] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch channel videos" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const maxResults = searchParams.get("maxResults") || 20;

  if (channelId) {
    return POST(
      new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, maxResults }),
      })
    );
  }

  return NextResponse.json({ status: "available" });
}
