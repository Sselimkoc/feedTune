import { ApiResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";
import axios from "axios";

async function convertYoutubeUrlToRss(url) {
  const urlObj = new URL(url);
  const cleanUrl = url.split("#")[0];

  if (urlObj.pathname.includes("/channel/")) {
    const channelId = urlObj.pathname.split("/channel/")[1].split("/")[0];
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }

  if (urlObj.pathname.includes("/user/")) {
    const username = urlObj.pathname.split("/user/")[1].split("/")[0];
    return `https://www.youtube.com/feeds/videos.xml?user=${username}`;
  }

  if (urlObj.pathname.includes("/@")) {
    const response = await axios.get(cleanUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FeedTune/1.0)" },
      timeout: 10000,
    });
    const html = response.data;

    const channelId =
      html.match(/"externalId":\s*"(UC[a-zA-Z0-9_-]{22})"/)?.[1] ||
      html.match(/"channelId":\s*"(UC[a-zA-Z0-9_-]{22})"/)?.[1] ||
      html.match(/<meta\s+itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]{22})"/)?.[1];

    if (channelId) {
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    }
    throw new Error("Could not extract channel ID from @ URL");
  }

  if (urlObj.pathname.includes("/watch") || urlObj.hostname === "youtu.be") {
    const videoId =
      urlObj.hostname === "youtu.be"
        ? urlObj.pathname.substring(1)
        : urlObj.searchParams.get("v");

    if (videoId) {
      const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FeedTune/1.0)" },
        timeout: 10000,
      });
      const channelId = response.data.match(/"channelId":\s*"(UC[a-zA-Z0-9_-]{22})"/)?.[1];
      if (channelId) {
        return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      }
      throw new Error("Could not extract channel ID from video URL");
    }
  }

  if (urlObj.pathname.includes("/playlist") || urlObj.search.includes("list=")) {
    throw new Error("YouTube playlists are not supported");
  }

  throw new Error(`Unsupported YouTube URL format: ${url}`);
}

export const POST = withAuth(async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponse.badRequest("Invalid JSON body");
  }

  const { url } = body;
  if (!url) return ApiResponse.badRequest("url is required");

  try {
    new URL(url);
  } catch {
    return ApiResponse.badRequest("Invalid URL format");
  }

  try {
    const rssUrl = await convertYoutubeUrlToRss(url);
    return ApiResponse.ok({ rssUrl });
  } catch (error) {
    console.error("[youtube/to-rss] error:", error);
    return ApiResponse.error(error.message || "Failed to convert YouTube URL to RSS");
  }
});

export function GET() {
  return ApiResponse.ok({ status: "available" });
}
